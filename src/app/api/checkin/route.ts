import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { token, scannerId } = await request.json()

  if (!token) {
    return NextResponse.json({ error: 'token required' }, { status: 400 })
  }

  const db = createServiceClient()

  // Atomic update via stored procedure
  const { data, error } = await db.rpc('checkin_ticket', { p_token: token })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Invalid ticket' }, { status: 404 })
  }

  const row = data[0] as {
    status: string
    scan_count: number
    checked_in_at: string | null
    delegate_id: string
  }

  const result = row.scan_count === 1 ? 'accepted' : 'denied'

  // Fetch delegate name
  const { data: delegate } = await db
    .from('delegates')
    .select('name')
    .eq('id', row.delegate_id)
    .single()

  // Fetch ticket id for scan_logs
  const { data: ticket } = await db
    .from('tickets')
    .select('id')
    .eq('token', token)
    .single()

  // Log the scan (fire and forget — don't block response)
  if (ticket) {
    db.from('scan_logs').insert({
      ticket_id: ticket.id,
      result,
      scanned_by: scannerId ?? null,
    })
  }

  return NextResponse.json({
    result,
    delegateName: delegate?.name ?? 'Unknown',
    checkedInAt: row.checked_in_at,
    scanCount: row.scan_count,
  })
}

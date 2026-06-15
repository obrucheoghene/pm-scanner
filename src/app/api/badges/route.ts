import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateBadgePDF } from '@/lib/pdf'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('eventId')

  if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 })

  const db = createServiceClient()
  const { data } = await db
    .from('delegates')
    .select('name, color, tickets(token)')
    .eq('event_id', eventId)
    .order('created_at')

  const badges = (data ?? []).map((d: { name: string; color: string | null; tickets: { token: string }[] | { token: string } | null }) => ({
    name: d.name,
    color: d.color,
    token: Array.isArray(d.tickets) ? d.tickets[0]?.token : (d.tickets as { token: string } | null)?.token ?? '',
  })).filter(b => b.token)

  const pdf = await generateBadgePDF(badges)

  return new NextResponse(pdf as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="badges.pdf"',
    },
  })
}

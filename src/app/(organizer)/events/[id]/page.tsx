import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Scan } from 'lucide-react'
import EventStatusBadge from '@/components/EventStatusBadge'
import AddDelegateForm from '@/components/AddDelegateForm'
import DelegateTable from '@/components/DelegateTable'
import AddScannerForm from '@/components/AddScannerForm'
import type { Delegate, Ticket, Event, Scanner } from '@/types'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const db = createServiceClient()

  const [{ data: event }, { data: delegates }, { data: tickets }, { data: scanners }] =
    await Promise.all([
      db.from('events').select('*').eq('id', id).single(),
      db.from('delegates').select('*').eq('event_id', id).order('created_at'),
      db.from('tickets').select('*').eq('event_id', id),
      db.from('scanners').select('*').eq('event_id', id).order('created_at'),
    ])

  if (!event) notFound()

  const ticketByDelegate: Record<string, Ticket> = {}
  for (const t of tickets ?? []) ticketByDelegate[t.delegate_id] = t

  const rows = (delegates ?? []).map((d: Delegate) => ({
    delegate: d,
    ticket: ticketByDelegate[d.id],
  })).filter(r => r.ticket)

  const scannerList = scanners as Scanner[]

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <Link href="/events" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-3 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
          Events
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{(event as Event).name}</h1>
              <EventStatusBadge status={(event as Event).status} />
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {(event as Event).date ?? 'No date'} · {(event as Event).venue ?? 'No venue'}
            </p>
          </div>

          {/* Scanner button lives here — top of page, prominent */}
          <AddScannerForm eventId={id} />
        </div>

        {/* Scanner accounts — compact chips row */}
        {scannerList.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {scannerList.map(s => (
              <div
                key={s.id}
                className="inline-flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1 text-xs"
              >
                <Scan className="w-3 h-3 text-indigo-500" />
                <span className="font-medium">{s.name}</span>
                <span className="text-gray-400 font-mono">@{s.username}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delegates section */}
      <section className="space-y-4">
        <h2 className="font-semibold text-lg">
          Delegates <span className="text-gray-400 font-normal text-base">({rows.length})</span>
        </h2>
        <AddDelegateForm eventId={id} />
        <DelegateTable rows={rows} eventId={id} />
      </section>
    </div>
  )
}

import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function TicketPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const db = createServiceClient()

  const { data: ticket } = await db
    .from('tickets')
    .select('id, delegate_id, status, checked_in_at')
    .eq('token', token)
    .single()

  if (!ticket) notFound()

  const { data: delegate } = await db
    .from('delegates')
    .select('name')
    .eq('id', ticket.delegate_id)
    .single()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-xs w-full">
        <h1 className="text-xl font-bold mb-1">{delegate?.name ?? 'Delegate'}</h1>
        <p className="text-sm text-gray-400 mb-6">Event ticket</p>

        {/* QR code */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/qr?token=${encodeURIComponent(token)}&size=280`}
          alt="QR code"
          width={280}
          height={280}
          className="mx-auto rounded-lg"
        />

        <div className="mt-6">
          {ticket.status === 'checked_in' ? (
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              Checked in{' '}
              {ticket.checked_in_at &&
                new Date(ticket.checked_in_at).toLocaleTimeString()}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
              Not yet checked in
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

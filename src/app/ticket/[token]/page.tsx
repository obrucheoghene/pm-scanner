import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CheckCircle2, Clock } from 'lucide-react'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const db = createServiceClient()
  const { data: ticket } = await db.from('tickets').select('event_id').eq('token', token).single()
  if (!ticket) return {}
  const { data: event } = await db.from('events').select('name, image_url').eq('id', ticket.event_id).single()
  if (!event) return {}

  const title = event.name
  const description = `You are invited to ${event.name}`
  const ogImages = event.image_url
    ? [{ url: event.image_url as string, width: 1200, height: 630 }]
    : []

  return {
    title,
    description,
    openGraph: { title, description, images: ogImages },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: event.image_url ? [event.image_url as string] : [],
    },
  }
}

export default async function TicketPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const db = createServiceClient()

  const { data: ticket } = await db
    .from('tickets')
    .select('id, delegate_id, event_id, status, checked_in_at')
    .eq('token', token)
    .single()

  if (!ticket) notFound()

  const [{ data: delegate }, { data: event }] = await Promise.all([
    db.from('delegates').select('name, color').eq('id', ticket.delegate_id).single(),
    db.from('events').select('name, date, venue, image_url').eq('id', ticket.event_id).single(),
  ])

  const accent =
    delegate?.color && delegate.color !== '#000000'
      ? delegate.color
      : '#4f46e5'

  const checkedIn = ticket.status === 'checked_in'

  const eventDate = event?.date
    ? new Date(event.date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  const checkinTime = ticket.checked_in_at
    ? new Date(ticket.checked_in_at).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  const qrUrl = `/api/qr?token=${encodeURIComponent(token)}&size=240${delegate?.color ? `&color=${encodeURIComponent(delegate.color)}` : ''}`

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-4 py-12 relative ${
        event?.image_url
          ? 'bg-cover bg-center bg-no-repeat'
          : 'bg-linear-to-br from-gray-950 via-gray-900 to-black'
      }`}
      style={event?.image_url ? { backgroundImage: `url(${event.image_url})` } : undefined}
    >
      {event?.image_url && (
        <div className="absolute inset-0 bg-black/65" />
      )}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Prime Scanner" width={28} height={28} className="rounded-lg opacity-80" />
        <span className="text-white/60 text-sm font-medium tracking-wide">Prime Scanner</span>
      </div>

      {/* Pass card */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Accent bar */}
        <div className="h-2.5 w-full" style={{ backgroundColor: accent }} />

        {/* Card header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">
            Official Access Pass
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={20} height={20} className="rounded opacity-30" />
        </div>

        {/* Tear line */}
        <div className="mx-6 border-t border-dashed border-gray-200" />

        {/* Event */}
        <div className="px-6 pt-5 pb-4">
          <p className="text-[10px] font-bold tracking-[0.18em] text-gray-400 uppercase mb-1">Event</p>
          <h1 className="text-2xl font-black text-gray-900 leading-tight uppercase">
            {event?.name ?? 'Event'}
          </h1>
          {(eventDate || event?.venue) && (
            <p className="text-xs text-gray-400 mt-1.5">
              {[eventDate, event?.venue].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {/* Tear line */}
        <div className="mx-6 border-t border-dashed border-gray-200" />

        {/* Delegate */}
        <div className="px-6 pt-5 pb-5">
          <p className="text-[10px] font-bold tracking-[0.18em] text-gray-400 uppercase mb-1">Delegate</p>
          <h2 className="text-3xl font-black text-gray-900 leading-tight">
            {delegate?.name ?? 'Guest'}
          </h2>
        </div>

        {/* Tear line */}
        <div className="mx-6 border-t border-dashed border-gray-200" />

        {/* QR code */}
        <div className="flex flex-col items-center px-6 pt-6 pb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt="Entry QR code"
            width={240}
            height={240}
            className="rounded-xl"
          />
          <p className="text-[10px] text-gray-400 tracking-wider mt-3 uppercase">
            Scan to verify · Present at entry gate
          </p>
        </div>

        {/* Tear line */}
        <div className="mx-6 border-t border-dashed border-gray-200" />

        {/* Check-in status */}
        <div className="px-6 py-4">
          {checkedIn ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">
                Checked in{checkinTime ? ` at ${checkinTime}` : ''}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">Present at entry gate</span>
            </div>
          )}
        </div>
      </div>

      <p className="text-white/20 text-xs mt-8 tracking-wide">
        This pass is personal and non-transferable
      </p>
      </div>
    </div>
  )
}

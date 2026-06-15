'use client'

import Link from 'next/link'
import type { Event, EventStatus } from '@/types'
import { Trash2, Users } from 'lucide-react'
import { updateEventStatus, deleteEvent } from '@/app/(organizer)/events/actions'

const STATUS_BORDER: Record<EventStatus, string> = {
  draft: 'border-t-indigo-300',
  live: 'border-t-green-400',
  closed: 'border-t-gray-300',
}

const STATUS_DOT: Record<EventStatus, string> = {
  draft: 'bg-indigo-400',
  live: 'bg-green-400',
  closed: 'bg-gray-400',
}

export default function EventCard({ event }: { event: Event }) {
  return (
    <div className={`bg-white border border-gray-200 border-t-4 ${STATUS_BORDER[event.status]} rounded-xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-base leading-tight truncate">{event.name}</h2>
          <p className="text-xs text-gray-400 mt-1">
            {event.date ? new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No date'}
            {event.venue ? ` · ${event.venue}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm('Delete this event and all its delegates?')) {
              deleteEvent(event.id)
            }
          }}
          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
          title="Delete event"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/events/${event.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Users className="w-3.5 h-3.5" />
          Manage delegates
        </Link>

        <StatusSelect id={event.id} current={event.status} />
      </div>
    </div>
  )
}

function StatusSelect({ id, current }: { id: string; current: EventStatus }) {
  const statuses: EventStatus[] = ['draft', 'live', 'closed']
  return (
    <form>
      <div className="relative inline-flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[current]}`} />
        <select
          defaultValue={current}
          onChange={async e => {
            await updateEventStatus(id, e.target.value as EventStatus)
          }}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
        >
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </form>
  )
}

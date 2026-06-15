import { createServiceClient } from '@/lib/supabase/server'
import CreateEventForm from '@/components/CreateEventForm'
import EventCard from '@/components/EventCard'
import type { Event } from '@/types'
import { CalendarDays } from 'lucide-react'

export default async function EventsPage() {
  const db = createServiceClient()
  const { data: events } = await db
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your events and delegate check-ins</p>
        </div>
        <CreateEventForm />
      </div>

      {!events?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-indigo-50 rounded-2xl p-5 mb-4">
            <CalendarDays className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">No events yet</h3>
          <p className="text-sm text-gray-400 max-w-xs">
            Create your first event to start managing delegates and issuing QR tickets.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(events as Event[]).map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}

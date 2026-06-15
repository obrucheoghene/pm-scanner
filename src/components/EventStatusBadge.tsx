import type { EventStatus } from '@/types'

const styles: Record<EventStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  live:  'bg-green-100 text-green-700',
  closed:'bg-red-100 text-red-600',
}

export default function EventStatusBadge({ status }: { status: EventStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  )
}

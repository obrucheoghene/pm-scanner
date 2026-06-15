export type EventStatus = 'draft' | 'live' | 'closed'
export type TicketStatus = 'unused' | 'checked_in'
export type ScanResult = 'accepted' | 'denied'

export interface Event {
  id: string
  name: string
  date: string | null
  venue: string | null
  status: EventStatus
  image_url: string | null
  created_at: string
}

export interface Delegate {
  id: string
  event_id: string
  name: string
  color: string | null
  created_at: string
}

export interface Ticket {
  id: string
  delegate_id: string
  event_id: string
  token: string
  status: TicketStatus
  scan_count: number
  checked_in_at: string | null
  created_at: string
}

export interface Scanner {
  id: string
  event_id: string
  name: string
  username: string
  email: string
  auth_user_id: string | null
  created_at: string
}

export interface ScanLog {
  id: string
  ticket_id: string
  scanned_at: string
  result: ScanResult
  scanned_by: string | null
}

export interface DelegateRow {
  delegate: Delegate
  ticket: Ticket
}

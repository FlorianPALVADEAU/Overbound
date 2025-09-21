import { EventStatus, Timestamp, UUID } from './base.type'
import type { Ticket } from './Ticket'

export interface Event {
  id: UUID
  slug: string
  title: string
  subtitle?: string | null
  date: Timestamp
  location: string
  latitude?: number | null
  longitude?: number | null
  capacity: number
  status: EventStatus
  external_provider?: string | null
  external_event_id?: string | null
  external_url?: string | null
  description?: string | null
  image_url?: string | null
  created_at: Timestamp
  updated_at: Timestamp
}

export interface EventWithTickets extends Event {
  tickets: Ticket[] | null
}

export interface EventFilters {
  status?: EventStatus[]
  location?: string
  date_from?: string
  date_to?: string
  capacity_min?: number
  capacity_max?: number
}

export interface EventStats {
  total_registrations: number
  total_revenue: number
  capacity_usage: number
  pending_approvals: number
  checked_in_count: number
}

import { Currency, DocumentType, Timestamp, UUID } from './base.type'

export interface TicketEventSummary {
  id: UUID
  title: string
  date: Timestamp
  status: string
}

export interface TicketRaceSummary {
  id: UUID
  name: string
  type: string
  difficulty: number
  target_public: string
  distance_km: number | null
  is_universal?: boolean
}

export type TicketDepartureMode = 'none' | 'wave' | 'fixed'
export type TicketDepartureChangePolicy = 'preserve' | 'clear' | 'reassign'

export interface TicketOperationsConfig {
  /** Stable extension point for future ticket behavior factories. */
  profile_key?: string | null
  departure_mode?: TicketDepartureMode
  departure_change_policy?: TicketDepartureChangePolicy
  [key: string]: unknown
}

export interface Ticket {
  id: UUID
  event_id: UUID
  race_id: UUID | null
  name: string
  description?: string | null
  distance_km: number | null
  final_price_cents: number
  sales_start?: Timestamp | null
  sales_end?: Timestamp | null
  currency: Currency | null
  max_participants: number
  requires_document: boolean
  document_types: DocumentType[] | null
  operations_config?: TicketOperationsConfig | null
  created_at: Timestamp
  updated_at: Timestamp
  event?: TicketEventSummary | null
  race?: TicketRaceSummary | null
}

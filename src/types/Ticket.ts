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
}

export interface Ticket {
  id: UUID
  event_id: UUID
  race_id: UUID | null
  name: string
  description?: string | null
  distance_km: number | null
  base_price_cents: number | null
  sales_start?: Timestamp | null
  sales_end?: Timestamp | null
  regular_price_cents?: number | null
  is_early_bird?: boolean
  early_bird_end?: Timestamp | null
  currency: Currency | null
  max_participants: number
  requires_document: boolean
  document_types: DocumentType[] | null
  created_at: Timestamp
  updated_at: Timestamp
  event?: TicketEventSummary | null
  race?: TicketRaceSummary | null
}

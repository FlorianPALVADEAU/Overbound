import { Timestamp, Currency, UUID } from "./base.type";

export interface Ticket {
  id: UUID;
  event_id: UUID;
  name: string;
  distance_km: number | null;
  base_price_cents: number | null;
  quota: number;
  sales_start: Timestamp | null;
  sales_end: Timestamp | null;
  external_ticket_id: string | null;
  external_price_name: string | null;
  race_id: UUID | null;
  max_participants: number;
  requires_document: boolean;
  document_types: DocumentType[] | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  description: string | null;
  currency: Currency | null;
}
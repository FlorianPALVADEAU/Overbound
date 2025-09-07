import { ClaimStatus, Timestamp, ApprovalStatus, Provider, UUID, OrderStatus, Currency } from "./base.type";

export interface Registration {
  id: UUID;
  order_id: UUID;
  user_id: UUID | null;
  email: string;
  event_id: UUID | null;
  ticket_id: UUID | null;
  provider: Provider;
  provider_registration_id: string | null;
  qr_code_token: string | null;
  checked_in: boolean;
  claim_status: ClaimStatus;
  created_at: Timestamp;
  document_url: string | null;
  document_filename: string | null;
  document_size: number | null;
  approval_status: ApprovalStatus;
  approved_by: UUID | null;
  approved_at: Timestamp | null;
  rejection_reason: string | null;
}

export interface MyRegistration {
  registration_id: UUID;
  email: string;
  checked_in: boolean;
  claim_status: ClaimStatus;
  event_title: string | null;
  event_date: Timestamp | null;
  event_location: string | null;
  ticket_name: string | null;
  order_status: OrderStatus | null;
  amount_total: number | null;
  currency: Currency | null;
  created_at: Timestamp;
}

export interface RegistrationFilters {
  event_id?: UUID;
  user_id?: UUID;
  status?: ClaimStatus[];
  approval_status?: ApprovalStatus[];
  checked_in?: boolean;
  date_from?: string;
  date_to?: string;
}
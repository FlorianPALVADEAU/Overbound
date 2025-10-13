import {
  ApprovalStatus,
  ClaimStatus,
  Currency,
  OrderStatus,
  Provider,
  Timestamp,
  UUID,
} from './base.type'
import type { NotificationPreference } from './NotificationPreference'
import type { Order } from './Order'
import type { Ticket } from './Ticket'
import type { Upsell } from './Upsell'

export interface Registration {
  id: UUID
  order_id: UUID
  user_id: UUID | null
  email: string
  event_id: UUID | null
  ticket_id: UUID | null
  provider: Provider
  provider_registration_id: string | null
  qr_code_token: string | null
  checked_in: boolean
  claim_status: ClaimStatus
  created_at: Timestamp
  document_url: string | null
  document_filename: string | null
  document_size: number | null
  approval_status: ApprovalStatus
  approved_by: UUID | null
  approved_at: Timestamp | null
  rejection_reason: string | null
  guarantor_user_id?: UUID | null
  affiliation_token?: string | null
  affiliation_deadline?: Timestamp | null
  is_affiliated: boolean
}

export interface MyRegistration {
  registration_id: UUID
  email: string
  checked_in: boolean
  claim_status: ClaimStatus
  event_title: string | null
  event_date: Timestamp | null
  event_location: string | null
  ticket_name: string | null
  order_status: OrderStatus | null
  amount_total: number | null
  currency: Currency | null
  created_at: Timestamp
}

export interface RegistrationFilters {
  event_id?: UUID
  user_id?: UUID
  status?: ClaimStatus[]
  approval_status?: ApprovalStatus[]
  checked_in?: boolean
  date_from?: string
  date_to?: string
}

export interface RegistrationSignature {
  registration_id: UUID
  regulation_version: string
  signed_at: Timestamp
  signature_data?: string
}

export type RegistrationApprovalStatus = ApprovalStatus

export interface RegistrationProfileSummary {
  id: UUID
  full_name: string | null
}

export interface AdminRegistration extends Registration {
  event: {
    id: UUID
    title: string
    date: Timestamp
    location: string
  } | null
  ticket: Pick<Ticket, 'id' | 'name' | 'distance_km'> | null
  order: Pick<Order, 'id' | 'amount_total' | 'currency' | 'status'> | null
  approved_by_profile?: RegistrationProfileSummary | null
  notification_preferences?: NotificationPreference | null
  upsells?: Upsell[] | null
  signatures?: RegistrationSignature[] | null
  requires_document: boolean,
  claim_status: ClaimStatus
}

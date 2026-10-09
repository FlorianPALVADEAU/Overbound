/** Identity typed at checkout for one bib (stored in the signed waiver). */
export interface AccountParticipant {
  first_name: string
  last_name: string
  birth_date: string | null
}

/** One registration (= one bib) as exposed by `GET /api/account/registrations`. */
export interface AccountRegistrationItem {
  registration_id: string
  user_id: string
  /** Participant email; equals the buyer's email unless another one was given at checkout. */
  email?: string | null
  /** Who runs with this bib; null for the few registrations without a signed waiver. */
  participant?: AccountParticipant | null
  race_format?: 'open' | 'ranked' | null
  /** The transfer fee was paid: the hand-over link can be shared. */
  transfer_unlocked?: boolean
  /** Bib bought with the "billet flexible" option. */
  flexible_refund?: boolean
  /** Amount refunded if cancelled now; null when cancellation is not (or no longer) possible. */
  flexible_refund_amount_cents?: number | null
  flexible_refund_deadline?: string | null
  order_id?: string | null
  checked_in: boolean
  claim_status: string
  qr_code_token: string | null
  qr_code_data_url: string | null
  transfer_token: string | null
  created_at: string
  start_time?: string | null
  wave_index?: number | null
  wave_capacity?: number | null
  wave_position?: number | null
  auto_assigned?: boolean | null
  distance_ideal_km?: number | null
  distance_min_km?: number | null
  assignment_constraint_breached?: boolean | null
  bib_number?: number | null
  ticket_id: string | null
  ticket_name: string | null
  event_id: string | null
  event_title: string | null
  event_date: string | null
  event_location: string | null
  amount_total: number | null
  currency: string | null
  order_status: string | null
  invoice_url: string | null
  order_created_at: string | null
  approval_status: 'pending' | 'approved' | 'rejected'
  document_url: string | null
  requires_document: boolean
  document_requires_attention: boolean
  documents_count?: number
  required_documents_count?: number
  documents_complete?: boolean
  required_document_types?: string[]
  uploaded_document_types?: string[]
}

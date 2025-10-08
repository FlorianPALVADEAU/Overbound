import type { Timestamp, UUID } from './base.type'

export interface AdminRequestLog {
  id: UUID
  created_at: Timestamp
  method: string
  path: string
  query_params?: Record<string, unknown> | null
  body?: unknown
  user_id?: UUID | null
  user_email?: string | null
  status_code: number
  duration_ms: number
  ip_address?: string | null
  action_type?: string | null
  summary: string
  metadata?: Record<string, unknown> | null
  error_message?: string | null
}

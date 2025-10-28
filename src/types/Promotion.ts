import { Timestamp, UUID } from './base.type'

export interface Promotion {
  id: UUID
  title: string
  description: string
  link_url: string
  link_text: string
  starts_at: Timestamp
  ends_at: Timestamp
  is_active: boolean
  created_at: Timestamp
  updated_at: Timestamp
}

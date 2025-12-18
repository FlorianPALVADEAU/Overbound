import { Currency, Timestamp, UUID } from './base.type'

export interface PromotionalCodeEvent {
  event_id: UUID
}

export interface PromotionalCode {
  id: UUID
  code: string
  name: string
  description?: string | null
  discount_percent?: number | null
  discount_amount?: number | null
  currency: Currency
  valid_from: Timestamp
  valid_until: Timestamp
  usage_limit?: number | null
  used_count: number
  is_active: boolean
  tier_order?: number | null // Sequential order for tier progression (1, 2, 3...). NULL = not part of progression
  event_price_tier_id?: UUID | null // Optional link to EventPriceTier for display
  auto_activate?: boolean // Auto-activate when previous tier expires
  created_at: Timestamp
  updated_at: Timestamp
  events?: PromotionalCodeEvent[]
}

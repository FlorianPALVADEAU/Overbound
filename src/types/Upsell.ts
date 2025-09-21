import { Currency, Timestamp, UUID } from './base.type'

export type UpsellType = 'tshirt' | 'photos' | 'other'

export interface Upsell {
  id: UUID
  name: string
  description?: string | null
  price_cents: number
  currency: Currency
  type: UpsellType
  event_id?: UUID | null
  is_active: boolean
  stock_quantity?: number | null
  image_url?: string | null
  created_at: Timestamp
  updated_at: Timestamp
  event?: {
    id: UUID
    title: string
    date: Timestamp
  } | null
}

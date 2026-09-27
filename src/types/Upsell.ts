import { Currency, Timestamp, UUID } from './base.type'

export type UpsellType = 'tshirt' | 'photos' | 'patch' | 'other'

export interface UpsellOptions {
  sizes?: string[] | null
}

export type UpsellImageSource = 'external' | 'upload'

export interface UpsellImage {
  id: UUID
  upsell_id: UUID
  source: UpsellImageSource
  external_url?: string | null
  storage_path?: string | null
  /** Resolved public URL returned by read APIs; never persisted. */
  url?: string | null
  alt_text?: string | null
  position: number
  created_at: Timestamp
  updated_at: Timestamp
}

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
  images?: UpsellImage[]
  options?: UpsellOptions | null
  created_at: Timestamp
  updated_at: Timestamp
  event?: {
    id: UUID
    title: string
    date: Timestamp
  } | null
}

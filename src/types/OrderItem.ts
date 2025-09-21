import { Timestamp, UUID } from './base.type'

export type OrderItemType = 'ticket' | 'upsell'

export interface OrderItem {
  id: UUID
  order_id: UUID
  item_id: UUID
  item_type: OrderItemType
  quantity: number
  unit_price_cents: number
  total_price_cents: number
  promotional_code_id?: UUID | null
  discount_applied_cents: number
  created_at: Timestamp
}

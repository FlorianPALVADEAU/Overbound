import { z } from 'zod'
import { decodeKeysetCursor, encodeKeysetCursor, type KeysetCursor } from './keysetCursor'

export const ORDER_STATUSES = ['paid', 'pending', 'cancelled', 'refunded'] as const
export type OrderListStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_STATUS_LABEL: Record<OrderListStatus, string> = {
  paid: 'Payée',
  pending: 'En attente',
  cancelled: 'Annulée',
  refunded: 'Remboursée',
}

/** French label of an order status; an unknown value is shown as received rather than hidden. */
export const orderStatusLabel = (status: string | null): string => {
  if (!status) return '—'
  return ORDER_STATUS_LABEL[status as OrderListStatus] ?? status
}

export const ordersQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(25).max(100).default(50),
  status: z.enum(ORDER_STATUSES).optional(),
  query: z.string().trim().min(1).max(160).optional(),
  event: z.string().uuid().optional(),
})
export type OrdersQuery = z.infer<typeof ordersQuerySchema>

export type OrdersCursor = KeysetCursor
export const encodeOrdersCursor = encodeKeysetCursor
export const decodeOrdersCursor = decodeKeysetCursor

export interface OrderRow {
  id: string
  email: string
  status: string | null
  amount_total: number | null
  currency: string | null
  provider: string | null
  provider_order_id: string | null
  invoice_url: string | null
  created_at: string
}
export interface OrderRegistrationRow {
  id: string
  order_id: string | null
  cancelled_at: string | null
  event: { title: string | null } | Array<{ title: string | null }> | null
}

export interface OrderListItem {
  id: string
  email: string
  status: string | null
  amountCents: number | null
  currency: string
  createdAt: string
  provider: string | null
  providerOrderId: string | null
  invoiceUrl: string | null
  registrations: number
  cancelledRegistrations: number
  refundedCents: number
  events: string[]
  /** Set only for a Stripe payment: where the payment lives in the Stripe dashboard. */
  stripeUrl: string | null
  /** The receipt can be re-sent only for a Stripe payment intent. */
  canResendReceipt: boolean
}

const firstRelation = <T,>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null)

const isStripePayment = (order: OrderRow) =>
  order.provider === 'stripe' && typeof order.provider_order_id === 'string' && order.provider_order_id.startsWith('pi_')

/** Joins an order page with its registrations and the refunds that went through. */
export function summarizeOrders(params: {
  orders: OrderRow[]
  registrations: OrderRegistrationRow[]
  refunds: Array<{ registration_id: string; amount_cents: number }>
}): OrderListItem[] {
  const registrationsByOrder = new Map<string, OrderRegistrationRow[]>()
  const orderByRegistration = new Map<string, string>()
  for (const registration of params.registrations) {
    if (!registration.order_id) continue
    registrationsByOrder.set(registration.order_id, [...(registrationsByOrder.get(registration.order_id) ?? []), registration])
    orderByRegistration.set(registration.id, registration.order_id)
  }
  const refundedByOrder = new Map<string, number>()
  for (const refund of params.refunds) {
    const orderId = orderByRegistration.get(refund.registration_id)
    if (orderId) refundedByOrder.set(orderId, (refundedByOrder.get(orderId) ?? 0) + refund.amount_cents)
  }

  return params.orders.map((order) => {
    const registrations = registrationsByOrder.get(order.id) ?? []
    const stripe = isStripePayment(order)
    return {
      id: order.id,
      email: order.email,
      status: order.status,
      amountCents: order.amount_total,
      currency: (order.currency ?? 'eur').toLowerCase(),
      createdAt: order.created_at,
      provider: order.provider,
      providerOrderId: order.provider_order_id,
      invoiceUrl: order.invoice_url,
      registrations: registrations.length,
      cancelledRegistrations: registrations.filter((registration) => registration.cancelled_at).length,
      refundedCents: refundedByOrder.get(order.id) ?? 0,
      events: [...new Set(registrations.map((registration) => firstRelation(registration.event)?.title).filter((title): title is string => Boolean(title)))],
      stripeUrl: stripe ? `https://dashboard.stripe.com/payments/${order.provider_order_id}` : null,
      canResendReceipt: stripe && order.status === 'paid',
    }
  })
}

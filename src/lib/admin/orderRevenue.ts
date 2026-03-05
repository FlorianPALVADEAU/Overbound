type NullableNumber = number | null | undefined

export interface OrderSummaryInput {
  id: string
  amount_total?: NullableNumber
  currency?: string | null
  status?: string | null
}

export interface RegistrationOrderRef {
  order_id?: string | null
}

export interface OrderSummaryOutput {
  id: string
  amount_total: number | null
  amount_per_registration: number | null
  registrations_count: number
  currency: string | null
  status: string | null
}

export function countRegistrationsByOrder(registrations: RegistrationOrderRef[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const row of registrations) {
    const orderId = row.order_id ?? null
    if (!orderId) continue
    counts.set(orderId, (counts.get(orderId) ?? 0) + 1)
  }
  return counts
}

export function buildOrderSummaries(params: {
  orders: OrderSummaryInput[]
  registrationsByOrder: Map<string, number>
}): Map<string, OrderSummaryOutput> {
  const map = new Map<string, OrderSummaryOutput>()

  for (const order of params.orders) {
    const registrationsCount = params.registrationsByOrder.get(order.id) ?? 1
    const amountTotal =
      typeof order.amount_total === 'number' ? Number(order.amount_total) : null

    map.set(order.id, {
      id: order.id,
      amount_total: amountTotal,
      amount_per_registration:
        amountTotal != null && registrationsCount > 0
          ? Math.round(amountTotal / registrationsCount)
          : null,
      registrations_count: registrationsCount,
      currency: order.currency ?? null,
      status: order.status ?? null,
    })
  }

  return map
}

export function computeUniquePaidRevenueCents(orders: OrderSummaryInput[]): {
  totalRevenueCents: number
  revenueCurrency: string | null
} {
  let totalRevenueCents = 0
  let revenueCurrency: string | null = null

  for (const order of orders) {
    if (order.status !== 'paid') continue
    if (typeof order.amount_total !== 'number') continue
    totalRevenueCents += Number(order.amount_total)
    if (!revenueCurrency && order.currency) {
      revenueCurrency = order.currency
    }
  }

  return { totalRevenueCents, revenueCurrency }
}


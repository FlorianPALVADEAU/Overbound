import type { DiscountTarget } from './types'

/** What is still left to pay, per discount target. Never mutated: each deduction returns a new balance. */
export interface RemainingBalance {
  readonly tickets: number
  readonly upsells: Readonly<Record<string, number>>
}

export const createBalance = (tickets: number, upsells: Record<string, number>): RemainingBalance => ({
  tickets,
  upsells: { ...upsells },
})

export const remainingFor = (balance: RemainingBalance, target: DiscountTarget): number =>
  target.kind === 'tickets' ? balance.tickets : (balance.upsells[target.upsellId] ?? 0)

/** Takes `amount` off the target, never below zero. */
export const deduct = (balance: RemainingBalance, target: DiscountTarget, amount: number): RemainingBalance => {
  const next = Math.max(remainingFor(balance, target) - amount, 0)
  return target.kind === 'tickets'
    ? { ...balance, tickets: next }
    : { ...balance, upsells: { ...balance.upsells, [target.upsellId]: next } }
}

import type { DiscountStrategy } from '../strategy'
import { fixedAmountStrategy } from './fixedAmount'
import { openTicketStrategy } from './openTicket'
import { percentStrategy } from './percent'
import { productStrategy } from './product'
import { tierExclusiveStrategy } from './tierExclusive'

/**
 * Every code family, most specific first: a code is handled by the first
 * strategy that matches it. Order of application is set by `priority`.
 */
export const DISCOUNT_STRATEGIES: readonly DiscountStrategy[] = [
  productStrategy,
  openTicketStrategy,
  tierExclusiveStrategy,
  percentStrategy,
  fixedAmountStrategy,
]

export const strategyFor = (promo: Parameters<DiscountStrategy['matches']>[0]) =>
  DISCOUNT_STRATEGIES.find((strategy) => strategy.matches(promo)) ?? null

/**
 * Business rules attached to specific promo codes. The single place where code
 * names are known: the pricing engine, the payment route and the code
 * validation route all read them from here.
 */

/** At most this many codes on one order, ambassador code included. */
export const MAX_PROMO_CODES_PER_ORDER = 2

/** These codes replace the tier discount instead of adding to it. */
export const TIER_EXCLUSIVE_CODES: ReadonlySet<string> = new Set(['LUOFF30', 'JUOFF50'])

/** May be combined with one other ticket code. */
export const WELCOME_STACKABLE_CODE = 'WELCOME05'

/** Codes ending with this suffix discount a single OPEN ticket. */
export const OPEN_TICKET_CODE_SUFFIX = 'OPENTICKET'

export const normalizePromoCode = (code: string | null | undefined) => (code ?? '').trim().toUpperCase()

export const isTierExclusiveCode = (code: string) => TIER_EXCLUSIVE_CODES.has(normalizePromoCode(code))

export const isWelcomeStackableCode = (code: string) => normalizePromoCode(code) === WELCOME_STACKABLE_CODE

export const isOpenTicketCode = (code: string) => normalizePromoCode(code).endsWith(OPEN_TICKET_CODE_SUFFIX)

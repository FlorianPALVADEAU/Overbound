/**
 * The purchase tunnel (/events/[id]/register and /events/[id]/register/payment)
 * is a closed screen: no site navigation, footer, marketing popup or exit link,
 * so the visitor stays in the purchase. /events/[id]/success is not part of it:
 * once paid, the visitor gets the normal site back.
 */
const CHECKOUT_PATTERN = /^\/events\/[^/]+\/register(?:\/payment)?$/

export function isCheckoutPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  const withoutQuery = pathname.split(/[?#]/, 1)[0]
  const normalized = withoutQuery.length > 1 ? withoutQuery.replace(/\/+$/, '') : withoutQuery
  return CHECKOUT_PATTERN.test(normalized)
}

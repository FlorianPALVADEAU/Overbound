/**
 * Lists a popup sign-up consents to. The popup promises event announcements, price alerts and
 * news: partner offers and volunteer recruitment are other purposes and need their own opt-in.
 */
export const POPUP_CONSENT_LIST_SLUGS = ['events-announcements', 'price-alerts', 'news-blog'] as const

export function selectPopupConsentLists<T extends { slug: string }>(lists: readonly T[]): T[] {
  const allowed = new Set<string>(POPUP_CONSENT_LIST_SLUGS)
  return lists.filter((list) => allowed.has(list.slug))
}

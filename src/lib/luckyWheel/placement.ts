/**
 * Where the Lucky Wheel popup is allowed to appear, and which event it
 * targets there. Product decision (2026-10-09): an explicit allowlist, not
 * a denylist -- any route not listed here never shows the wheel, so a new
 * page (admin, account, about, volunteers, bootcamps, tunnel...) is excluded
 * by default instead of silently inheriting a marketing popup.
 *
 * To allow the wheel on a new page, add one rule below and one test case in
 * placement.test.ts. Rules are matched in order; the first match wins, so a
 * static route that shares a prefix with a dynamic one (/events/formats vs
 * /events/[id]) must come first.
 */
export type LuckyWheelPlacement =
  /** Page with no event of its own: target the site-wide featured event. */
  | { source: 'featured-event' }
  /** Event page: target the event named in the URL (slug or UUID). */
  | { source: 'route-event'; eventParam: string }

type PlacementRule = {
  /** Matched against the normalized pathname (no trailing slash, no query). */
  pattern: RegExp
  toPlacement: (match: RegExpExecArray) => LuckyWheelPlacement
}

const featuredEvent = (): LuckyWheelPlacement => ({ source: 'featured-event' })

const LUCKY_WHEEL_PLACEMENT_RULES: readonly PlacementRule[] = [
  // Homepage
  { pattern: /^\/$/, toPlacement: featuredEvent },
  // Formats comparison page -- before /events/[id], which would also match it.
  { pattern: /^\/events\/formats$/, toPlacement: featuredEvent },
  // Obstacles gallery
  { pattern: /^\/obstacles$/, toPlacement: featuredEvent },
  // Event landing page only -- not its sub-routes (/register, /register/payment,
  // /success): the wheel must never interrupt the purchase tunnel.
  {
    pattern: /^\/events\/([^/]+)$/,
    toPlacement: (match) => ({ source: 'route-event', eventParam: decodeURIComponent(match[1]) }),
  },
]

const normalizePathname = (pathname: string): string => {
  const withoutQuery = pathname.split(/[?#]/, 1)[0]
  return withoutQuery.length > 1 ? withoutQuery.replace(/\/+$/, '') : withoutQuery
}

/**
 * Returns where the wheel may appear for this pathname, or null when the
 * route is not allowlisted (the widget must then render nothing).
 */
export const resolveLuckyWheelPlacement = (pathname: string | null | undefined): LuckyWheelPlacement | null => {
  if (!pathname) return null
  const normalized = normalizePathname(pathname)

  for (const rule of LUCKY_WHEEL_PLACEMENT_RULES) {
    const match = rule.pattern.exec(normalized)
    if (match) return rule.toPlacement(match)
  }

  return null
}

import { describe, expect, it } from 'vitest'
import { resolveLuckyWheelPlacement } from './placement'

describe('resolveLuckyWheelPlacement', () => {
  it.each(['/', '/events/formats', '/obstacles'])('targets the featured event on %s', (pathname) => {
    expect(resolveLuckyWheelPlacement(pathname)).toEqual({ source: 'featured-event' })
  })

  it('targets the event named in the URL on an event page', () => {
    expect(resolveLuckyWheelPlacement('/events/ultra-arena-2026')).toEqual({
      source: 'route-event',
      eventParam: 'ultra-arena-2026',
    })
  })

  it('ignores a trailing slash and a query string', () => {
    expect(resolveLuckyWheelPlacement('/obstacles/')).toEqual({ source: 'featured-event' })
    expect(resolveLuckyWheelPlacement('/events/ultra-arena-2026?utm_source=meta')).toEqual({
      source: 'route-event',
      eventParam: 'ultra-arena-2026',
    })
  })

  it('never treats /events/formats as an event slug', () => {
    expect(resolveLuckyWheelPlacement('/events/formats')).not.toMatchObject({ source: 'route-event' })
  })

  it.each([
    // Purchase tunnel and post-purchase: never interrupt.
    '/events/ultra-arena-2026/register',
    '/events/ultra-arena-2026/register/payment',
    '/events/ultra-arena-2026/success',
    // Event list (not a landing page).
    '/events',
    // Explicitly excluded by product.
    '/volunteers',
    '/bootcamps',
    '/about',
    '/about/concept',
    '/about/faq',
    // Excluded by default (not allowlisted).
    '/races/some-race-id',
    '/account',
    '/account/ticket/abc',
    '/account/registration/abc',
    '/dashboard',
    '/dashboard/lucky-wheel',
    '/studio',
    '/auth/login',
    '/blog',
    '/contact',
    '/obstacles/extra',
  ])('returns null on non-allowlisted route %s', (pathname) => {
    expect(resolveLuckyWheelPlacement(pathname)).toBeNull()
  })

  it('returns null without a pathname', () => {
    expect(resolveLuckyWheelPlacement(null)).toBeNull()
    expect(resolveLuckyWheelPlacement('')).toBeNull()
  })
})

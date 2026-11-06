import { describe, expect, it } from 'vitest'
import { isCheckoutPath } from './checkoutRoute'

describe('isCheckoutPath', () => {
  it.each([
    '/events/ultra-arena-2026/register',
    '/events/ultra-arena-2026/register/payment',
    '/events/ultra-arena-2026/register/',
    '/events/ultra-arena-2026/register?ticket=abc&ref=X',
  ])('is true for %s', (pathname) => {
    expect(isCheckoutPath(pathname)).toBe(true)
  })

  it.each([
    '/',
    '/events/ultra-arena-2026',
    '/events/ultra-arena-2026/success',
    '/events/ultra-arena-2026/register/other',
    '/events/formats',
    '/account/registrations',
    '/auth/register',
    null,
    undefined,
  ])('is false outside the tunnel for %s', (pathname) => {
    expect(isCheckoutPath(pathname)).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { isMaintenanceExemptPath } from './policy'

describe('isMaintenanceExemptPath', () => {
  it.each(['/auth/login', '/auth/callback', '/api/auth/post-auth-sync', '/maintenance', '/robots.txt'])(
    'keeps %s reachable',
    (path) => expect(isMaintenanceExemptPath(path)).toBe(true),
  )

  it.each(['/', '/events/ultra-arena-2026', '/account', '/dashboard', '/api/webhooks/stripe', '/authors', '/api/authors'])(
    'blocks %s',
    (path) => expect(isMaintenanceExemptPath(path)).toBe(false),
  )
})

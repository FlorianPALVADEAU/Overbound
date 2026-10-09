import { describe, expect, it } from 'vitest'
import { resolveGroupOrganizationId } from './organization'

type Result = { data: unknown; error?: unknown }

/** Chainable Supabase stand-in resolving each table to a canned result. */
const fakeAdmin = (responses: Record<string, Result>) => ({
  from(table: string) {
    const builder: Record<string, unknown> = {}
    for (const method of ['select', 'eq', 'order', 'limit', 'not', 'gte']) builder[method] = () => builder
    builder.then = (onFulfilled: (value: unknown) => unknown) =>
      Promise.resolve({ error: null, ...(responses[table] ?? { data: [] }) }).then(onFulfilled)
    return builder
  },
}) as never

describe('resolveGroupOrganizationId', () => {
  it('uses the organization of the latest registration first', async () => {
    const admin = fakeAdmin({
      registrations: { data: [{ event: null }, { event: { organization_id: 'org-reg' } }] },
      events: { data: [{ organization_id: 'org-event' }] },
    })
    await expect(resolveGroupOrganizationId(admin, 'u1')).resolves.toBe('org-reg')
  })

  it('falls back to the next upcoming event, then to the only organization', async () => {
    await expect(
      resolveGroupOrganizationId(fakeAdmin({ events: { data: [{ organization_id: 'org-event' }] } }), 'u1'),
    ).resolves.toBe('org-event')
    await expect(
      resolveGroupOrganizationId(fakeAdmin({ organizations: { data: [{ id: 'org-only' }] } }), 'u1'),
    ).resolves.toBe('org-only')
  })

  it('returns null when it cannot decide (several organizations, nothing else)', async () => {
    const admin = fakeAdmin({ organizations: { data: [{ id: 'a' }, { id: 'b' }] } })
    await expect(resolveGroupOrganizationId(admin, 'u1')).resolves.toBeNull()
  })

  it('surfaces database errors instead of guessing', async () => {
    const admin = fakeAdmin({ registrations: { data: null, error: new Error('db down') } })
    await expect(resolveGroupOrganizationId(admin, 'u1')).rejects.toThrow('db down')
  })
})

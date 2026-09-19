import { describe, expect, it } from 'vitest'
import { profileBelongsToOrganization } from './organizationScope'

const buildClient = (rows: Record<string, unknown>) => ({
  from: (table: string) => {
    const result = rows[table] ?? null
    const builder = {
      select: () => builder,
      eq: () => builder,
      limit: () => builder,
      maybeSingle: async () => ({ data: result, error: null }),
    }
    return builder
  },
})

describe('profileBelongsToOrganization', () => {
  it('returns true for an active membership', async () => {
    const client = buildClient({ organization_memberships: { id: 'membership-1' } })
    await expect(profileBelongsToOrganization(client as never, 'org-1', 'profile-1')).resolves.toBe(true)
  })

  it('returns true for an organization registration', async () => {
    const client = buildClient({ registrations: { id: 'registration-1' } })
    await expect(profileBelongsToOrganization(client as never, 'org-1', 'profile-1')).resolves.toBe(true)
  })

  it('returns false when no scoped record exists', async () => {
    const client = buildClient({})
    await expect(profileBelongsToOrganization(client as never, 'org-1', 'profile-1')).resolves.toBe(false)
  })
})

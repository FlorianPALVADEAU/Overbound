import { beforeEach, describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock, filterSuppressedMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
  filterSuppressedMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ supabaseAdmin: supabaseAdminMock }))
vi.mock('@/lib/email/suppression', () => ({ filterSuppressed: filterSuppressedMock }))

import { listSubscribers, resolveAudience, resolveReconsentAudience } from './audience'

type Result = { data: unknown; error: { message: string } | null }

/** Chainable query double: every filter returns the builder, awaiting or `range` yields the result. */
function query(result: Result | ((range?: [number, number]) => Result)) {
  const resolve = (range?: [number, number]) =>
    Promise.resolve(typeof result === 'function' ? result(range) : result)
  const builder: Record<string, unknown> = {}
  for (const name of ['select', 'eq', 'in', 'order']) {
    builder[name] = vi.fn(() => builder)
  }
  builder.range = vi.fn((from: number, to: number) => resolve([from, to]))
  builder.then = (onFulfilled: (value: Result) => unknown, onRejected?: (reason: unknown) => unknown) =>
    resolve().then(onFulfilled, onRejected)
  return builder
}

interface Fixture {
  lists?: Result
  subscriptions?: Result | ((range?: [number, number]) => Result)
  preferences?: Result
  users?: Array<{ id: string; email: string | null }>
}

function givenDatabase(fixture: Fixture) {
  const tables: Record<string, unknown> = {
    distribution_lists: query(fixture.lists ?? { data: [{ id: 'list-1' }], error: null }),
    list_subscriptions: query(fixture.subscriptions ?? { data: [], error: null }),
    notification_preferences: query(fixture.preferences ?? { data: [], error: null }),
  }
  const listUsers = vi.fn().mockResolvedValue({ data: { users: fixture.users ?? [] }, error: null })
  supabaseAdminMock.mockReturnValue({
    from: (table: string) => tables[table],
    auth: { admin: { listUsers } },
  })
  return { tables, listUsers }
}

const emailOnly = (id: string, email: string, fullName: string | null = null) => ({
  id,
  list_id: 'list-1',
  user_id: null,
  email,
  full_name: fullName,
  subscribed: true,
  source: 'popup-1',
  subscribed_at: null,
  profiles: null,
})

const accountRow = (id: string, userId: string, fullName: string | null = null) => ({
  id,
  list_id: 'list-1',
  user_id: userId,
  email: null,
  full_name: null,
  subscribed: true,
  source: 'preferences',
  subscribed_at: null,
  profiles: { full_name: fullName },
})

describe('resolveAudience', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    filterSuppressedMock.mockImplementation(async (recipients: unknown[]) => recipients)
  })

  it('merges accounts and email-only subscribers into one recipient per address', async () => {
    givenDatabase({
      subscriptions: {
        data: [
          accountRow('s1', 'u1', 'Alice'),
          emailOnly('s2', 'Bob@Example.com', 'Bob'),
          emailOnly('s3', 'alice@example.com'),
        ],
        error: null,
      },
      users: [{ id: 'u1', email: 'alice@example.com' }],
    })

    const audience = await resolveAudience({ listSlugs: ['events-announcements'] })

    expect(audience).toEqual([
      { userId: 'u1', email: 'alice@example.com', fullName: 'Alice' },
      { userId: null, email: 'bob@example.com', fullName: 'Bob' },
    ])
  })

  it('keeps the account when the same address appears first as an email-only row', async () => {
    givenDatabase({
      subscriptions: {
        data: [emailOnly('s1', 'alice@example.com'), accountRow('s2', 'u1', 'Alice')],
        error: null,
      },
      users: [{ id: 'u1', email: 'alice@example.com' }],
    })

    const audience = await resolveAudience()

    expect(audience).toEqual([{ userId: 'u1', email: 'alice@example.com', fullName: 'Alice' }])
  })

  it('drops accounts whose digest preference is not immediate', async () => {
    givenDatabase({
      subscriptions: {
        data: [accountRow('s1', 'u1'), accountRow('s2', 'u2'), accountRow('s3', 'u3')],
        error: null,
      },
      users: [
        { id: 'u1', email: 'daily@x.fr' },
        { id: 'u2', email: 'immediate@x.fr' },
        { id: 'u3', email: 'none@x.fr' },
      ],
      preferences: {
        data: [
          { user_id: 'u1', digest_frequency: 'daily' },
          { user_id: 'u2', digest_frequency: 'immediate' },
        ],
        error: null,
      },
    })

    const audience = await resolveAudience()

    expect(audience.map((r) => r.email)).toEqual(['immediate@x.fr', 'none@x.fr'])
  })

  it('removes suppressed addresses through filterSuppressed', async () => {
    givenDatabase({
      subscriptions: { data: [emailOnly('s1', 'gone@x.fr'), emailOnly('s2', 'ok@x.fr')], error: null },
    })
    filterSuppressedMock.mockImplementation(async (recipients: Array<{ email: string }>) =>
      recipients.filter((r) => r.email !== 'gone@x.fr'),
    )

    const audience = await resolveAudience()

    expect(audience.map((r) => r.email)).toEqual(['ok@x.fr'])
  })

  it('skips malformed addresses and accounts without an address', async () => {
    givenDatabase({
      subscriptions: {
        data: [emailOnly('s1', 'not-an-email'), accountRow('s2', 'ghost'), emailOnly('s3', 'ok@x.fr')],
        error: null,
      },
      users: [],
    })

    const audience = await resolveAudience()

    expect(audience.map((r) => r.email)).toEqual(['ok@x.fr'])
  })

  it('reads every page of subscriptions', async () => {
    const pageOf = (count: number, prefix: string) =>
      Array.from({ length: count }, (_, i) => emailOnly(`${prefix}${i}`, `${prefix}${i}@x.fr`))
    const { tables } = givenDatabase({
      subscriptions: (range) =>
        range?.[0] === 0
          ? { data: pageOf(1000, 'a'), error: null }
          : { data: pageOf(5, 'b'), error: null },
    })

    const audience = await resolveAudience()

    expect(audience).toHaveLength(1005)
    expect((tables.list_subscriptions as { range: unknown }).range).toHaveBeenCalledTimes(2)
  })

  it('returns an empty audience, without reading subscriptions, when no active list matches', async () => {
    const { tables } = givenDatabase({ lists: { data: [], error: null } })

    expect(await resolveAudience({ listSlugs: ['unknown'] })).toEqual([])
    expect((tables.list_subscriptions as { select: unknown }).select).not.toHaveBeenCalled()
  })

  it('throws instead of widening the audience when preferences cannot be read', async () => {
    givenDatabase({
      subscriptions: { data: [accountRow('s1', 'u1')], error: null },
      users: [{ id: 'u1', email: 'a@x.fr' }],
      preferences: { data: null, error: { message: 'boom' } },
    })

    await expect(resolveAudience()).rejects.toThrow('preference read failed: boom')
  })

  it('throws when the subscriptions cannot be read', async () => {
    givenDatabase({ subscriptions: { data: null, error: { message: 'down' } } })

    await expect(resolveAudience()).rejects.toThrow('subscription read failed: down')
  })
})

describe('consent provenance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    filterSuppressedMock.mockImplementation(async (recipients: unknown[]) => recipients)
  })

  const withSource = (row: ReturnType<typeof emailOnly>, source: string | null) => ({ ...row, source })

  it('leaves out subscriptions whose consent cannot be traced', async () => {
    givenDatabase({
      subscriptions: {
        data: [
          withSource(emailOnly('s1', 'traced@x.fr'), 'popup-1'),
          withSource(emailOnly('s2', 'legacy@x.fr'), 'legacy-unproven'),
          withSource(emailOnly('s3', 'legacy-popup@x.fr'), 'legacy-unproven:popup-1'),
          withSource(emailOnly('s4', 'blank@x.fr'), null),
        ],
        error: null,
      },
    })

    const audience = await resolveAudience()

    expect(audience.map((r) => r.email)).toEqual(['traced@x.fr'])
  })

  it('keeps an address that has one traced list even if another list is untraced', async () => {
    givenDatabase({
      subscriptions: {
        data: [
          withSource(emailOnly('s1', 'mixed@x.fr'), 'legacy-unproven'),
          { ...withSource(emailOnly('s2', 'mixed@x.fr'), 'preferences'), list_id: 'list-2' },
        ],
        error: null,
      },
    })

    const audience = await resolveAudience()

    expect(audience.map((r) => r.email)).toEqual(['mixed@x.fr'])
  })
})

describe('resolveReconsentAudience', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    filterSuppressedMock.mockImplementation(async (recipients: unknown[]) => recipients)
  })

  it('targets only addresses subscribed on an untraced row, once each', async () => {
    givenDatabase({
      subscriptions: {
        data: [
          { ...emailOnly('s1', 'legacy@x.fr'), source: 'legacy-unproven' },
          { ...emailOnly('s2', 'legacy@x.fr'), source: null },
          { ...emailOnly('s3', 'traced@x.fr'), source: 'popup-1' },
          { ...emailOnly('s4', 'popup-legacy@x.fr'), source: 'legacy-unproven:popup-1' },
        ],
        error: null,
      },
    })

    const audience = await resolveReconsentAudience()

    expect(audience.map((r) => r.email)).toEqual(['legacy@x.fr', 'popup-legacy@x.fr'])
  })

  it('returns nobody when every subscription is traced', async () => {
    givenDatabase({
      subscriptions: { data: [emailOnly('s1', 'a@x.fr')], error: null },
    })

    expect(await resolveReconsentAudience()).toEqual([])
  })

  it('does not write to suppressed addresses', async () => {
    givenDatabase({
      subscriptions: {
        data: [{ ...emailOnly('s1', 'gone@x.fr'), source: 'legacy-unproven' }],
        error: null,
      },
    })
    filterSuppressedMock.mockImplementation(async () => [])

    expect(await resolveReconsentAudience()).toEqual([])
  })
})

describe('listSubscribers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('keeps unsubscribed rows when asked for every row', async () => {
    givenDatabase({
      subscriptions: {
        data: [{ ...emailOnly('s1', 'a@x.fr'), subscribed: false }],
        error: null,
      },
    })

    const subscribers = await listSubscribers(['list-1'], { subscribedOnly: false })

    expect(subscribers).toEqual([
      expect.objectContaining({ id: 's1', email: 'a@x.fr', subscribed: false, userId: null }),
    ])
  })
})

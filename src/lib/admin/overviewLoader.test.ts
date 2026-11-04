import { describe, expect, it, vi } from 'vitest'
import { loadRegistrations } from './overviewLoader'

type Page = { data: unknown[] | null; error: { message: string } | null }

function fakeAdmin(pageAt: (from: number) => Page) {
  const range = vi.fn(async (from: number) => pageAt(from))
  const builder = { select: () => builder, in: () => builder, order: () => builder, range }
  const admin = { from: vi.fn(() => builder) } as unknown as Parameters<typeof loadRegistrations>[0]
  return { admin, range }
}

const rows = (count: number, offset = 0) =>
  Array.from({ length: count }, (_, index) => ({ id: `reg-${offset + index}` }))

describe('loadRegistrations', () => {
  it('reads every page until a short page ends the read', async () => {
    const { admin, range } = fakeAdmin((from) => ({ data: rows(from === 0 ? 1000 : 500, from), error: null }))

    const result = await loadRegistrations(admin, ['event-1'])

    expect(result).toHaveLength(1500)
    expect(range).toHaveBeenCalledTimes(2)
  })

  it('returns an empty list when no registration exists', async () => {
    const { admin } = fakeAdmin(() => ({ data: [], error: null }))

    await expect(loadRegistrations(admin, ['event-1'])).resolves.toEqual([])
  })

  it('throws the database error instead of returning a partial read', async () => {
    const { admin } = fakeAdmin(() => ({ data: null, error: { message: 'statement timeout' } }))

    await expect(loadRegistrations(admin, ['event-1'])).rejects.toEqual({ message: 'statement timeout' })
  })

  it('refuses to aggregate past the cap instead of silently truncating', async () => {
    const { admin, range } = fakeAdmin((from) => ({ data: rows(1000, from), error: null }))

    await expect(loadRegistrations(admin, ['event-1'])).rejects.toThrow('agrégation refusée')
    expect(range).toHaveBeenCalledTimes(50)
  })
})

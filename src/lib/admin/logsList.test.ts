import { describe, expect, it } from 'vitest'
import { decodeKeysetCursor, encodeKeysetCursor, keysetAfterFilter } from './keysetCursor'
import { logsQuerySchema, parisDayEnd, parisDayStart } from './logsList'

const ID = '3f2b8c1e-5d4a-4f6b-9a7c-1e2d3c4b5a69'

describe('logsQuerySchema', () => {
  it('applies defaults and coerces numbers', () => {
    expect(logsQuerySchema.parse({})).toEqual({ limit: 100 })
    expect(logsQuerySchema.parse({ status: '404', limit: '50', method: 'DELETE' })).toMatchObject({ status: 404, limit: 50, method: 'DELETE' })
  })

  it('rejects unknown methods, bad dates and out-of-range limits', () => {
    expect(logsQuerySchema.safeParse({ method: 'TRACE' }).success).toBe(false)
    expect(logsQuerySchema.safeParse({ startDate: '03/11/2026' }).success).toBe(false)
    expect(logsQuerySchema.safeParse({ limit: '5000' }).success).toBe(false)
  })
})

describe('Paris day bounds', () => {
  it('uses winter time in November', () => {
    expect(parisDayStart('2026-11-03').toISOString()).toBe('2026-11-02T23:00:00.000Z')
    expect(parisDayEnd('2026-11-03').toISOString()).toBe('2026-11-03T22:59:59.999Z')
  })

  it('uses summer time in September', () => {
    expect(parisDayStart('2026-09-12').toISOString()).toBe('2026-09-11T22:00:00.000Z')
  })

  it('handles the 23-hour day when daylight saving starts', () => {
    expect(parisDayEnd('2026-03-29').toISOString()).toBe('2026-03-29T21:59:59.999Z')
  })

  it('rejects an impossible date', () => {
    expect(() => parisDayStart('2026-13-45')).toThrow('Date invalide')
  })
})

describe('keyset cursor', () => {
  it('round-trips and builds the after filter', () => {
    const cursor = { createdAt: '2026-11-03T10:00:00.000Z', id: ID }
    expect(decodeKeysetCursor(encodeKeysetCursor(cursor))).toEqual(cursor)
    expect(keysetAfterFilter(cursor)).toBe(`created_at.lt."${cursor.createdAt}",and(created_at.eq."${cursor.createdAt}",id.lt.${ID})`)
  })

  it('rejects a forged cursor', () => {
    expect(() => decodeKeysetCursor('nope')).toThrow('Cursor de pagination invalide')
  })
})

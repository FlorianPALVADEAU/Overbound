import { describe, expect, it } from 'vitest'
import { pageOfItems } from './clientPagination'
import type { ListResponse } from './types'

const rows = Array.from({ length: 60 }, (_, index) => index)

describe('pageOfItems', () => {
  it('returns the first page with a cursor to the next one', () => {
    const page = pageOfItems(rows, null, 25)
    expect(page.items).toHaveLength(25)
    expect(page.items[0]).toBe(0)
    expect(page.nextCursor).toBe('25')
    expect(page.total).toBe(60)
  })

  it('returns the last page without a next cursor', () => {
    const page = pageOfItems(rows, '50', 25)
    expect(page.items).toEqual([50, 51, 52, 53, 54, 55, 56, 57, 58, 59])
    expect(page.nextCursor).toBeNull()
  })

  it('walks every row exactly once', () => {
    const seen: number[] = []
    let cursor: string | null = null
    do {
      const page: ListResponse<number> = pageOfItems(rows, cursor, 25)
      seen.push(...page.items)
      cursor = page.nextCursor
    } while (cursor)
    expect(seen).toEqual(rows)
  })

  it('falls back to the first page for a bad cursor and clamps one past the end', () => {
    expect(pageOfItems(rows, 'abc', 25).items[0]).toBe(0)
    expect(pageOfItems(rows, '-4', 25).items[0]).toBe(0)
    expect(pageOfItems(rows, '9999', 25).items).toEqual([59])
  })

  it('handles an empty list', () => {
    expect(pageOfItems([], null, 25)).toEqual({ items: [], nextCursor: null, total: 0 })
  })
})

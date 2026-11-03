import { useEffect, useMemo, useState } from 'react'
import type { CursorPagination, ListResponse } from './types'

/**
 * Page of an already loaded array, in the cursor shape `OperationsList` expects. The cursor is the offset of
 * the first row, so the list keeps one pagination contract whether the server or the browser slices.
 */
export function pageOfItems<T>(items: readonly T[], cursor: string | null, limit: number): ListResponse<T> {
  const parsed = cursor === null ? 0 : Number.parseInt(cursor, 10)
  const offset = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), Math.max(items.length - 1, 0)) : 0
  const end = offset + limit
  return {
    items: items.slice(offset, end),
    nextCursor: end < items.length ? String(end) : null,
    total: items.length,
  }
}

/** Client-side pagination state for a list whose rows are all loaded. Goes back to page 1 when `resetKey` changes. */
export function useClientPagination<T>(items: readonly T[], resetKey: string, limit = 25) {
  const [cursor, setCursor] = useState<string | null>(null)
  const [previousCursors, setPreviousCursors] = useState<string[]>([])

  useEffect(() => {
    setCursor(null)
    setPreviousCursors([])
  }, [resetKey])

  const data = useMemo(() => pageOfItems(items, cursor, limit), [items, cursor, limit])
  const pagination: CursorPagination = { cursor, previousCursors, nextCursor: data.nextCursor, total: data.total, limit }

  return {
    data,
    pagination,
    onPaginationChange: (next: Pick<CursorPagination, 'cursor' | 'previousCursors'>) => {
      setCursor(next.cursor)
      setPreviousCursors(next.previousCursors)
    },
  }
}

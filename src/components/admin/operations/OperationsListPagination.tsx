'use client'

import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CursorPagination } from './types'

interface OperationsListPaginationProps {
  pagination: CursorPagination
  onPaginationChange: (pagination: Pick<CursorPagination, 'cursor' | 'previousCursors'>) => void
  isLoading?: boolean
  itemLabel?: string
  position?: 'top' | 'bottom'
  /** Rows on the current page; lets the label show the range when the page size is unknown. */
  shown?: number
}

export function OperationsListPagination({
  pagination,
  onPaginationChange,
  isLoading = false,
  itemLabel = 'résultat',
  position = 'bottom',
  shown,
}: OperationsListPaginationProps) {
  const page = pagination.previousCursors.length + 1
  // Without an explicit page size, the first page tells us how many rows a full page holds.
  const pageSize = pagination.limit ?? (page === 1 && pagination.nextCursor ? shown : undefined)
  const totalPages = pagination.total === undefined || !pageSize
    ? null
    : Math.max(1, Math.ceil(pagination.total / pageSize))
  const rangeStart = pageSize && shown ? (page - 1) * pageSize + 1 : null
  const rangeEnd = rangeStart && shown ? rangeStart + shown - 1 : null
  const plural = pagination.total !== undefined && pagination.total > 1 ? 's' : ''
  const summary = pagination.total === undefined
    ? `Page ${page}`
    : rangeStart && rangeEnd
      ? `${rangeStart} à ${rangeEnd} sur ${pagination.total} ${itemLabel}${plural}`
      : `${pagination.total} ${itemLabel}${plural}`
  const previousCursor = pagination.previousCursors.at(-1)
  const canGoPrevious = previousCursor !== undefined
  const canGoNext = Boolean(pagination.nextCursor)

  const goPrevious = () => {
    if (previousCursor === undefined) return
    onPaginationChange({ cursor: previousCursor || null, previousCursors: pagination.previousCursors.slice(0, -1) })
  }

  const goNext = () => {
    if (!pagination.nextCursor) return
    onPaginationChange({ cursor: pagination.nextCursor, previousCursors: [...pagination.previousCursors, pagination.cursor ?? ''] })
  }

  return (
    <div className={`${position === 'top' ? 'hidden sm:flex' : 'flex'} items-center justify-between gap-3 border-border px-3 py-2 text-xs text-muted-foreground sm:text-sm ${position === 'bottom' ? 'border-t' : 'border-b'}`}>
      <span>{summary}</span>
      <div className="flex items-center gap-2">
        {isLoading ? <LoaderCircle className="size-4 animate-spin" aria-label="Actualisation" /> : null}
        <Button type="button" variant="outline" size="icon-sm" onClick={goPrevious} disabled={!canGoPrevious || isLoading} aria-label="Page précédente"><ChevronLeft /></Button>
        <span className="tabular-nums"><span className="hidden sm:inline">Page </span>{page}{totalPages ? ` / ${totalPages}` : ''}</span>
        <Button type="button" variant="outline" size="icon-sm" onClick={goNext} disabled={!canGoNext || isLoading} aria-label="Page suivante"><ChevronRight /></Button>
      </div>
    </div>
  )
}

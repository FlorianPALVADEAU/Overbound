'use client'

import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CursorPagination } from './types'

interface OperationsListPaginationProps {
  pagination: CursorPagination
  onPaginationChange: (pagination: Pick<CursorPagination, 'cursor' | 'previousCursors'>) => void
  isLoading?: boolean
  itemLabel?: string
}

export function OperationsListPagination({
  pagination,
  onPaginationChange,
  isLoading = false,
  itemLabel = 'résultat',
}: OperationsListPaginationProps) {
  const page = pagination.previousCursors.length + 1
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
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t px-3 py-2 text-sm text-muted-foreground">
      <span>{pagination.total !== undefined ? `${pagination.total} ${itemLabel}${pagination.total > 1 ? 's' : ''}` : `Page ${page}`}</span>
      <div className="flex items-center gap-2">
        {isLoading ? <LoaderCircle className="size-4 animate-spin" aria-label="Actualisation" /> : null}
        <Button type="button" variant="outline" size="icon-sm" onClick={goPrevious} disabled={!canGoPrevious || isLoading} aria-label="Page précédente"><ChevronLeft /></Button>
        <span>Page {page}</span>
        <Button type="button" variant="outline" size="icon-sm" onClick={goNext} disabled={!canGoNext || isLoading} aria-label="Page suivante"><ChevronRight /></Button>
      </div>
    </footer>
  )
}

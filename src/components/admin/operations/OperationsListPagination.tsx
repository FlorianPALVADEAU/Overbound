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
}

export function OperationsListPagination({
  pagination,
  onPaginationChange,
  isLoading = false,
  itemLabel = 'résultat',
  position = 'bottom',
}: OperationsListPaginationProps) {
  const page = pagination.previousCursors.length + 1
  const totalPages = pagination.total === undefined
    ? null
    : Math.max(1, Math.ceil(pagination.total / (pagination.limit ?? 50)))
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
    <div className={`flex flex-wrap items-center justify-between gap-3 border-border px-3 py-2 text-sm text-muted-foreground ${position === 'bottom' ? 'border-t' : 'border-b'}`}>
      <span>{pagination.total !== undefined ? `${pagination.total} ${itemLabel}${pagination.total > 1 ? 's' : ''}` : `Page ${page}`}</span>
      <div className="flex items-center gap-2">
        {isLoading ? <LoaderCircle className="size-4 animate-spin" aria-label="Actualisation" /> : null}
        <Button type="button" variant="outline" size="icon-sm" onClick={goPrevious} disabled={!canGoPrevious || isLoading} aria-label="Page précédente"><ChevronLeft /></Button>
        <span>Page {page}{totalPages ? ` sur ${totalPages}` : ''}</span>
        <Button type="button" variant="outline" size="icon-sm" onClick={goNext} disabled={!canGoNext || isLoading} aria-label="Page suivante"><ChevronRight /></Button>
      </div>
    </div>
  )
}

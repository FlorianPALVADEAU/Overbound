import type { ReactNode } from 'react'

/** Standard response shape for server-side, cursor-based operations lists. */
export interface ListResponse<T> {
  items: T[]
  nextCursor: string | null
  total?: number
  facets?: Record<string, Array<{ value: string; count: number }>>
}

export interface OperationsListColumn<T> {
  id: string
  header: ReactNode
  cell: (item: T) => ReactNode
  className?: string
  headerClassName?: string
  /** Columns hidden by default remain available from the column picker. */
  hiddenByDefault?: boolean
}

export interface OperationsListFilterOption {
  value: string
  label: string
  count?: number
}

export interface OperationsListFilter {
  id: string
  label: string
  value: string
  options: OperationsListFilterOption[]
  allLabel?: string
}

export interface OperationsListAction<T> {
  id: string
  label: string
  onSelect: (item: T) => void
  disabled?: (item: T) => boolean
  destructive?: boolean
}

export interface OperationsListBulkAction<T> {
  id: string
  label: string
  onSelect: (items: T[]) => void
  disabled?: (items: T[]) => boolean
  destructive?: boolean
}

/** Cursor history is client state; the cursor itself belongs in server query state. */
export interface CursorPagination {
  cursor: string | null
  previousCursors: string[]
  nextCursor: string | null
  total?: number
}

export type OperationsListStatus = 'idle' | 'loading' | 'stale' | 'error'

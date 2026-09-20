'use client'

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { OperationsListDetailPanel } from './OperationsListDetailPanel'
import { OperationsListEmptyState } from './OperationsListEmptyState'
import { OperationsListErrorState } from './OperationsListErrorState'
import { OperationsListPagination } from './OperationsListPagination'
import { OperationsListTable } from './OperationsListTable'
import { OperationsListToolbar } from './OperationsListToolbar'
import type {
  CursorPagination,
  ListResponse,
  OperationsListAction,
  OperationsListBulkAction,
  OperationsListColumn,
  OperationsListFilter,
  OperationsListStatus,
} from './types'

interface OperationsListProps<T> {
  data?: ListResponse<T>
  status?: OperationsListStatus
  errorMessage?: string
  onRetry?: () => void
  getItemId: (item: T) => string
  columns: OperationsListColumn<T>[]
  filters?: OperationsListFilter[]
  onFilterChange?: (filterId: string, value: string) => void
  search?: string
  searchPlaceholder?: string
  onSearchChange?: (value: string) => void
  visibleColumnIds?: readonly string[]
  onVisibleColumnIdsChange?: (columnIds: string[]) => void
  selectedIds?: readonly string[]
  onSelectedIdsChange?: (ids: string[]) => void
  rowActions?: OperationsListAction<T>[]
  bulkActions?: OperationsListBulkAction<T>[]
  pagination: CursorPagination
  onPaginationChange: (pagination: Pick<CursorPagination, 'cursor' | 'previousCursors'>) => void
  itemLabel?: string
  emptyState?: ReactNode
  selectedItem?: T | null
  onSelectedItemChange?: (item: T | null) => void
  renderDetail?: (item: T) => ReactNode
  detailTitle?: (item: T) => string
  detailDescription?: (item: T) => string | undefined
}

/**
 * Domain-free, controlled operations table. Data fetching, URL synchronization,
 * mutations and detail content remain the responsibility of the calling domain.
 */
export function OperationsList<T>({
  data,
  status = 'idle',
  errorMessage,
  onRetry,
  getItemId,
  columns,
  filters,
  onFilterChange,
  search,
  searchPlaceholder,
  onSearchChange,
  visibleColumnIds,
  onVisibleColumnIdsChange,
  selectedIds,
  onSelectedIdsChange,
  rowActions,
  bulkActions,
  pagination,
  onPaginationChange,
  itemLabel = 'résultat',
  emptyState,
  selectedItem,
  onSelectedItemChange,
  renderDetail,
  detailTitle,
  detailDescription,
}: OperationsListProps<T>) {
  const items = data?.items ?? []
  const selectedItems = selectedIds ? items.filter((item) => selectedIds.includes(getItemId(item))) : []
  const initialVisibleColumns = columns.filter((column) => !column.hiddenByDefault).map((column) => column.id)
  const effectiveVisibleColumns = visibleColumnIds ?? initialVisibleColumns
  const hasDetail = Boolean(selectedItem && renderDetail && detailTitle && onSelectedItemChange)

  const clearSelection = () => onSelectedIdsChange?.([])

  return (
    <section aria-label={`Liste ${itemLabel}`} className="overflow-hidden rounded-lg border bg-card">
      <OperationsListToolbar
        search={search}
        searchPlaceholder={searchPlaceholder}
        onSearchChange={onSearchChange}
        filters={filters}
        onFilterChange={onFilterChange}
        columns={columns}
        visibleColumnIds={visibleColumnIds}
        onVisibleColumnIdsChange={onVisibleColumnIdsChange}
      />
      {selectedItems.length > 0 && bulkActions && bulkActions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-3 py-2 text-sm">
          <span>{selectedItems.length} sélectionné{selectedItems.length > 1 ? 's' : ''}</span>
          {bulkActions.map((action) => <Button key={action.id} type="button" variant={action.destructive ? 'destructive' : 'outline'} size="sm" disabled={action.disabled?.(selectedItems)} onClick={() => action.onSelect(selectedItems)}>{action.label}</Button>)}
          <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>Annuler</Button>
        </div>
      ) : null}
      {status === 'error' ? <OperationsListErrorState message={errorMessage} onRetry={onRetry} /> : null}
      {status !== 'error' && items.length === 0 && status !== 'loading' ? (emptyState ?? <OperationsListEmptyState />) : null}
      {status !== 'error' && (items.length > 0 || status === 'loading') ? (
        <div aria-busy={status === 'loading'} className={status === 'stale' ? 'opacity-65' : undefined}>
          <OperationsListTable
            items={items}
            columns={columns}
            getItemId={getItemId}
            visibleColumnIds={effectiveVisibleColumns}
            selectedIds={selectedIds}
            onSelectedIdsChange={onSelectedIdsChange}
            actions={rowActions}
            onItemOpen={onSelectedItemChange}
          />
        </div>
      ) : null}
      {status !== 'error' ? <OperationsListPagination pagination={{ ...pagination, nextCursor: data?.nextCursor ?? pagination.nextCursor, total: data?.total ?? pagination.total }} onPaginationChange={onPaginationChange} isLoading={status === 'loading'} itemLabel={itemLabel} /> : null}
      {hasDetail && selectedItem && renderDetail && detailTitle && onSelectedItemChange ? (
        <OperationsListDetailPanel open title={detailTitle(selectedItem)} description={detailDescription?.(selectedItem)} onOpenChange={(open) => !open && onSelectedItemChange(null)}>{renderDetail(selectedItem)}</OperationsListDetailPanel>
      ) : null}
    </section>
  )
}

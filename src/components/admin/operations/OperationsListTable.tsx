'use client'

import { MoreHorizontal } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { OperationsListAction, OperationsListColumn } from './types'

interface OperationsListTableProps<T> {
  items: T[]
  columns: OperationsListColumn<T>[]
  getItemId: (item: T) => string
  visibleColumnIds?: readonly string[]
  selectedIds?: readonly string[]
  onSelectedIdsChange?: (ids: string[]) => void
  actions?: OperationsListAction<T>[]
  onItemOpen?: (item: T) => void
}

export function OperationsListTable<T>({
  items,
  columns,
  getItemId,
  visibleColumnIds,
  selectedIds,
  onSelectedIdsChange,
  actions = [],
  onItemOpen,
}: OperationsListTableProps<T>) {
  const visibleColumns = visibleColumnIds ? columns.filter((column) => visibleColumnIds.includes(column.id)) : columns
  const canSelect = selectedIds !== undefined && onSelectedIdsChange !== undefined
  const itemIds = items.map(getItemId)
  const allSelected = canSelect && itemIds.length > 0 && itemIds.every((id) => selectedIds.includes(id))

  const toggleAll = () => {
    if (!selectedIds || !onSelectedIdsChange) return
    const remaining = selectedIds.filter((id) => !itemIds.includes(id))
    onSelectedIdsChange(allSelected ? remaining : [...new Set([...remaining, ...itemIds])])
  }

  const toggleItem = (itemId: string) => {
    if (!selectedIds || !onSelectedIdsChange) return
    onSelectedIdsChange(selectedIds.includes(itemId) ? selectedIds.filter((id) => id !== itemId) : [...selectedIds, itemId])
  }

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          {canSelect ? <TableHead className="w-10"><Checkbox aria-label="Sélectionner toutes les lignes" checked={allSelected} onCheckedChange={toggleAll} /></TableHead> : null}
          {visibleColumns.map((column) => <TableHead key={column.id} className={cn('truncate', column.headerClassName)}>{column.header}</TableHead>)}
          {actions.length > 0 ? <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const itemId = getItemId(item)
          const selected = selectedIds?.includes(itemId) ?? false
          return (
            <TableRow key={itemId} data-state={selected ? 'selected' : undefined} className={onItemOpen ? 'cursor-pointer' : undefined} onClick={() => onItemOpen?.(item)}>
              {canSelect ? <TableCell className="w-10" onClick={(event) => event.stopPropagation()}><Checkbox aria-label={`Sélectionner la ligne ${itemId}`} checked={selected} onCheckedChange={() => toggleItem(itemId)} /></TableCell> : null}
              {visibleColumns.map((column) => <TableCell key={column.id} className={cn('overflow-hidden text-ellipsis', column.className)}>{column.cell(item)}</TableCell>)}
              {actions.length > 0 ? (
                <TableCell className="w-12" onClick={(event) => event.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon-sm" aria-label={`Actions pour ${itemId}`}><MoreHorizontal /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {actions.map((action) => <DropdownMenuItem key={action.id} variant={action.destructive ? 'destructive' : 'default'} disabled={action.disabled?.(item)} onSelect={() => action.onSelect(item)}>{action.label}</DropdownMenuItem>)}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              ) : null}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

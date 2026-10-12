'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown, MoreHorizontal } from 'lucide-react'
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

  const renderActions = (item: T, itemId: string) => actions.length > 0 ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" aria-label={`Actions pour ${itemId}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => <DropdownMenuItem key={action.id} variant={action.destructive ? 'destructive' : 'default'} disabled={action.disabled?.(item)} onSelect={() => action.onSelect(item)}>{action.label}</DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null

  // Phones have no column picker: every column stays reachable, the hidden-by-default ones as detail.
  const titleColumn = visibleColumns[0]
  const otherColumns = columns.filter((column) => column !== titleColumn)
  const hasExplicitPriority = otherColumns.some((column) => column.mobile)
  const defaultSummary = visibleColumns.slice(1, 3)
  const isSummary = (column: OperationsListColumn<T>) =>
    hasExplicitPriority ? column.mobile === 'summary' : defaultSummary.includes(column)
  const summaryColumns = otherColumns.filter(isSummary)
  const detailColumns = otherColumns.filter((column) => !isSummary(column))
  const compact = (column: OperationsListColumn<T>, item: T) => (column.mobileCell ?? column.cell)(item)

  return (
    <>
      <div className="md:hidden">
        {items.map((item) => {
          const itemId = getItemId(item)
          return (
            <MobileRow
              key={itemId}
              selected={selectedIds?.includes(itemId) ?? false}
              canSelect={canSelect}
              onToggleSelected={() => toggleItem(itemId)}
              selectLabel={`Sélectionner la ligne ${itemId}`}
              onOpen={onItemOpen ? () => onItemOpen(item) : undefined}
              title={titleColumn ? compact(titleColumn, item) : null}
              summary={summaryColumns.map((column) => <span key={column.id} className="min-w-0">{compact(column, item)}</span>)}
              details={detailColumns.map((column) => ({ id: column.id, label: column.header, value: column.cell(item) }))}
              menu={renderActions(item, itemId)}
            />
          )
        })}
      </div>
      <Table className="hidden table-fixed md:table">
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
            <TableRow key={itemId} data-state={selected ? 'selected' : undefined} className={cn('even:bg-foreground/[0.03]', onItemOpen && 'cursor-pointer')} onClick={() => onItemOpen?.(item)}>
              {canSelect ? <TableCell className="w-10" onClick={(event) => event.stopPropagation()}><Checkbox aria-label={`Sélectionner la ligne ${itemId}`} checked={selected} onCheckedChange={() => toggleItem(itemId)} /></TableCell> : null}
              {visibleColumns.map((column) => <TableCell key={column.id} className={cn('min-w-0 whitespace-normal break-words overflow-hidden text-ellipsis', column.className)}>{column.cell(item)}</TableCell>)}
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
    </>
  )
}

interface MobileRowProps {
  selected: boolean
  canSelect: boolean
  onToggleSelected: () => void
  selectLabel: string
  /** Opens the detail panel when the domain has one; otherwise a tap expands the row. */
  onOpen?: () => void
  title: ReactNode
  summary: ReactNode[]
  details: { id: string; label: ReactNode; value: ReactNode }[]
  menu: ReactNode
}

/** Two lines on a phone: title + menu, then the few values that matter. Details unfold on demand. */
function MobileRow({ selected, canSelect, onToggleSelected, selectLabel, onOpen, title, summary, details, menu }: MobileRowProps) {
  const [expanded, setExpanded] = useState(false)
  const canExpand = details.length > 0
  const activate = onOpen ?? (canExpand ? () => setExpanded((value) => !value) : undefined)
  return (
    <div className={cn('min-w-0 px-3 py-2 even:bg-foreground/[0.03]', selected && 'bg-primary/10 even:bg-primary/10')}>
      <div className="flex min-w-0 items-start gap-2">
        {canSelect ? <Checkbox className="mt-0.5" aria-label={selectLabel} checked={selected} onCheckedChange={onToggleSelected} /> : null}
        <div
          className="min-w-0 flex-1"
          role={activate ? 'button' : undefined}
          tabIndex={activate ? 0 : undefined}
          onClick={activate}
          onKeyDown={(event) => {
            if (activate && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault()
              activate()
            }
          }}
        >
          <div className="min-w-0 text-sm font-medium leading-tight [&_p+p]:text-xs [&_p+p]:font-normal [&_p+p]:text-muted-foreground [&_p:nth-child(n+3)]:hidden">{title}</div>
          {summary.length > 0 ? (
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground [&_p+p]:hidden">{summary}</div>
          ) : null}
        </div>
        <div className="-my-1 -mr-1 flex shrink-0 items-center">
          {canExpand ? (
            <Button type="button" variant="ghost" size="icon-sm" aria-expanded={expanded} aria-label={expanded ? 'Masquer les détails' : 'Afficher les détails'} onClick={() => setExpanded((value) => !value)}>
              <ChevronDown className={cn('transition-transform duration-200 ease-standard', expanded && 'rotate-180')} />
            </Button>
          ) : null}
          {menu}
        </div>
      </div>
      {expanded ? (
        <dl className={cn('mt-2 space-y-1 border-t border-border pt-2 text-xs', canSelect && 'pl-6')}>
          {details.map((detail) => (
            <div key={detail.id} className="flex min-w-0 items-baseline justify-between gap-4">
              <dt className="shrink-0 text-subtle">{detail.label}</dt>
              <dd className="min-w-0 break-words text-right">{detail.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  )
}

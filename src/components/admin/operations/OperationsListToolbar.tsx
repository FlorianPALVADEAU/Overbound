'use client'

import { Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { OperationsListColumn, OperationsListFilter } from './types'

interface OperationsListToolbarProps<T> {
  search?: string
  searchPlaceholder?: string
  onSearchChange?: (value: string) => void
  filters?: OperationsListFilter[]
  onFilterChange?: (filterId: string, value: string) => void
  columns: OperationsListColumn<T>[]
  visibleColumnIds?: readonly string[]
  onVisibleColumnIdsChange?: (columnIds: string[]) => void
}

export function OperationsListToolbar<T>({
  search,
  searchPlaceholder = 'Rechercher',
  onSearchChange,
  filters = [],
  onFilterChange,
  columns,
  visibleColumnIds,
  onVisibleColumnIdsChange,
}: OperationsListToolbarProps<T>) {
  const canChooseColumns = visibleColumnIds !== undefined && onVisibleColumnIdsChange !== undefined

  const toggleColumn = (columnId: string) => {
    if (!visibleColumnIds || !onVisibleColumnIdsChange) return
    const next = visibleColumnIds.includes(columnId)
      ? visibleColumnIds.filter((id) => id !== columnId)
      : [...visibleColumnIds, columnId]
    if (next.length > 0) onVisibleColumnIdsChange(next)
  }

  return (
    <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:flex-wrap sm:items-center">
      {onSearchChange ? (
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input value={search ?? ''} onChange={(event) => onSearchChange(event.target.value)} className="pl-9" placeholder={searchPlaceholder} />
        </div>
      ) : null}
      {filters.map((filter) => (
        <Select key={filter.id} value={filter.value || '__all__'} onValueChange={(value) => onFilterChange?.(filter.id, value === '__all__' ? '' : value)}>
          <SelectTrigger size="sm" aria-label={filter.label}><SelectValue placeholder={filter.label} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{filter.allLabel ?? `Tous les ${filter.label.toLowerCase()}`}</SelectItem>
            {filter.options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}{option.count !== undefined ? ` (${option.count})` : ''}</SelectItem>)}
          </SelectContent>
        </Select>
      ))}
      {canChooseColumns ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button type="button" variant="outline" size="sm" className="sm:ml-auto"><SlidersHorizontal />Colonnes</Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns.map((column) => <DropdownMenuCheckboxItem key={column.id} checked={visibleColumnIds.includes(column.id)} onCheckedChange={() => toggleColumn(column.id)}>{column.header}</DropdownMenuCheckboxItem>)}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  )
}

'use client'

import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { ReactNode } from 'react'
import { Clock } from 'lucide-react'

export interface AdminDataGridColumn<T> {
  key: string
  header: ReactNode
  className?: string
  cell: (item: T) => ReactNode
}

interface AdminDataGridProps<T> {
  data: T[]
  columns: AdminDataGridColumn<T>[]
  loading?: boolean
  fetching?: boolean
  emptyMessage?: ReactNode
  toolbar?: ReactNode
  meta?: ReactNode
  getRowId?: (item: T, index: number) => string
}

export function AdminDataGrid<T>({
  data,
  columns,
  loading = false,
  fetching = false,
  emptyMessage = 'Aucune donnée disponible.',
  toolbar,
  meta,
  getRowId,
}: AdminDataGridProps<T>) {
  const showLoadingState = loading && data.length === 0
  const showEmptyState = !loading && data.length === 0

  return (
    <Card className="border shadow-sm">
      {(toolbar || meta) && (
        <div className="flex flex-col gap-3 border-b border-border bg-muted/40 px-4 py-3 md:flex-row md:items-center md:justify-between">
          {toolbar ? <div className="flex-1">{toolbar}</div> : null}
          {meta ? <div className="text-sm text-muted-foreground md:text-right">{meta}</div> : null}
        </div>
      )}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} className={cn(column.className)}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {showLoadingState ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-16 text-center text-muted-foreground">
                    <Clock className="mx-auto mb-3 h-8 w-8 animate-spin" />
                    Chargement des données…
                  </TableCell>
                </TableRow>
              ) : showEmptyState ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-16 text-center text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow key={getRowId ? getRowId(item, index) : index}>
                    {columns.map((column) => (
                      <TableCell key={`${column.key}-${index}`} className={cn(column.className)}>
                        {column.cell(item)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {fetching && !showLoadingState && (
          <div className="flex items-center justify-center gap-2 border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
            <Clock className="h-4 w-4 animate-spin" />
            Actualisation des données…
          </div>
        )}
      </CardContent>
    </Card>
  )
}

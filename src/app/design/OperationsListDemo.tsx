'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OperationsList, type OperationsListColumn } from '@/components/admin/operations'

interface Row {
  id: string
  name: string
  email: string
  event: string
  ticket: string
  checkedIn: boolean
}

const ROWS: Row[] = [
  { id: '0', name: 'Léa Martin', email: 'lea@example.com', event: 'Ultra Arena', ticket: 'OPEN · Ultra Arena', checkedIn: true },
  { id: '1', name: 'Jerem', email: 'jerem@example.com', event: 'Ultra Arena', ticket: 'OPEN · Ultra Arena', checkedIn: false },
  { id: '2', name: 'Florian Palvadeau', email: 'florian@example.com', event: 'Ultra Arena', ticket: 'RANKED · Ultra Arena', checkedIn: true },
  { id: '3', name: 'Camille Durand', email: 'camille@example.com', event: 'Ultra Arena', ticket: 'OPEN · Ultra Arena', checkedIn: false },
]

const COLUMNS: OperationsListColumn<Row>[] = [
  {
    id: 'participant',
    header: 'Participant',
    cell: (row) => (
      <>
        <p className="truncate">{row.name}</p>
        <p className="truncate text-xs font-normal text-muted-foreground">{row.email}</p>
      </>
    ),
  },
  { id: 'event', header: 'Événement', mobile: 'detail', cell: (row) => row.event },
  { id: 'ticket', header: 'Billet', mobile: 'summary', cell: (row) => row.ticket },
  {
    id: 'presence',
    header: 'Présence',
    mobile: 'summary',
    cell: (row) => <Badge variant={row.checkedIn ? 'default' : 'outline'} className="h-5 px-1.5 text-label">{row.checkedIn ? 'Présent' : 'Non check-in'}</Badge>,
  },
]

/** Mobile reference for data lists (docs/design/design-system.md, « Mobile »). */
export function OperationsListDemo() {
  const [search, setSearch] = useState('')
  return (
    <OperationsList
      data={{ items: ROWS, nextCursor: null, total: ROWS.length }}
      getItemId={(row) => row.id}
      columns={COLUMNS}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Email, événement, billet…"
      filters={[{ id: 'presence', label: 'Présence', value: '', options: [{ value: 'in', label: 'Présent' }] }]}
      rowActions={[{ id: 'open', label: 'Ouvrir', onSelect: () => undefined }]}
      pagination={{ cursor: null, previousCursors: [], nextCursor: null, total: ROWS.length, limit: 50 }}
      onPaginationChange={() => undefined}
      toolbarActions={
        <Button variant="outline" size="sm">
          <Download />
          Export CSV
        </Button>
      }
      itemLabel="inscription"
    />
  )
}

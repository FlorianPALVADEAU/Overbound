'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OperationsList, type OperationsListAction, type OperationsListColumn } from '@/components/admin/operations'
import type { LuckyWheelReward } from '@/app/api/admin/lucky-wheel/luckyWheelQueries'

interface RewardTableProps {
  rewards: LuckyWheelReward[]
  loading?: boolean
  deletingId?: string | null
  onEdit: (reward: LuckyWheelReward) => void
  onDelete: (reward: LuckyWheelReward) => void
  pagination: { cursor: string | null; previousCursors: string[]; nextCursor: string | null; total?: number }
  onPaginationChange: (pagination: { cursor: string | null; previousCursors: string[] }) => void
}

export function RewardTable({ rewards, loading, deletingId, onEdit, onDelete, pagination, onPaginationChange }: RewardTableProps) {
  const columns: OperationsListColumn<LuckyWheelReward>[] = [
    {
      id: 'name',
      header: 'Récompense',
      cell: (reward) => (
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{reward.name}</span>
          <span className="text-xs text-muted-foreground">{reward.type}</span>
        </div>
      ),
    },
    {
      id: 'stock',
      header: 'Stock / gains',
      cell: (reward) => (
        <span>
          {reward.stock ?? '∞'} en stock · {reward.wins_count}/{reward.max_wins ?? '∞'} gagnés
        </span>
      ),
    },
    {
      id: 'weight',
      header: 'Poids',
      cell: (reward) => <span>{reward.weight ?? '—'}</span>,
    },
    {
      id: 'phases',
      header: 'Phases',
      cell: (reward) => (
        <div className="flex flex-wrap gap-1">
          {reward.commercial_phases.map((phase) => (
            <Badge key={phase} variant="outline" className="text-xs">
              {phase}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Statut',
      cell: (reward) => (
        <Badge variant={reward.enabled ? 'default' : 'secondary'}>{reward.enabled ? 'Active' : 'Inactive'}</Badge>
      ),
    },
  ]

  const actions: OperationsListAction<LuckyWheelReward>[] = [
    { id: 'edit', label: 'Modifier', onSelect: onEdit },
    { id: 'delete', label: 'Supprimer', destructive: true, disabled: (reward) => deletingId === reward.id, onSelect: onDelete },
  ]

  return (
    <OperationsList data={{ items: rewards, nextCursor: pagination.nextCursor, total: pagination.total }} status={loading ? 'loading' : 'idle'} getItemId={(reward) => reward.id} columns={columns} rowActions={actions} pagination={{ ...pagination, limit: 25 }} onPaginationChange={onPaginationChange} itemLabel="récompense" />
  )
}

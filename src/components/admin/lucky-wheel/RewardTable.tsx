'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AdminDataGrid, type AdminDataGridColumn } from '@/components/admin/ui/AdminDataGrid'
import type { LuckyWheelReward } from '@/app/api/admin/lucky-wheel/luckyWheelQueries'

interface RewardTableProps {
  rewards: LuckyWheelReward[]
  loading?: boolean
  deletingId?: string | null
  onEdit: (reward: LuckyWheelReward) => void
  onDelete: (reward: LuckyWheelReward) => void
}

export function RewardTable({ rewards, loading, deletingId, onEdit, onDelete }: RewardTableProps) {
  const columns: AdminDataGridColumn<LuckyWheelReward>[] = [
    {
      key: 'name',
      header: 'Récompense',
      cell: (reward) => (
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{reward.name}</span>
          <span className="text-xs text-muted-foreground">{reward.type}</span>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock / gains',
      cell: (reward) => (
        <span>
          {reward.stock ?? '∞'} en stock · {reward.wins_count}/{reward.max_wins ?? '∞'} gagnés
        </span>
      ),
    },
    {
      key: 'weight',
      header: 'Poids',
      cell: (reward) => <span>{reward.weight ?? '—'}</span>,
    },
    {
      key: 'phases',
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
      key: 'status',
      header: 'Statut',
      cell: (reward) => (
        <Badge variant={reward.enabled ? 'default' : 'secondary'}>{reward.enabled ? 'Active' : 'Inactive'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[160px]',
      cell: (reward) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(reward)}>
            Modifier
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(reward)}
            disabled={deletingId === reward.id}
          >
            {deletingId === reward.id ? 'Suppression…' : 'Supprimer'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AdminDataGrid
      data={rewards}
      columns={columns}
      loading={loading}
      emptyMessage="Aucune récompense configurée pour cette campagne."
      getRowId={(reward) => reward.id}
    />
  )
}

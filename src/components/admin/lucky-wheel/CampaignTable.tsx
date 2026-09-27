'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OperationsList, type OperationsListAction, type OperationsListColumn } from '@/components/admin/operations'
import type { LuckyWheelCampaign } from '@/app/api/admin/lucky-wheel/luckyWheelQueries'

interface CampaignTableProps {
  campaigns: LuckyWheelCampaign[]
  loading?: boolean
  selectedCampaignId: string | null
  deletingId?: string | null
  onSelect: (campaign: LuckyWheelCampaign) => void
  onEdit: (campaign: LuckyWheelCampaign) => void
  onDelete: (campaign: LuckyWheelCampaign) => void
  onTogglePause: (campaign: LuckyWheelCampaign, paused: boolean) => Promise<void>
  search?: string
  onSearchChange?: (value: string) => void
  pagination: { cursor: string | null; previousCursors: string[]; nextCursor: string | null; total?: number }
  onPaginationChange: (pagination: { cursor: string | null; previousCursors: string[] }) => void
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

export function CampaignTable({
  campaigns,
  loading,
  selectedCampaignId,
  deletingId,
  onSelect,
  onEdit,
  onDelete,
  onTogglePause,
  search,
  onSearchChange,
  pagination,
  onPaginationChange,
}: CampaignTableProps) {
  const columns: OperationsListColumn<LuckyWheelCampaign>[] = [
    {
      id: 'name',
      header: 'Campagne',
      cell: (campaign) => (
        <button
          type="button"
          onClick={() => onSelect(campaign)}
          className="text-left font-semibold hover:underline"
        >
          {campaign.name}
          <div className="text-xs font-normal text-muted-foreground">
            {campaign.events.length} événement{campaign.events.length > 1 ? 's' : ''} ·{' '}
            {campaign.rewards.length} récompense{campaign.rewards.length > 1 ? 's' : ''}
          </div>
        </button>
      ),
    },
    {
      id: 'window',
      header: 'Fenêtre',
      cell: (campaign) => (
        <div className="flex flex-col text-xs text-muted-foreground">
          <span>Du {formatDate(campaign.starts_at)}</span>
          <span>Au {formatDate(campaign.ends_at)}</span>
        </div>
      ),
    },
    {
      id: 'phase',
      header: 'Phase',
      cell: (campaign) => <Badge variant="outline">{campaign.commercial_phase}</Badge>,
    },
    {
      id: 'status',
      header: 'Statut',
      cell: (campaign) => (
        <div className="flex flex-col gap-1">
          <Badge variant={campaign.enabled ? 'default' : 'secondary'}>
            {campaign.enabled ? 'Activée' : 'Désactivée'}
          </Badge>
          {campaign.paused ? <Badge variant="destructive">En pause</Badge> : null}
        </div>
      ),
    },
  ]

  const actions: OperationsListAction<LuckyWheelCampaign>[] = [
    { id: 'pause', label: 'Changer la pause', onSelect: (campaign) => { void onTogglePause(campaign, !campaign.paused) } },
    { id: 'edit', label: 'Modifier', onSelect: onEdit },
    { id: 'delete', label: 'Supprimer', destructive: true, disabled: (campaign) => deletingId === campaign.id, onSelect: onDelete },
  ]

  return (
    <OperationsList data={{ items: campaigns, nextCursor: pagination.nextCursor, total: pagination.total }} status={loading ? 'loading' : 'idle'} getItemId={(campaign) => campaign.id} columns={columns} rowActions={actions} search={search} searchPlaceholder="Rechercher une campagne…" onSearchChange={onSearchChange} pagination={{ ...pagination, limit: 25 }} onPaginationChange={onPaginationChange} itemLabel="campagne" />
  )
}

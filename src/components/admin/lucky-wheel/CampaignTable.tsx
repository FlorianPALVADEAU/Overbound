'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AdminDataGrid, type AdminDataGridColumn } from '@/components/admin/ui/AdminDataGrid'
import { PauseCampaignButton } from './PauseCampaignButton'
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
}: CampaignTableProps) {
  const columns: AdminDataGridColumn<LuckyWheelCampaign>[] = [
    {
      key: 'name',
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
      key: 'window',
      header: 'Fenêtre',
      cell: (campaign) => (
        <div className="flex flex-col text-xs text-muted-foreground">
          <span>Du {formatDate(campaign.starts_at)}</span>
          <span>Au {formatDate(campaign.ends_at)}</span>
        </div>
      ),
    },
    {
      key: 'phase',
      header: 'Phase',
      cell: (campaign) => <Badge variant="outline">{campaign.commercial_phase}</Badge>,
    },
    {
      key: 'status',
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
    {
      key: 'actions',
      header: '',
      className: 'w-[280px]',
      cell: (campaign) => (
        <div className="flex flex-wrap justify-end gap-2">
          <PauseCampaignButton
            paused={campaign.paused}
            onToggle={(paused) => onTogglePause(campaign, paused)}
          />
          <Button variant="outline" size="sm" onClick={() => onEdit(campaign)}>
            Modifier
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(campaign)}
            disabled={deletingId === campaign.id}
          >
            {deletingId === campaign.id ? 'Suppression…' : 'Supprimer'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AdminDataGrid
      data={campaigns}
      columns={columns}
      loading={loading}
      emptyMessage="Aucune campagne Lucky Wheel configurée."
      getRowId={(campaign) => campaign.id}
    />
  )
}

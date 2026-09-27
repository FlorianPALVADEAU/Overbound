'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { useAdminEvents } from '@/app/api/admin/events/eventsQueries'
import { useAdminUpsells } from '@/app/api/admin/upsells/upsellsQueries'
import {
  adminLuckyWheelCampaignsQueryKey,
  adminLuckyWheelRewardsQueryKey,
  createAdminLuckyWheelCampaign,
  createAdminLuckyWheelReward,
  deleteAdminLuckyWheelCampaign,
  deleteAdminLuckyWheelReward,
  pauseAdminLuckyWheelCampaign,
  updateAdminLuckyWheelCampaign,
  updateAdminLuckyWheelReward,
  useAdminLuckyWheelCampaigns,
  useAdminLuckyWheelCampaignsPage,
  useAdminLuckyWheelRewards,
  useAdminLuckyWheelRewardsPage,
  type LuckyWheelCampaign,
  type LuckyWheelCampaignPayload,
  type LuckyWheelReward,
  type LuckyWheelRewardPayload,
} from '@/app/api/admin/lucky-wheel/luckyWheelQueries'
import { CampaignTable } from './CampaignTable'
import {
  CampaignFormDialog,
  DEFAULT_CAMPAIGN_FORM_VALUES,
  type CampaignFormValues,
} from './CampaignFormDialog'
import { RewardTable } from './RewardTable'
import { RewardFormDialog, DEFAULT_REWARD_FORM_VALUES, type RewardFormValues } from './RewardFormDialog'

interface MessageState {
  type: 'success' | 'error'
  text: string
}

const toDatetimeLocal = (iso: string) => new Date(iso).toISOString().slice(0, 16)

function buildCampaignFormValues(campaign?: LuckyWheelCampaign): CampaignFormValues {
  if (!campaign) return DEFAULT_CAMPAIGN_FORM_VALUES
  const delayMs = (campaign.trigger_rules as { delay_ms?: number } | undefined)?.delay_ms
  return {
    name: campaign.name,
    enabled: campaign.enabled,
    paused: campaign.paused,
    starts_at: toDatetimeLocal(campaign.starts_at),
    ends_at: toDatetimeLocal(campaign.ends_at),
    commercial_phase: campaign.commercial_phase,
    reward_expiration_hours: String(campaign.reward_expiration_hours),
    max_discount_budget: campaign.max_discount_budget !== null ? String(campaign.max_discount_budget) : '',
    event_ids: campaign.events.map((e) => e.event_id),
    trigger_delay_seconds: String(typeof delayMs === 'number' ? Math.round(delayMs / 1000) : 5),
  }
}

function buildRewardFormValues(reward?: LuckyWheelReward): RewardFormValues {
  if (!reward) return DEFAULT_REWARD_FORM_VALUES
  return {
    name: reward.name,
    type: reward.type,
    weight: reward.weight !== null ? String(reward.weight) : '',
    stock: reward.stock !== null ? String(reward.stock) : '',
    max_wins: reward.max_wins !== null ? String(reward.max_wins) : '',
    public_value: reward.public_value !== null ? String(reward.public_value) : '',
    estimated_cost: reward.estimated_cost !== null ? String(reward.estimated_cost) : '',
    commercial_phases: reward.commercial_phases,
    enabled: reward.enabled,
    image_url: reward.image_url ?? '',
    target_upsell_id: reward.target_upsell_id ?? '',
  }
}

const errorMessage = (error: unknown, fallback: string) =>
  axios.isAxiosError(error) ? error.response?.data?.error || error.message : (error as Error)?.message || fallback

// FDR-0014 §10/§12: orchestrator only -- delegates rendering to
// CampaignTable/RewardTable/*FormDialog, per engineering.md.
export function LuckyWheelSection() {
  const queryClient = useQueryClient()
  const [campaignSearch, setCampaignSearch] = useState('')
  const deferredCampaignSearch = useDeferredValue(campaignSearch.trim())
  const [campaignCursor, setCampaignCursor] = useState<string | null>(null)
  const [campaignPreviousCursors, setCampaignPreviousCursors] = useState<string[]>([])
  const { data: campaignPage, isLoading: campaignsLoading } = useAdminLuckyWheelCampaignsPage({ cursor: campaignCursor, limit: 25, search: deferredCampaignSearch })
  const campaigns = useMemo(() => campaignPage?.items ?? [], [campaignPage?.items])
  const { data: events = [] } = useAdminEvents()
  // FDR-0014 addendum (product-line discounts) §3.1: options for the
  // PRODUCT_DISCOUNT/PHOTO_DISCOUNT "produit ciblé" selector.
  const { data: upsells = [] } = useAdminUpsells()
  const upsellOptions = useMemo(() => upsells.map((upsell) => ({ id: upsell.id, name: upsell.name })), [upsells])

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [rewardCursor, setRewardCursor] = useState<string | null>(null)
  const [rewardPreviousCursors, setRewardPreviousCursors] = useState<string[]>([])
  const { data: rewardPage, isLoading: rewardsLoading } = useAdminLuckyWheelRewardsPage(selectedCampaignId, { cursor: rewardCursor, limit: 25 })
  const rewards = rewardPage?.items ?? []

  useEffect(() => {
    setCampaignCursor(null)
    setCampaignPreviousCursors([])
  }, [deferredCampaignSearch])

  useEffect(() => {
    setRewardCursor(null)
    setRewardPreviousCursors([])
  }, [selectedCampaignId])

  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false)
  const [campaignDialogMode, setCampaignDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedCampaign, setSelectedCampaign] = useState<LuckyWheelCampaign | null>(null)
  const [campaignFormValues, setCampaignFormValues] = useState<CampaignFormValues>(DEFAULT_CAMPAIGN_FORM_VALUES)
  const [campaignSubmitting, setCampaignSubmitting] = useState(false)
  const [campaignDeletingId, setCampaignDeletingId] = useState<string | null>(null)

  const [rewardDialogOpen, setRewardDialogOpen] = useState(false)
  const [rewardDialogMode, setRewardDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedReward, setSelectedReward] = useState<LuckyWheelReward | null>(null)
  const [rewardFormValues, setRewardFormValues] = useState<RewardFormValues>(DEFAULT_REWARD_FORM_VALUES)
  const [rewardSubmitting, setRewardSubmitting] = useState(false)
  const [rewardDeletingId, setRewardDeletingId] = useState<string | null>(null)

  const [message, setMessage] = useState<MessageState | null>(null)

  const selectedCampaignFromList = useMemo(
    () => campaigns.find((c) => c.id === selectedCampaignId) ?? null,
    [campaigns, selectedCampaignId],
  )

  // Campaigns ---------------------------------------------------------------

  const handleCreateCampaignClick = () => {
    setCampaignDialogMode('create')
    setSelectedCampaign(null)
    setCampaignFormValues(DEFAULT_CAMPAIGN_FORM_VALUES)
    setCampaignDialogOpen(true)
  }

  const handleEditCampaign = (campaign: LuckyWheelCampaign) => {
    setCampaignDialogMode('edit')
    setSelectedCampaign(campaign)
    setCampaignFormValues(buildCampaignFormValues(campaign))
    setCampaignDialogOpen(true)
  }

  const handleDeleteCampaign = async (campaign: LuckyWheelCampaign) => {
    if (!confirm(`Supprimer la campagne "${campaign.name}" ? Les allocations déjà gagnées ne sont pas supprimées.`)) {
      return
    }
    setCampaignDeletingId(campaign.id)
    try {
      await deleteAdminLuckyWheelCampaign(campaign.id)
      queryClient.setQueryData<LuckyWheelCampaign[]>(adminLuckyWheelCampaignsQueryKey, (previous) =>
        (previous ?? []).filter((c) => c.id !== campaign.id),
      )
      if (selectedCampaignId === campaign.id) setSelectedCampaignId(null)
      setMessage({ type: 'success', text: 'Campagne supprimée' })
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error, 'Erreur lors de la suppression') })
    } finally {
      setCampaignDeletingId(null)
    }
  }

  const handleTogglePause = async (campaign: LuckyWheelCampaign, paused: boolean) => {
    try {
      const updated = await pauseAdminLuckyWheelCampaign(campaign.id, paused)
      queryClient.setQueryData<LuckyWheelCampaign[]>(adminLuckyWheelCampaignsQueryKey, (previous) =>
        (previous ?? []).map((c) => (c.id === campaign.id ? { ...c, paused: updated.paused } : c)),
      )
      setMessage({
        type: 'success',
        text: paused ? 'Campagne mise en pause' : 'Campagne reprise',
      })
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error, 'Erreur lors du changement de statut') })
    }
  }

  const handleCampaignSubmit = async (payload: LuckyWheelCampaignPayload) => {
    setCampaignSubmitting(true)
    setMessage(null)
    try {
      if (campaignDialogMode === 'create') {
        const created = await createAdminLuckyWheelCampaign(payload)
        queryClient.setQueryData<LuckyWheelCampaign[]>(adminLuckyWheelCampaignsQueryKey, (previous) => [
          created,
          ...(previous ?? []),
        ])
        setMessage({ type: 'success', text: 'Campagne créée' })
      } else if (selectedCampaign) {
        const updated = await updateAdminLuckyWheelCampaign(selectedCampaign.id, payload)
        queryClient.setQueryData<LuckyWheelCampaign[]>(adminLuckyWheelCampaignsQueryKey, (previous) =>
          (previous ?? []).map((c) => (c.id === selectedCampaign.id ? updated : c)),
        )
        setMessage({ type: 'success', text: 'Campagne mise à jour' })
      }
      setCampaignDialogOpen(false)
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error, 'Erreur lors de la sauvegarde') })
    } finally {
      setCampaignSubmitting(false)
    }
  }

  // Rewards -------------------------------------------------------------------

  const handleCreateRewardClick = () => {
    setRewardDialogMode('create')
    setSelectedReward(null)
    setRewardFormValues(DEFAULT_REWARD_FORM_VALUES)
    setRewardDialogOpen(true)
  }

  const handleEditReward = (reward: LuckyWheelReward) => {
    setRewardDialogMode('edit')
    setSelectedReward(reward)
    setRewardFormValues(buildRewardFormValues(reward))
    setRewardDialogOpen(true)
  }

  const handleDeleteReward = async (reward: LuckyWheelReward) => {
    if (!confirm(`Supprimer la récompense "${reward.name}" ?`)) return
    setRewardDeletingId(reward.id)
    try {
      await deleteAdminLuckyWheelReward(reward.id)
      if (selectedCampaignId) {
        queryClient.setQueryData<LuckyWheelReward[]>(adminLuckyWheelRewardsQueryKey(selectedCampaignId), (previous) =>
          (previous ?? []).filter((r) => r.id !== reward.id),
        )
      }
      setMessage({ type: 'success', text: 'Récompense supprimée' })
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error, 'Erreur lors de la suppression') })
    } finally {
      setRewardDeletingId(null)
    }
  }

  const handleRewardSubmit = async (payload: LuckyWheelRewardPayload) => {
    if (!selectedCampaignId) return
    setRewardSubmitting(true)
    setMessage(null)
    try {
      if (rewardDialogMode === 'create') {
        const created = await createAdminLuckyWheelReward(payload)
        queryClient.setQueryData<LuckyWheelReward[]>(adminLuckyWheelRewardsQueryKey(selectedCampaignId), (previous) => [
          created,
          ...(previous ?? []),
        ])
        setMessage({ type: 'success', text: 'Récompense créée' })
      } else if (selectedReward) {
        const { campaign_id: _campaignId, ...updatePayload } = payload
        const updated = await updateAdminLuckyWheelReward(selectedReward.id, updatePayload)
        queryClient.setQueryData<LuckyWheelReward[]>(adminLuckyWheelRewardsQueryKey(selectedCampaignId), (previous) =>
          (previous ?? []).map((r) => (r.id === selectedReward.id ? updated : r)),
        )
        setMessage({ type: 'success', text: 'Récompense mise à jour' })
      }
      setRewardDialogOpen(false)
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error, 'Erreur lors de la sauvegarde') })
    } finally {
      setRewardSubmitting(false)
    }
  }

  const alertVariant = message?.type === 'error' ? 'destructive' : 'default'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lucky Wheel</h2>
          <p className="text-muted-foreground">
            Campagnes de roue de la chance. Le tirage reste toujours déterminé côté serveur.
          </p>
        </div>
        <Button onClick={handleCreateCampaignClick}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle campagne
        </Button>
      </div>

      {message && (
        <Alert variant={alertVariant}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <CampaignTable
        campaigns={campaigns}
        loading={campaignsLoading}
        selectedCampaignId={selectedCampaignId}
        deletingId={campaignDeletingId}
        onSelect={(campaign) => setSelectedCampaignId(campaign.id === selectedCampaignId ? null : campaign.id)}
        onEdit={handleEditCampaign}
        onDelete={handleDeleteCampaign}
        onTogglePause={handleTogglePause}
        search={campaignSearch}
        onSearchChange={(value) => { setCampaignSearch(value); setCampaignCursor(null); setCampaignPreviousCursors([]) }}
        pagination={{ cursor: campaignCursor, previousCursors: campaignPreviousCursors, nextCursor: campaignPage?.nextCursor ?? null, total: campaignPage?.total }}
        onPaginationChange={({ cursor, previousCursors }) => { setCampaignCursor(cursor); setCampaignPreviousCursors(previousCursors) }}
      />

      {selectedCampaignFromList ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Récompenses — {selectedCampaignFromList.name}</CardTitle>
              <CardDescription>
                Le stock et le nombre de gains sont décrémentés atomiquement à chaque tirage.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleCreateRewardClick}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle récompense
            </Button>
          </CardHeader>
          <CardContent>
        <RewardTable
              rewards={rewards}
              loading={rewardsLoading}
              deletingId={rewardDeletingId}
              onEdit={handleEditReward}
          onDelete={handleDeleteReward}
          pagination={{ cursor: rewardCursor, previousCursors: rewardPreviousCursors, nextCursor: rewardPage?.nextCursor ?? null, total: rewardPage?.total }}
          onPaginationChange={({ cursor, previousCursors }) => { setRewardCursor(cursor); setRewardPreviousCursors(previousCursors) }}
            />
          </CardContent>
        </Card>
      ) : null}

      <CampaignFormDialog
        open={campaignDialogOpen}
        mode={campaignDialogMode}
        events={events}
        initialValues={campaignFormValues}
        loading={campaignSubmitting}
        onOpenChange={setCampaignDialogOpen}
        onSubmit={handleCampaignSubmit}
      />

      {selectedCampaignId ? (
        <RewardFormDialog
          open={rewardDialogOpen}
          mode={rewardDialogMode}
          campaignId={selectedCampaignId}
          initialValues={rewardFormValues}
          loading={rewardSubmitting}
          upsellOptions={upsellOptions}
          onOpenChange={setRewardDialogOpen}
          onSubmit={handleRewardSubmit}
        />
      ) : null}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useAdminAmbassadorDetail } from '@/app/api/admin/ambassadors/ambassadorsQueries'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateTime, REWARD_STATUS_LABELS, REWARD_STATUS_STYLES, SETTABLE_REWARD_STATUSES } from './rewardStatus'
import { useRewardActions } from './useRewardActions'
import type { AmbassadorRewardStatus } from '@/types/Ambassador'

const isSettable = (value: string): value is (typeof SETTABLE_REWARD_STATUSES)[number] =>
  SETTABLE_REWARD_STATUSES.some((status) => status === value)

/** One ambassador: points per season, rewards (with their actions) and the history of manual decisions. */
export function AmbassadorDetailDialog({ ambassadorId, onClose }: { ambassadorId: string; onClose: () => void }) {
  const { data: detail, isLoading, error } = useAdminAmbassadorDetail(ambassadorId)
  const actions = useRewardActions()
  const [year, setYear] = useState('all')

  const years = detail?.yearly_points.map((row) => row.program_year) ?? []
  const rewards = (detail?.rewards ?? []).filter((reward) => year === 'all' || reward.program_year === Number(year))

  return (
    <>
      <Dialog open onOpenChange={(next) => !next && onClose()}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detail?.ambassador.name ?? 'Fiche ambassadeur'}</DialogTitle>
            <DialogDescription>{detail?.ambassador.code ? `Code : ${detail.ambassador.code}` : 'Historique et récompenses'}</DialogDescription>
          </DialogHeader>
          {isLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : null}
          {error ? <Alert variant="destructive" role="alert"><AlertDescription>{error.message}</AlertDescription></Alert> : null}
          {actions.notice ? (
            <Alert variant={actions.notice.tone === 'error' ? 'destructive' : 'default'} role="status">
              <AlertDescription className="flex items-center justify-between gap-3">
                <span>{actions.notice.text}</span>
                <Button type="button" variant="ghost" size="sm" onClick={actions.clearNotice}>Fermer</Button>
              </AlertDescription>
            </Alert>
          ) : null}
          {detail ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {detail.yearly_points.map((row) => (
                  <div key={row.program_year} className="rounded-xl border p-3">
                    <p className="font-semibold">{row.program_year}</p>
                    <p className="text-2xl font-bold">{row.total_points} pts</p>
                    <p className="text-xs text-muted-foreground">{row.recruits_open} Open · {row.recruits_ranked} Ranked</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold">Récompenses</p>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="w-full sm:w-48" aria-label="Filtrer par saison"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les saisons</SelectItem>
                      {years.map((value) => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {rewards.length === 0 ? (
                  <p className="rounded-xl border p-3 text-sm text-muted-foreground">Aucune récompense pour cette saison.</p>
                ) : (
                  rewards.map((reward) => (
                    <div key={reward.id} className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium">{reward.program_year} · Palier {reward.reward_level}, {reward.reward_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Gagnée le {formatDateTime(reward.earned_at)} · Expire {reward.expires_at ? `le ${formatDateTime(reward.expires_at)}` : 'jamais'}
                          {reward.cancellation_reason ? ` · Motif : ${reward.cancellation_reason}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={REWARD_STATUS_STYLES[reward.status]}>{REWARD_STATUS_LABELS[reward.status]}</Badge>
                        {reward.status !== 'cancelled' ? (
                          <Select
                            value={reward.status}
                            onValueChange={(value) => isSettable(value) && void actions.setStatus(reward.id, value satisfies AmbassadorRewardStatus)}
                            disabled={actions.pending}
                          >
                            <SelectTrigger className="w-32" aria-label="Changer le statut"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {SETTABLE_REWARD_STATUSES.map((status) => <SelectItem key={status} value={status}>{REWARD_STATUS_LABELS[status]}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : null}
                        {reward.status === 'cancelled' ? (
                          <Button type="button" size="sm" variant="outline" disabled={actions.pending} onClick={() => actions.askTransition(reward.id, 'reopened')}>Rouvrir</Button>
                        ) : (
                          <Button type="button" size="sm" variant="outline" disabled={actions.pending} onClick={() => actions.askTransition(reward.id, 'cancelled')}>Annuler</Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {detail.audit_events.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Historique des décisions</p>
                  {detail.audit_events.map((event) => (
                    <div key={`${event.reward_id}-${event.occurred_at}`} className="rounded-xl border p-3 text-sm">
                      <p className="font-medium">{event.action === 'cancelled' ? 'Récompense annulée' : 'Récompense rouverte'} · {formatDateTime(event.occurred_at)}</p>
                      <p className="text-muted-foreground">{event.reason}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      {actions.dialog}
    </>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useAdminAmbassadors,
  useAdminAmbassadorPoints,
  useUpdateAmbassadorReward,
  useUpdateAmbassadorPoints,
  useAmbassadorCodes,
  useAdminPromoCodes,
  useAssignAmbassadorCode,
  useSetCurrentAmbassadorCode,
  useRemoveAmbassadorCode,
  useAddManualReferralWithPoints,
} from '@/app/api/admin/ambassadors/ambassadorsQueries'
import type { AmbassadorRewardStatus } from '@/types/Ambassador'

const STATUS_LABELS: Record<AmbassadorRewardStatus, string> = {
  earned: 'Débloquée',
  claimed: 'Réclamée',
  fulfilled: 'Envoyée',
}

const STATUS_STYLES: Record<AmbassadorRewardStatus, string> = {
  earned: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-600',
  claimed: 'border-amber-500/40 bg-amber-500/20 text-amber-600',
  fulfilled: 'border-sky-500/40 bg-sky-500/20 text-sky-600',
}

const formatDateTime = (value: string | null) =>
  value
    ? new Date(value).toLocaleString('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '-'

export function AmbassadorsSection() {
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get('search')?.trim() ?? ''
  const [search, setSearch] = useState(initialSearch)
  const [statusFilter, setStatusFilter] = useState<AmbassadorRewardStatus | 'all'>('all')
  const { data, isLoading, error, refetch, isFetching } = useAdminAmbassadors()
  const updateReward = useUpdateAmbassadorReward()
  const { data: pointsData, isLoading: pointsLoading, error: pointsError, refetch: refetchPoints } =
    useAdminAmbassadorPoints()
  const updatePoints = useUpdateAmbassadorPoints()
  const [editingPoints, setEditingPoints] = useState<{
    ambassador_id: string
    ambassador_name: string
    ambassador_code: string | null
    total_points: number
    recruits_open: number
    recruits_ranked: number
  } | null>(null)

  const [managingCodesFor, setManagingCodesFor] = useState<{
    ambassador_id: string
    ambassador_name: string
  } | null>(null)
  const [selectedCodeToAdd, setSelectedCodeToAdd] = useState<string>('')
  const [setAsCurrentOnAdd, setSetAsCurrentOnAdd] = useState(false)

  const { data: ambassadorCodesData, isLoading: codesLoading } = useAmbassadorCodes(
    managingCodesFor?.ambassador_id ?? null,
  )
  const { data: availableCodesData } = useAdminPromoCodes()
  const assignCode = useAssignAmbassadorCode()
  const setCurrentCode = useSetCurrentAmbassadorCode()
  const removeCode = useRemoveAmbassadorCode()
  const addManualReferral = useAddManualReferralWithPoints()
  const [manualReferralDialog, setManualReferralDialog] = useState<{
    ambassador_id: string
    ambassador_name: string
    ambassador_code: string | null
  } | null>(null)
  const [manualReferralEmail, setManualReferralEmail] = useState('')
  const [manualReferralPoints, setManualReferralPoints] = useState(1)
  const [manualReferralFormat, setManualReferralFormat] = useState<'auto' | 'open' | 'ranked'>('auto')
  const [manualReferralMessage, setManualReferralMessage] = useState<string | null>(null)

  const assignedCodeIds = new Set(
    (ambassadorCodesData?.codes ?? []).map((c) => c.promotional_code_id),
  )
  const availableCodesToAdd = (availableCodesData?.codes ?? []).filter(
    (c) => !assignedCodeIds.has(c.id) && !c.assigned_profile_id,
  )

  const rewards = data?.rewards ?? []
  const pointsRows = pointsData?.ambassadors ?? []

  useEffect(() => {
    if (!initialSearch) return
    setSearch((prev) => (prev ? prev : initialSearch))
  }, [initialSearch])

  const filteredRewards = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rewards.filter((reward) => {
      if (statusFilter !== 'all' && reward.status !== statusFilter) return false
      if (!term) return true
      return [reward.ambassador_name, reward.ambassador_code, reward.reward_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    })
  }, [rewards, search, statusFilter])

  const handleStatusChange = async (id: string, status: AmbassadorRewardStatus) => {
    await updateReward.mutateAsync({ id, status })
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle>Ambassadeurs</CardTitle>
          <p className="text-sm text-muted-foreground">
            Gestion des récompenses ambassadeurs.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Rechercher un ambassadeur..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="sm:w-64"
          />
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Filtrer statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="earned">Débloquée</SelectItem>
              <SelectItem value="claimed">Réclamée</SelectItem>
              <SelectItem value="fulfilled">Envoyée</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? 'Actualisation...' : 'Actualiser'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Points ambassadeurs</p>
              <p className="text-xs text-muted-foreground">Ajuste le total et la répartition Open/Ranked.</p>
            </div>
            <Button variant="outline" onClick={() => refetchPoints()} disabled={pointsLoading}>
              {pointsLoading ? 'Actualisation...' : 'Actualiser'}
            </Button>
          </div>
          {pointsError ? (
            <div className="px-4 py-3 text-sm text-destructive">
              Impossible de charger les points. {pointsError.message}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ambassadeur</TableHead>
                    <TableHead>Code actif</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                    <TableHead className="text-right">Ranked</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pointsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : pointsRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Aucun ambassadeur.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pointsRows.map((row) => (
                      <TableRow key={row.ambassador_id}>
                        <TableCell className="font-medium">{row.ambassador_name}</TableCell>
                        <TableCell className="font-mono text-xs">{row.ambassador_code ?? '-'}</TableCell>
                        <TableCell className="text-right font-semibold">{row.total_points}</TableCell>
                        <TableCell className="text-right">{row.recruits_open}</TableCell>
                        <TableCell className="text-right">{row.recruits_ranked}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setManagingCodesFor({
                                  ambassador_id: row.ambassador_id,
                                  ambassador_name: row.ambassador_name,
                                })
                              }
                            >
                              Codes
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setEditingPoints({
                                  ambassador_id: row.ambassador_id,
                                  ambassador_name: row.ambassador_name,
                                  ambassador_code: row.ambassador_code,
                                  total_points: row.total_points,
                                  recruits_open: row.recruits_open,
                                  recruits_ranked: row.recruits_ranked,
                                })
                              }
                            >
                              Points
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setManualReferralDialog({
                                  ambassador_id: row.ambassador_id,
                                  ambassador_name: row.ambassador_name,
                                  ambassador_code: row.ambassador_code,
                                })
                                setManualReferralEmail('')
                                setManualReferralPoints(1)
                                setManualReferralFormat('auto')
                                setManualReferralMessage(null)
                              }}
                            >
                              Filleul + point
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Impossible de charger les récompenses. {error.message}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ambassadeur</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Récompense</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Débloquée</TableHead>
                <TableHead>Réclamée</TableHead>
                <TableHead>Envoyée</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredRewards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Aucun resultat.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRewards.map((reward) => (
                  <TableRow key={reward.id}>
                    <TableCell className="font-medium">{reward.ambassador_name}</TableCell>
                    <TableCell className="font-mono text-xs">{reward.ambassador_code ?? '-'}</TableCell>
                    <TableCell>
                      Palier {reward.reward_level} · {reward.reward_name}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_STYLES[reward.status]}>{STATUS_LABELS[reward.status]}</Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(reward.earned_at)}</TableCell>
                    <TableCell>{formatDateTime(reward.claimed_at)}</TableCell>
                    <TableCell>{formatDateTime(reward.fulfilled_at)}</TableCell>
                    <TableCell className="min-w-40">
                      <Select
                        value={reward.status}
                        onValueChange={(value) => handleStatusChange(reward.id, value as AmbassadorRewardStatus)}
                        disabled={updateReward.isPending}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Changer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="earned">Débloquée</SelectItem>
                          <SelectItem value="claimed">Réclamée</SelectItem>
                          <SelectItem value="fulfilled">Envoyée</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog
        open={Boolean(managingCodesFor)}
        onOpenChange={(open) => {
          if (!open) {
            setManagingCodesFor(null)
            setSelectedCodeToAdd('')
            setSetAsCurrentOnAdd(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-130">
          <DialogHeader>
            <DialogTitle>Codes promo</DialogTitle>
            <DialogDescription>
              {managingCodesFor?.ambassador_name} — codes assignés et historiques
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {codesLoading ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : (ambassadorCodesData?.codes ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun code assigné.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {(ambassadorCodesData?.codes ?? []).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium">{c.code ?? c.promotional_code_id}</span>
                      {c.name ? (
                        <span className="text-xs text-muted-foreground">{c.name}</span>
                      ) : null}
                      {c.is_current ? (
                        <Badge className="border-emerald-500/40 bg-emerald-500/20 text-emerald-600 text-xs">
                          Actif
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1">
                      {!c.is_current ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          disabled={setCurrentCode.isPending}
                          onClick={async () => {
                            if (!managingCodesFor) return
                            await setCurrentCode.mutateAsync({
                              ambassador_id: managingCodesFor.ambassador_id,
                              junction_id: c.id,
                            })
                          }}
                        >
                          Définir actif
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        disabled={removeCode.isPending}
                        onClick={async () => {
                          if (!managingCodesFor) return
                          await removeCode.mutateAsync({
                            ambassador_id: managingCodesFor.ambassador_id,
                            junction_id: c.id,
                          })
                        }}
                      >
                        Retirer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-lg border px-3 py-3">
              <p className="mb-2 text-xs font-semibold">Ajouter un code</p>
              <div className="flex flex-col gap-2">
                <Select value={selectedCodeToAdd} onValueChange={setSelectedCodeToAdd}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un code promo…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCodesToAdd.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code}{c.name ? ` — ${c.name}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={setAsCurrentOnAdd}
                    onChange={(e) => setSetAsCurrentOnAdd(e.target.checked)}
                    className="h-3.5 w-3.5"
                  />
                  Définir comme code actif
                </label>
                <Button
                  size="sm"
                  disabled={!selectedCodeToAdd || assignCode.isPending}
                  onClick={async () => {
                    if (!managingCodesFor || !selectedCodeToAdd) return
                    await assignCode.mutateAsync({
                      ambassador_id: managingCodesFor.ambassador_id,
                      promotional_code_id: selectedCodeToAdd,
                      set_as_current: setAsCurrentOnAdd,
                    })
                    setSelectedCodeToAdd('')
                    setSetAsCurrentOnAdd(false)
                  }}
                >
                  {assignCode.isPending ? 'Assignation…' : 'Ajouter'}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setManagingCodesFor(null)
                setSelectedCodeToAdd('')
                setSetAsCurrentOnAdd(false)
              }}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingPoints)} onOpenChange={(open) => !open && setEditingPoints(null)}>
        <DialogContent className="sm:max-w-130">
          <DialogHeader>
            <DialogTitle>Modifier les points</DialogTitle>
            <DialogDescription>
              Ajuste le total et la répartition Open/Ranked.
            </DialogDescription>
          </DialogHeader>
          {editingPoints ? (
            <div className="grid gap-3">
              <div className="rounded-lg border px-3 py-2 text-sm">
                <div className="font-semibold">{editingPoints.ambassador_name}</div>
                <div className="text-xs text-muted-foreground">{editingPoints.ambassador_code ?? '—'}</div>
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-medium">Total points</label>
                <Input
                  type="number"
                  min={0}
                  value={editingPoints.total_points}
                  onChange={(event) =>
                    setEditingPoints((prev) => (prev ? { ...prev, total_points: Number(event.target.value) } : prev))
                  }
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-xs font-medium">Open</label>
                  <Input
                    type="number"
                    min={0}
                    value={editingPoints.recruits_open}
                    onChange={(event) =>
                      setEditingPoints((prev) => (prev ? { ...prev, recruits_open: Number(event.target.value) } : prev))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-medium">Ranked</label>
                  <Input
                    type="number"
                    min={0}
                    value={editingPoints.recruits_ranked}
                    onChange={(event) =>
                      setEditingPoints((prev) => (prev ? { ...prev, recruits_ranked: Number(event.target.value) } : prev))
                    }
                  />
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPoints(null)}>
              Annuler
            </Button>
            <Button
              onClick={async () => {
                if (!editingPoints) return
                await updatePoints.mutateAsync({
                  ambassador_id: editingPoints.ambassador_id,
                  total_points: editingPoints.total_points,
                  recruits_open: editingPoints.recruits_open,
                  recruits_ranked: editingPoints.recruits_ranked,
                })
                setEditingPoints(null)
              }}
              disabled={updatePoints.isPending}
            >
              {updatePoints.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(manualReferralDialog)}
        onOpenChange={(open) => {
          if (!open) {
            setManualReferralDialog(null)
            setManualReferralMessage(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-130">
          <DialogHeader>
            <DialogTitle>Ajouter un filleul manuel + crédit de points</DialogTitle>
            <DialogDescription>
              Ajoute un inscrit dans les filleuls et crédite des points sans doublon.
            </DialogDescription>
          </DialogHeader>
          {manualReferralDialog ? (
            <div className="grid gap-3">
              <div className="rounded-lg border px-3 py-2 text-sm">
                <div className="font-semibold">{manualReferralDialog.ambassador_name}</div>
                <div className="text-xs text-muted-foreground">{manualReferralDialog.ambassador_code ?? '—'}</div>
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-medium">Email du filleul</label>
                <Input
                  type="email"
                  placeholder="exemple@mail.com"
                  value={manualReferralEmail}
                  onChange={(event) => setManualReferralEmail(event.target.value)}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-xs font-medium">Points à créditer</label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={manualReferralPoints}
                    onChange={(event) => setManualReferralPoints(Number(event.target.value || 1))}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-medium">Format</label>
                  <Select
                    value={manualReferralFormat}
                    onValueChange={(value) => setManualReferralFormat(value as 'auto' | 'open' | 'ranked')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (détection ticket)</SelectItem>
                      <SelectItem value="open">OPEN</SelectItem>
                      <SelectItem value="ranked">RANKED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {manualReferralMessage ? (
                <div className="rounded-md border border-primary/25 bg-primary/5 px-3 py-2 text-xs text-foreground">
                  {manualReferralMessage}
                </div>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualReferralDialog(null)}>
              Annuler
            </Button>
            <Button
              disabled={
                !manualReferralDialog ||
                !manualReferralEmail.trim() ||
                manualReferralPoints < 1 ||
                addManualReferral.isPending
              }
              onClick={async () => {
                if (!manualReferralDialog) return
                setManualReferralMessage(null)
                const result = await addManualReferral.mutateAsync({
                  ambassador_id: manualReferralDialog.ambassador_id,
                  referral_email: manualReferralEmail.trim(),
                  points: manualReferralPoints,
                  race_format: manualReferralFormat,
                })
                if (result.already_credited) {
                  setManualReferralMessage(
                    'Filleul ajouté (ou déjà présent). Aucun point ajouté car cette inscription était déjà créditée.',
                  )
                } else {
                  setManualReferralMessage(
                    `Filleul ajouté et ${result.points_credited} point(s) crédité(s).`,
                  )
                }
              }}
            >
              {addManualReferral.isPending ? 'Traitement…' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

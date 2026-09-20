'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  useAdminEventWaves,
  useAdminWaveParticipants,
  provisionAdminEventWaves,
  deleteAdminEventWave,
  deleteEmptyAdminEventWaves,
  updateAdminEventWave,
  type AdminEventWave,
} from '@/app/api/admin/events/eventsQueries'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Eye, RefreshCw, Save, Download, Plus, Trash2 } from 'lucide-react'
import { formatClockTimeParis } from '@/lib/dateTime'

interface EventWavesSectionProps {
  eventId: string
  ticketId: string
  ticketName: string
}

type EditRow = {
  startTime: string
  capacity: string
  isClosed: boolean
  dirty: boolean
}

const toLocalDateTimeInput = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

const formatClockTime = (value?: string | null) => {
  return formatClockTimeParis(value) ?? '—'
}

export function EventWavesSection({ eventId, ticketId, ticketName }: EventWavesSectionProps) {
  const { data, isLoading, error, refetch, isFetching } = useAdminEventWaves(eventId, ticketId)
  const [editRows, setEditRows] = useState<Record<number, EditRow>>({})
  const [globalCapacity, setGlobalCapacity] = useState('50')
  const [newStartTime, setNewStartTime] = useState('')
  const [newCapacity, setNewCapacity] = useState('50')
  const [seriesCount, setSeriesCount] = useState('1')
  const [seriesInterval, setSeriesInterval] = useState('10')
  const [savingWave, setSavingWave] = useState<number | null>(null)
  const [savingGlobal, setSavingGlobal] = useState(false)
  const [provisioning, setProvisioning] = useState(false)
  const [provisioningError, setProvisioningError] = useState<string | null>(null)
  const [selectedWaveIndex, setSelectedWaveIndex] = useState<number | null>(null)
  const {
    data: selectedWaveParticipants = [],
    isLoading: participantsLoading,
    error: participantsError,
  } = useAdminWaveParticipants(eventId, ticketId, selectedWaveIndex)

  useEffect(() => {
    if (!data) return
    const next: Record<number, EditRow> = {}
    for (const wave of data) {
      next[wave.wave_index] = {
        startTime: toLocalDateTimeInput(wave.start_time),
        capacity: String(wave.capacity ?? 0),
        isClosed: Boolean(wave.is_closed),
        dirty: false,
      }
    }
    setEditRows(next)
  }, [data])

  const totals = useMemo(() => {
    const waves = data ?? []
    const totalCapacity = waves.reduce((sum, wave) => sum + (wave.capacity ?? 0), 0)
    const totalAssigned = waves.reduce((sum, wave) => sum + (wave.assigned_count ?? 0), 0)
    return { totalCapacity, totalAssigned }
  }, [data])
  const displayPositionByWaveIndex = useMemo(
    () => new Map((data ?? []).map((wave, index) => [wave.wave_index, index + 1])),
    [data],
  )

  const handleCreate = async (mode: 'single' | 'series') => {
    const capacity = Number.parseInt(newCapacity, 10)
    const count = Number.parseInt(seriesCount, 10)
    const intervalMinutes = Number.parseInt(seriesInterval, 10)
    const startTime = new Date(newStartTime)
    if (!newStartTime || Number.isNaN(startTime.getTime()) || capacity < 0) return
    if (mode === 'series' && (count < 1 || intervalMinutes < 1)) return

    setProvisioning(true)
    setProvisioningError(null)

    try {
      await provisionAdminEventWaves(eventId, ticketId, {
        mode,
        start_time: startTime.toISOString(),
        capacity,
        ...(mode === 'series' ? { count, interval_minutes: intervalMinutes } : {}),
      })
      await refetch()
    } catch (error) {
      setProvisioningError(
        error instanceof Error ? error.message : 'Impossible d’initialiser les SAS.',
      )
    } finally {
      setProvisioning(false)
    }
  }

  const handleDelete = async (wave: AdminEventWave) => {
    if ((wave.assigned_count ?? 0) > 0) return
    const displayPosition = displayPositionByWaveIndex.get(wave.wave_index) ?? wave.wave_index
    if (!window.confirm(`Supprimer le SAS ${displayPosition} ?`)) return
    setProvisioningError(null)
    try {
      await deleteAdminEventWave(eventId, ticketId, wave.wave_index)
      await refetch()
    } catch (error) {
      setProvisioningError(error instanceof Error ? error.message : 'Impossible de supprimer le SAS.')
    }
  }

  const handleDeleteEmpty = async () => {
    if (!window.confirm('Supprimer tous les SAS sans inscrit de ce billet ?')) return
    setProvisioningError(null)
    try {
      await deleteEmptyAdminEventWaves(eventId, ticketId)
      await refetch()
    } catch (error) {
      setProvisioningError(error instanceof Error ? error.message : 'Impossible de supprimer les SAS vides.')
    }
  }

  const handleRowChange = (wave: AdminEventWave, patch: Partial<EditRow>) => {
    setEditRows((prev) => {
      const current = prev[wave.wave_index] ?? { startTime: toLocalDateTimeInput(wave.start_time), capacity: String(wave.capacity ?? 0), isClosed: wave.is_closed, dirty: false }
      return {
        ...prev,
        [wave.wave_index]: {
          startTime: patch.startTime ?? current.startTime,
          capacity: patch.capacity ?? current.capacity,
          isClosed: patch.isClosed ?? current.isClosed,
          dirty: true,
        },
      }
    })
  }

  const handleSaveRow = async (waveIndex: number) => {
    const row = editRows[waveIndex]
    if (!row) return
    const capacityValue = Number.parseInt(row.capacity, 10)
    const startTime = new Date(row.startTime)
    if (!Number.isFinite(capacityValue) || capacityValue < 0 || Number.isNaN(startTime.getTime())) return

    setSavingWave(waveIndex)
    try {
      await updateAdminEventWave(eventId, ticketId, {
        wave_index: waveIndex,
        start_time: startTime.toISOString(),
        capacity: capacityValue,
        is_closed: row.isClosed,
      })
      await refetch()
    } finally {
      setSavingWave(null)
    }
  }

  const handleSaveGlobal = async () => {
    const capacityValue = Number.parseInt(globalCapacity, 10)
    if (!Number.isFinite(capacityValue) || capacityValue < 0) return

    setSavingGlobal(true)
    try {
      await updateAdminEventWave(eventId, ticketId, {
        capacity_all: capacityValue,
      })
      await refetch()
    } finally {
      setSavingGlobal(false)
    }
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{(error as Error).message || 'Impossible de charger les SAS.'}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardContent className="min-w-0 space-y-4 p-3 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">SAS · {ticketName}</h2>
            <p className="text-sm text-muted-foreground">
              {totals.totalAssigned.toLocaleString('fr-FR')} / {totals.totalCapacity.toLocaleString('fr-FR')} participants affectés
            </p>
            <p className="text-xs text-muted-foreground">
              Capacité, horaires et inscrits propres à ce billet.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/admin/events/${eventId}/waves?ticket_id=${ticketId}&format=csv`} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </a>
            </Button>
          </div>
        </div>

        <section className="space-y-3 rounded-lg border p-3 sm:p-4">
          <div>
            <h3 className="font-medium">Ajouter des SAS</h3>
            <p className="text-xs text-muted-foreground">Ajoute un départ unique ou génère une série régulière. Rien n’est imposé.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs text-muted-foreground">Premier départ</label>
              <Input type="datetime-local" value={newStartTime} onChange={(event) => setNewStartTime(event.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Capacité</label>
              <Input type="number" min="0" value={newCapacity} onChange={(event) => setNewCapacity(event.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Nombre de SAS</label>
              <Input type="number" min="1" max="200" value={seriesCount} onChange={(event) => setSeriesCount(event.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Intervalle (minutes)</label>
              <Input type="number" min="1" value={seriesInterval} onChange={(event) => setSeriesInterval(event.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => handleCreate('single')} disabled={provisioning || !newStartTime}>
              <Plus className="mr-2 h-4 w-4" />Ajouter un SAS
            </Button>
            <Button size="sm" onClick={() => handleCreate('series')} disabled={provisioning || !newStartTime}>
              {provisioning ? 'Création…' : 'Générer la série'}
            </Button>
          </div>
        </section>

        {provisioningError ? (
          <Alert variant="destructive">
            <AlertDescription>{provisioningError}</AlertDescription>
          </Alert>
        ) : null}

          <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Capacité globale</label>
            <Input
              value={globalCapacity}
              onChange={(event) => setGlobalCapacity(event.target.value)}
              className="w-28"
              inputMode="numeric"
            />
          </div>
          <Button size="sm" onClick={handleSaveGlobal} disabled={savingGlobal}>
            {savingGlobal ? 'Mise à jour...' : 'Appliquer à toutes les vagues'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleDeleteEmpty} disabled={(data ?? []).every((wave) => (wave.assigned_count ?? 0) > 0)}>
            <Trash2 className="mr-2 h-4 w-4" />Supprimer les SAS vides
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement des SAS...</p>
        ) : (
          <div className="space-y-2">
              {(data ?? []).map((wave, position) => {
                const row = editRows[wave.wave_index]
                const capacityValue = Number.parseInt(row?.capacity ?? String(wave.capacity ?? 0), 10)
                const assigned = wave.assigned_count ?? 0
                const remaining = Math.max((capacityValue || 0) - assigned, 0)
                const isClosed = row?.isClosed ?? wave.is_closed
                const isFull = assigned >= (capacityValue || 0)

                return (
                  <article key={wave.wave_index} className="grid min-w-0 gap-2 rounded-lg border p-2.5 md:grid-cols-[5rem_minmax(12rem,1fr)_5.5rem_minmax(7rem,auto)_auto] md:items-end">
                    <div className="flex items-center justify-between gap-2 md:block md:self-center">
                      <div><p className="font-medium">SAS {position + 1}</p><p className="text-xs text-muted-foreground">{formatClockTime(wave.start_time)}</p></div>
                      <div className="md:mt-1">{isClosed ? <Badge variant="destructive">Fermé</Badge> : isFull ? <Badge variant="secondary">Complet</Badge> : <Badge variant="outline">Ouvert</Badge>}</div>
                    </div>
                      <div className="min-w-0 space-y-1">
                        <label className="text-xs text-muted-foreground">Heure de départ</label>
                        <Input type="datetime-local" value={row?.startTime ?? toLocalDateTimeInput(wave.start_time)} onChange={(event) => handleRowChange(wave, { startTime: event.target.value })} />
                      </div>
                      <div className="space-y-1"><label className="text-xs text-muted-foreground">Capacité</label>
                      <Input
                        value={row?.capacity ?? String(wave.capacity ?? 0)}
                        onChange={(event) => handleRowChange(wave, { capacity: event.target.value })}
                        className="w-full"
                        inputMode="numeric"
                      />
                      </div>
                      <div className="space-y-1 md:self-center"><span className="text-xs text-muted-foreground">Occupation</span><p className="whitespace-nowrap text-sm">{assigned} / {capacityValue || 0} · {remaining} libre{remaining > 1 ? 's' : ''}</p></div>
                    <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
                      <label className="mr-1 flex items-center gap-1.5 text-xs">
                      <Switch
                        checked={Boolean(isClosed)}
                        onCheckedChange={(checked) => handleRowChange(wave, { isClosed: checked })}
                      />
                      Fermer
                      </label>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedWaveIndex(wave.wave_index)}
                          aria-label={`Voir les inscrits du SAS ${position + 1}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleSaveRow(wave.wave_index)}
                          disabled={!row?.dirty || savingWave === wave.wave_index}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(wave)} disabled={assigned > 0} aria-label={`Supprimer le SAS ${position + 1}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </article>
                )
              })}
          </div>
        )}
      </CardContent>

      <Dialog
        open={selectedWaveIndex !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedWaveIndex(null)
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Inscrits du SAS {selectedWaveIndex !== null ? displayPositionByWaveIndex.get(selectedWaveIndex) ?? '—' : '—'}
            </DialogTitle>
            <DialogDescription>
              Liste des participants assignés à ce SAS.
            </DialogDescription>
          </DialogHeader>

          {participantsLoading ? (
            <p className="text-sm text-muted-foreground">Chargement des inscrits…</p>
          ) : participantsError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {(participantsError as Error).message || 'Impossible de récupérer les inscrits.'}
              </AlertDescription>
            </Alert>
          ) : selectedWaveParticipants.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun participant affecté à ce SAS.</p>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead>Participant</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Départ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedWaveParticipants.map((participant, index) => (
                    <TableRow key={participant.id}>
                      <TableCell>{participant.wave_position ?? index + 1}</TableCell>
                      <TableCell className="font-medium">{participant.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{participant.email}</TableCell>
                      <TableCell>{formatClockTime(participant.start_time)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  useAdminEventWaves,
  useAdminWaveParticipants,
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
import { Eye, RefreshCw, Save, Download } from 'lucide-react'
import { formatClockTimeParis } from '@/lib/dateTime'

interface EventOpenWavesSectionProps {
  eventId: string
}

type EditRow = {
  capacity: string
  isClosed: boolean
  dirty: boolean
}

const formatClockTime = (value?: string | null) => {
  return formatClockTimeParis(value) ?? '—'
}

export function EventOpenWavesSection({ eventId }: EventOpenWavesSectionProps) {
  const { data, isLoading, error, refetch, isFetching } = useAdminEventWaves(eventId)
  const [editRows, setEditRows] = useState<Record<number, EditRow>>({})
  const [globalCapacity, setGlobalCapacity] = useState('50')
  const [savingWave, setSavingWave] = useState<number | null>(null)
  const [savingGlobal, setSavingGlobal] = useState(false)
  const [selectedWaveIndex, setSelectedWaveIndex] = useState<number | null>(null)
  const {
    data: selectedWaveParticipants = [],
    isLoading: participantsLoading,
    error: participantsError,
  } = useAdminWaveParticipants(eventId, selectedWaveIndex)

  useEffect(() => {
    if (!data) return
    const next: Record<number, EditRow> = {}
    for (const wave of data) {
      next[wave.wave_index] = {
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

  const handleRowChange = (wave: AdminEventWave, patch: Partial<EditRow>) => {
    setEditRows((prev) => {
      const current = prev[wave.wave_index] ?? { capacity: String(wave.capacity ?? 0), isClosed: wave.is_closed, dirty: false }
      return {
        ...prev,
        [wave.wave_index]: {
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
    if (!Number.isFinite(capacityValue) || capacityValue < 0) return

    setSavingWave(waveIndex)
    try {
      await updateAdminEventWave(eventId, {
        wave_index: waveIndex,
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
      await updateAdminEventWave(eventId, {
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
        <AlertDescription>{(error as Error).message || 'Impossible de charger les SAS OPEN.'}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">SAS OPEN</h2>
            <p className="text-sm text-muted-foreground">
              {totals.totalAssigned.toLocaleString('fr-FR')} / {totals.totalCapacity.toLocaleString('fr-FR')} participants affectés
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/admin/events/${eventId}/waves?format=csv`} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </a>
            </Button>
          </div>
        </div>

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
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement des SAS...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vague</TableHead>
                <TableHead>Départ</TableHead>
                <TableHead>Capacité</TableHead>
                <TableHead>Assignés</TableHead>
                <TableHead>Restant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Fermer</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((wave) => {
                const row = editRows[wave.wave_index]
                const capacityValue = Number.parseInt(row?.capacity ?? String(wave.capacity ?? 0), 10)
                const assigned = wave.assigned_count ?? 0
                const remaining = Math.max((capacityValue || 0) - assigned, 0)
                const isClosed = row?.isClosed ?? wave.is_closed
                const isFull = assigned >= (capacityValue || 0)

                return (
                  <TableRow key={wave.wave_index}>
                    <TableCell>SAS {wave.wave_index}</TableCell>
                    <TableCell>{formatClockTime(wave.start_time)}</TableCell>
                    <TableCell>
                      <Input
                        value={row?.capacity ?? String(wave.capacity ?? 0)}
                        onChange={(event) => handleRowChange(wave, { capacity: event.target.value })}
                        className="w-24"
                        inputMode="numeric"
                      />
                    </TableCell>
                    <TableCell>{assigned}</TableCell>
                    <TableCell>{remaining}</TableCell>
                    <TableCell>
                      {isClosed ? (
                        <Badge variant="destructive">Fermé</Badge>
                      ) : isFull ? (
                        <Badge variant="secondary">Complet</Badge>
                      ) : (
                        <Badge variant="outline">Ouvert</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={Boolean(isClosed)}
                        onCheckedChange={(checked) => handleRowChange(wave, { isClosed: checked })}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedWaveIndex(wave.wave_index)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          Voir inscrits
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSaveRow(wave.wave_index)}
                          disabled={!row?.dirty || savingWave === wave.wave_index}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
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
              Inscrits du SAS {selectedWaveIndex ?? '—'}
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

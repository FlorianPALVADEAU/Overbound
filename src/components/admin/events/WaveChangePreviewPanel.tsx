'use client'

import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { AlertCircle, Clock, Eye } from 'lucide-react'
import axiosClient from '@/app/api/axiosClient'
import { useAdminEventWaves } from '@/app/api/admin/events/eventsQueries'
import type { EventParticipantRow } from '@/app/api/admin/events/participantsQueries'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type WaveChangePreview = {
  allowed: boolean
  registration: {
    id: string
    eventId: string
    ticketId: string
    format: 'OPEN'
    currentWaveIndex: number | null
    currentStartTime: string | null
  }
  target: {
    waveIndex: number
    startTime: string
    capacity: number
    assignedCount: number
    remainingCapacity: number
    isClosed: boolean
  }
  impacts: {
    departure: 'changed' | 'unchanged'
    group: 'none' | 'anchor_applies' | 'blocked_by_anchor'
    waveCounters: 'would_refresh'
  }
  warnings: string[]
  blockers: string[]
}

interface WaveChangePreviewPanelProps {
  eventId: string
  participant: EventParticipantRow
}

const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '—'

const groupLabels: Record<WaveChangePreview['impacts']['group'], string> = {
  none: 'Aucune ancre',
  anchor_applies: 'Ancre du groupe respectée',
  blocked_by_anchor: 'Bloqué par l’ancre du groupe',
}

export function WaveChangePreviewPanel({ eventId, participant }: WaveChangePreviewPanelProps) {
  const { data: waves = [], isLoading: wavesLoading } = useAdminEventWaves(eventId)
  const [targetWaveIndex, setTargetWaveIndex] = useState('')
  const [preview, setPreview] = useState<WaveChangePreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isOpen = participant.ticket.format === 'OPEN'

  useEffect(() => {
    setTargetWaveIndex('')
    setPreview(null)
    setError(null)
  }, [participant.id])

  const targetWave = useMemo(
    () => waves.find((wave) => String(wave.wave_index) === targetWaveIndex),
    [targetWaveIndex, waves],
  )

  const requestPreview = async () => {
    if (!targetWaveIndex || !isOpen) return
    setLoading(true)
    setError(null)
    setPreview(null)
    try {
      const response = await axiosClient.post<{ preview: WaveChangePreview }>(
        `/admin/events/${eventId}/participants/${participant.id}/change-wave/preview`,
        { waveIndex: Number(targetWaveIndex) },
      )
      setPreview(response.data.preview)
    } catch (requestError) {
      const message = axios.isAxiosError(requestError)
        ? (requestError.response?.data as { error?: string } | undefined)?.error
        : null
      setError(message || 'Impossible de générer l’aperçu du changement de SAS.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-3 rounded-lg border bg-muted/20 p-4" aria-labelledby="wave-preview-title">
      <div className="flex items-start gap-2">
        <Eye className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <div>
          <h3 id="wave-preview-title" className="font-medium">Prévisualiser un changement de SAS</h3>
          <p className="text-xs text-muted-foreground">Lecture seule : aucune inscription ni capacité ne sera modifiée.</p>
        </div>
      </div>
      {!isOpen ? (
        <p className="text-sm text-muted-foreground">Le changement de SAS concerne uniquement les inscriptions OPEN.</p>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={targetWaveIndex} onValueChange={(value) => { setTargetWaveIndex(value); setPreview(null); setError(null) }} disabled={wavesLoading || waves.length === 0}>
              <SelectTrigger aria-label="SAS cible" className="min-w-0 flex-1"><SelectValue placeholder={wavesLoading ? 'Chargement des SAS…' : waves.length ? 'Choisir une SAS cible' : 'Aucune SAS disponible'} /></SelectTrigger>
              <SelectContent>
                {waves.map((wave) => <SelectItem key={wave.wave_index} value={String(wave.wave_index)}>SAS {wave.wave_index} · {formatDate(wave.start_time)} · {wave.assigned_count}/{wave.capacity}{wave.is_closed ? ' · Fermée' : ''}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={requestPreview} disabled={!targetWaveIndex || loading}>
              {loading ? <Clock className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
              {loading ? 'Analyse…' : 'Prévisualiser'}
            </Button>
          </div>
          {targetWave ? <p className="text-xs text-muted-foreground">SAS actuelle : {participant.departure.waveIndex ?? 'non attribuée'} · cible : SAS {targetWave.wave_index}</p> : null}
          {error ? <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert> : null}
          {preview ? (
            <div className="space-y-3 rounded-md border bg-background p-3 text-sm">
              <div className="grid gap-2 sm:grid-cols-2">
                <div><p className="text-xs text-muted-foreground">Départ actuel</p><p>{preview.registration.currentWaveIndex ? `SAS ${preview.registration.currentWaveIndex}` : 'Non attribué'} · {formatDate(preview.registration.currentStartTime)}</p></div>
                <div><p className="text-xs text-muted-foreground">Départ cible</p><p>SAS {preview.target.waveIndex} · {formatDate(preview.target.startTime)}</p></div>
              </div>
              <div className="flex flex-wrap gap-2" aria-label="Impacts du changement de SAS">
                <Badge variant={preview.impacts.departure === 'changed' ? 'secondary' : 'outline'}>Départ : {preview.impacts.departure === 'changed' ? 'Modifié' : 'Inchangé'}</Badge>
                <Badge variant="outline">Groupe : {groupLabels[preview.impacts.group]}</Badge>
                <Badge variant={preview.target.isClosed || preview.target.remainingCapacity <= 0 ? 'secondary' : 'outline'}>Capacité : {preview.target.assignedCount}/{preview.target.capacity} · {preview.target.remainingCapacity} place{preview.target.remainingCapacity > 1 ? 's' : ''}</Badge>
              </div>
              {preview.blockers.length > 0 ? <div className="space-y-1 text-sm text-destructive"><p className="font-medium">Changement bloqué</p>{preview.blockers.map((blocker) => <p key={blocker}>• {blocker}</p>)}</div> : null}
              {preview.warnings.length > 0 ? <div className="space-y-1 text-sm text-amber-700 dark:text-amber-400"><p className="font-medium">Points d’attention</p>{preview.warnings.map((warning) => <p key={warning}>• {warning}</p>)}</div> : null}
              <Button type="button" disabled className="w-full" title="La confirmation sera activée dans un lot ultérieur">Confirmation indisponible pour le moment</Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}

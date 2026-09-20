import { useEffect, useState } from 'react'

export type SelectableWave = {
  wave_index: number
  start_time: string
  remaining: number
}

/**
 * SAS OPEN a participant can pick from, filtered server-side by their
 * declared distance range (FDR-0012). Refetches whenever the distance
 * inputs change; the list is a UX convenience only — the real check
 * happens again server-side at registration creation.
 */
export function useSelectableOpenWaves(
  eventId: string,
  ticketId: string | undefined,
  distanceIdealKm: string,
  distanceMinKm: string,
  enabled: boolean,
) {
  const [waves, setWaves] = useState<SelectableWave[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ideal = Number(distanceIdealKm)
    const min = Number(distanceMinKm)

    if (!enabled || !ticketId || !Number.isFinite(ideal) || !Number.isFinite(min) || ideal < min) {
      setWaves([])
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    const params = new URLSearchParams({
      distanceIdealKm: String(ideal),
      distanceMinKm: String(min),
      ticketId,
    })

    fetch(`/api/events/${eventId}/open-waves/selectable?${params.toString()}`)
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || 'Impossible de récupérer les SAS disponibles')
        }
        return response.json()
      })
      .then((body: { waves: SelectableWave[] }) => {
        if (!cancelled) setWaves(body.waves || [])
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erreur inconnue')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [eventId, ticketId, distanceIdealKm, distanceMinKm, enabled])

  return { waves, isLoading, error }
}

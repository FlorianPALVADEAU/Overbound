import { useEffect, useState } from 'react'

export type SelectableWave = {
  wave_index: number
  start_time: string
  remaining: number
  capacity: number
}

/**
 * Open departure slots (SAS) of a ticket with places left. The choice is free:
 * it does not depend on any other field. The real capacity check happens again
 * server-side at registration creation.
 */
export function useSelectableOpenWaves(
  eventId: string,
  ticketId: string | undefined,
  enabled: boolean,
  { includeFull = false }: { includeFull?: boolean } = {},
) {
  const [waves, setWaves] = useState<SelectableWave[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !ticketId) {
      // A request cancelled by this change never clears the loading flag: clear it here.
      setWaves([])
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    fetch(`/api/events/${eventId}/open-waves/selectable?ticketId=${encodeURIComponent(ticketId)}${includeFull ? '&includeFull=true' : ''}`)
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
  }, [eventId, ticketId, enabled, includeFull])

  return { waves, isLoading, error }
}

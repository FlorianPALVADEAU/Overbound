export type RaceFormat = 'open' | 'ranked'

export class BibCapacityExhaustedError extends Error {
  constructor(eventId: string, format: RaceFormat) {
    super(`BIB_CAPACITY_EXHAUSTED: aucun dossard disponible pour l'événement ${eventId} au format ${format}`)
    this.name = 'BibCapacityExhaustedError'
  }
}

export interface BibRange {
  min: number
  max: number
}

/**
 * Plage unique par événement : RANKED = 1..ranked_bib_capacity, OPEN =
 * ranked_bib_capacity+1..events.capacity. Renvoie null si la plage du format
 * est vide ou incohérente (capacité non configurée, ranked > capacité totale).
 */
export const getBibRange = (
  event: { capacity?: number | null; ranked_bib_capacity?: number | null },
  format: RaceFormat,
): BibRange | null => {
  const total = event.capacity ?? 0
  const ranked = event.ranked_bib_capacity ?? 0
  if (!Number.isInteger(total) || total <= 0 || !Number.isInteger(ranked) || ranked < 0 || ranked > total) {
    return null
  }
  const range = format === 'ranked' ? { min: 1, max: ranked } : { min: ranked + 1, max: total }
  return range.min <= range.max ? range : null
}

const isCapacityExhausted = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('BIB_CAPACITY_EXHAUSTED')
}

/**
 * Atomic bib number assignment via `assign_bib_number` (single locked
 * UPDATE...RETURNING on a counter row, no read-then-write from the app —
 * see supabase/migrations/20260918_bib_number_assignment.sql).
 * bib_number is immutable once set (DB trigger enforces this outside this
 * RPC and transferBibNumber below), independent of wave/SAS assignment.
 */
export const assignBibNumber = async ({
  admin,
  eventId,
  registrationId,
  raceFormat,
  bibRange,
}: {
  admin: any
  eventId: string
  registrationId: string
  raceFormat: RaceFormat
  bibRange: BibRange
}): Promise<number> => {
  const { data, error } = await admin.rpc('assign_bib_number', {
    p_event_id: eventId,
    p_registration_id: registrationId,
    p_race_format: raceFormat,
    p_min_number: bibRange.min,
    p_max_number: bibRange.max,
  })

  if (error) {
    if (isCapacityExhausted(error)) {
      throw new BibCapacityExhaustedError(eventId, raceFormat)
    }
    throw error
  }

  return data as number
}

/**
 * Format transfer (RANKED<->OPEN): releases the bib number in the source
 * format and assigns a new one in the target format, atomically. Rolls
 * back entirely (registration keeps its original bib_number) if the target
 * format has no capacity left.
 */
export const transferBibNumber = async ({
  admin,
  registrationId,
  eventId,
  targetFormat,
  bibRange,
}: {
  admin: any
  registrationId: string
  eventId: string
  targetFormat: RaceFormat
  bibRange: BibRange
}): Promise<number> => {
  const { data, error } = await admin.rpc('transfer_bib_number', {
    p_registration_id: registrationId,
    p_event_id: eventId,
    p_target_format: targetFormat,
    p_min_number: bibRange.min,
    p_max_number: bibRange.max,
  })

  if (error) {
    if (isCapacityExhausted(error)) {
      throw new BibCapacityExhaustedError(eventId, targetFormat)
    }
    throw error
  }

  return data as number
}

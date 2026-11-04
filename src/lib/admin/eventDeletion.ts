/**
 * Answer of the admin event deletion, read from the error raised by admin_delete_event_without_records
 * (migration 20261104120000). Pure: the route only forwards what this returns.
 */

export interface EventDeletionRecordCounts {
  registrationsCount: number
  volunteersCount: number
  luckyWheelEntriesCount: number
}

export interface EventDeletionErrorLike {
  message?: string | null
  details?: string | null
}

export interface EventDeletionResponse {
  status: number
  body: Record<string, unknown>
}

const isRecordCounts = (value: unknown): value is EventDeletionRecordCounts => {
  if (typeof value !== 'object' || value === null) return false
  const counts = value as Record<string, unknown>
  return (
    typeof counts.registrationsCount === 'number' &&
    typeof counts.volunteersCount === 'number' &&
    typeof counts.luckyWheelEntriesCount === 'number'
  )
}

/** The counts the SQL function puts in the error detail. Anything else is unreadable and yields null. */
export const parseEventDeletionCounts = (details: string | null | undefined): EventDeletionRecordCounts | null => {
  if (!details) return null
  try {
    const parsed: unknown = JSON.parse(details)
    return isRecordCounts(parsed) ? parsed : null
  } catch {
    return null
  }
}

export const interpretEventDeletionError = (error: EventDeletionErrorLike): EventDeletionResponse => {
  const message = error.message ?? ''

  if (message.includes('EVENT_NOT_FOUND')) {
    return { status: 404, body: { error: 'Événement introuvable' } }
  }

  if (message.includes('EVENT_HAS_RECORDS')) {
    const counts = parseEventDeletionCounts(error.details)
    return {
      status: 409,
      body: {
        error:
          'Cet événement a des inscriptions, des candidatures bénévoles ou des participations à la roue : il ne peut pas être supprimé. Passe-le en « annulé » à la place.',
        requiresCancellation: true,
        ...(counts ?? {}),
      },
    }
  }

  return { status: 500, body: { error: 'Erreur serveur' } }
}

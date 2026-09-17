import { z } from 'zod'

export const noMovementConfirmationSchema = z.object({
  commandId: z.string().uuid(),
  previewId: z.string().min(1).max(128),
  previewSourceVersion: z.string().min(1).max(128),
  currentSourceVersion: z.string().min(1).max(128),
  policyVariant: z.enum(['NO_MOVEMENT', 'NO_MOVEMENT_EXCEPTION']),
  reason: z.string().trim().min(1).max(1_000),
  previewExpiresAt: z.string().datetime({ offset: true }),
  eventStartsAt: z.string().datetime({ offset: true }),
  eventTimezone: z.string().min(1).max(100),
})

export type NoMovementConfirmationInput = z.infer<typeof noMovementConfirmationSchema>

export type NoMovementConfirmationDecision =
  | { allowed: true; commandId: string; policyVariant: NoMovementConfirmationInput['policyVariant'] }
  | { allowed: false; blockers: string[] }

const localDate = (instant: Date, timeZone: string): string | null => {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(instant)
  } catch {
    return null
  }
}

const previousCalendarDate = (isoDate: string): string => {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

/**
 * Pure server-side gate for a future confirmation command.
 * It deliberately does not mutate or persist anything: idempotency and audit
 * must be provided by the command store before this gate can be activated.
 */
export const evaluateNoMovementConfirmation = (
  input: NoMovementConfirmationInput,
  now: Date = new Date(),
): NoMovementConfirmationDecision => {
  const blockers: string[] = []
  const previewExpiresAt = new Date(input.previewExpiresAt)
  const eventStartsAt = new Date(input.eventStartsAt)

  if (previewExpiresAt.getTime() <= now.getTime()) {
    blockers.push('L’aperçu a expiré ; il doit être recalculé avant confirmation.')
  }
  if (input.previewSourceVersion !== input.currentSourceVersion) {
    blockers.push('Les données ont changé depuis l’aperçu ; il doit être recalculé.')
  }

  const eventDate = localDate(eventStartsAt, input.eventTimezone)
  const today = localDate(now, input.eventTimezone)
  if (!eventDate || !today) {
    blockers.push('Le fuseau horaire de l’événement est invalide ou indisponible.')
  } else if (today >= previousCalendarDate(eventDate)) {
    blockers.push('Aucune correction n’est autorisée à partir de J-1 inclus.')
  }

  if (blockers.length > 0) return { allowed: false, blockers }
  return { allowed: true, commandId: input.commandId, policyVariant: input.policyVariant }
}

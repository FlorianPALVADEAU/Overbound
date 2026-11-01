import { parseOpenCompanionConfig } from '@/lib/tickets/openCompanion'
import { ticketUsesWaveSelection } from '@/lib/tickets/operationsProfile'
import type { TicketOperationsConfig } from '@/types/Ticket'

/**
 * Admin side of the "Option OPEN" contract (`operations_config.open_companion`, read by
 * `openCompanion.ts`). One place maps the ticket form to the stored shape and checks that the
 * stored shape points at a real OPEN ticket, so the option is set from the admin screen and
 * cannot be wiped or left dangling by a later edit.
 */

/** Stored shape, as `parseOpenCompanionConfig` reads it. */
export interface StoredOpenCompanion {
  ticket_id: string
  price_cents: number
  ranked_max_duration_minutes: number
  min_gap_minutes: number
}

export interface CompanionFormValues {
  enabled: boolean
  openTicketId: string
  priceCents: string
  rankedMaxDurationMinutes: string
  minGapMinutes: string
}

/** Prefill only: the admin sees the values and confirms them, nothing is applied silently. */
export const emptyCompanionForm = (): CompanionFormValues => ({
  enabled: false,
  openTicketId: '',
  priceCents: '2900',
  rankedMaxDurationMinutes: '230',
  minGapMinutes: '20',
})

export const companionFormFromConfig = (
  config: TicketOperationsConfig | Record<string, unknown> | null | undefined,
): CompanionFormValues => {
  const parsed = parseOpenCompanionConfig(config)
  if (!parsed) return emptyCompanionForm()
  return {
    enabled: true,
    openTicketId: parsed.openTicketId,
    priceCents: String(parsed.priceCents),
    rankedMaxDurationMinutes: String(parsed.rankedMaxDurationMinutes),
    minGapMinutes: String(parsed.minGapMinutes),
  }
}

export type CompanionConfigResult = { ok: true; config: StoredOpenCompanion | null } | { ok: false; error: string }

const toInteger = (value: string): number | null => {
  const trimmed = value.trim()
  if (!/^\d+$/.test(trimmed)) return null
  return Number(trimmed)
}

/** Form to stored shape. Option off means no key at all. */
export const companionConfigFromForm = (values: CompanionFormValues): CompanionConfigResult => {
  if (!values.enabled) return { ok: true, config: null }
  if (!values.openTicketId) return { ok: false, error: 'Option OPEN : choisis le billet OPEN.' }

  const price = toInteger(values.priceCents)
  if (price === null || price === 0) return { ok: false, error: 'Option OPEN : le prix doit être un nombre de centimes supérieur à 0.' }
  const duration = toInteger(values.rankedMaxDurationMinutes)
  if (duration === null || duration === 0) {
    return { ok: false, error: 'Option OPEN : la durée maximale du RANKED doit être un nombre de minutes supérieur à 0.' }
  }
  const gap = toInteger(values.minGapMinutes)
  if (gap === null) return { ok: false, error: 'Option OPEN : le délai de récupération doit être un nombre de minutes.' }

  return {
    ok: true,
    config: {
      ticket_id: values.openTicketId,
      price_cents: price,
      ranked_max_duration_minutes: duration,
      min_gap_minutes: gap,
    },
  }
}

/** A ticket as the validation needs it. */
export interface CompanionTicketRef {
  id: string
  event_id: string
  name?: string | null
  race?: { name?: string | null } | null
  operations_config?: TicketOperationsConfig | Record<string, unknown> | null
}

export interface CompanionAssignment {
  /** Ticket that carries the option. `id` is absent while it is being created. */
  owner: { id?: string; event_id: string; name?: string | null; operations_config?: TicketOperationsConfig | Record<string, unknown> | null }
  /** Every ticket of the same event. */
  eventTickets: CompanionTicketRef[]
}

/**
 * Whether the option stored on `owner` can work. Null when it can, or when the ticket has no
 * option. The owner is a single-start ticket and the target a ticket where the participant
 * picks a SAS, otherwise the checkout would offer an option it cannot honour.
 */
export const validateOpenCompanionAssignment = ({ owner, eventTickets }: CompanionAssignment): string | null => {
  const raw = owner.operations_config?.open_companion
  if (raw === undefined || raw === null) return null

  const config = parseOpenCompanionConfig(owner.operations_config)
  if (!config) return 'Option OPEN incomplète : billet OPEN, prix, durée maximale et délai sont obligatoires.'
  if (config.openTicketId === owner.id) return 'Option OPEN : un billet ne peut pas être son propre billet OPEN.'

  const target = eventTickets.find((ticket) => ticket.id === config.openTicketId)
  if (!target || target.event_id !== owner.event_id) return 'Option OPEN : le billet OPEN doit appartenir au même événement.'
  if (target.operations_config?.open_companion) return 'Option OPEN : le billet OPEN ne peut pas porter lui-même une option.'
  if (!ticketUsesWaveSelection(target)) return 'Option OPEN : le billet OPEN doit être en départ par SAS.'
  if (ticketUsesWaveSelection({ name: owner.name, operations_config: owner.operations_config })) {
    return 'Option OPEN : un billet avec choix de SAS ne peut pas porter l’option, elle se règle sur le billet RANKED.'
  }
  return null
}

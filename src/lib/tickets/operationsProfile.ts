import type { TicketOperationsConfig } from '@/types/Ticket'
import { isOpenFormatTicket } from '@/lib/openSas'

export type TicketOperationsStatus = 'configured' | 'unconfigured'

export type TicketOperationsProfile = {
  status: TicketOperationsStatus
  departureMode: 'none' | 'wave' | 'fixed' | null
  departureChangePolicy: 'preserve' | 'clear' | 'reassign' | null
}

const departureModes = new Set(['none', 'wave', 'fixed'])
const departureChangePolicies = new Set(['preserve', 'clear', 'reassign'])

/**
 * Resolves the explicit operational contract of a ticket.
 *
 * This is deliberately the only place that translates persisted configuration
 * into admin capabilities. A ticket name, race name, or legacy format must
 * never be used as an operational signal.
 */
export function resolveTicketOperationsProfile(
  config: TicketOperationsConfig | Record<string, unknown> | null | undefined,
): TicketOperationsProfile {
  const departureMode = typeof config?.departure_mode === 'string' && departureModes.has(config.departure_mode)
    ? config.departure_mode as TicketOperationsProfile['departureMode']
    : null
  const departureChangePolicy = typeof config?.departure_change_policy === 'string'
    && departureChangePolicies.has(config.departure_change_policy)
    ? config.departure_change_policy as TicketOperationsProfile['departureChangePolicy']
    : null

  if (!departureMode || !departureChangePolicy) {
    return { status: 'unconfigured', departureMode: null, departureChangePolicy: null }
  }

  return { status: 'configured', departureMode, departureChangePolicy }
}

export function ticketOperationsLabel(profile: TicketOperationsProfile): string {
  if (profile.status === 'unconfigured') return 'Règles à configurer'
  if (profile.departureMode === 'wave') return 'Départ par SAS'
  if (profile.departureMode === 'fixed') return 'Départ fixe'
  return 'Aucun départ géré'
}

export function supportsManualWaveChange(profile: TicketOperationsProfile): boolean {
  return profile.status === 'configured' && profile.departureMode === 'wave'
}

export function ticketChangeDepartureDescription(profile: TicketOperationsProfile): string {
  if (profile.status === 'unconfigured') {
    return 'Les règles opérationnelles du billet cible doivent être configurées avant sa mise en application.'
  }

  if (profile.departureChangePolicy === 'preserve') return 'Le départ existant sera conservé.'
  if (profile.departureChangePolicy === 'clear') return 'Le départ existant sera retiré.'
  if (profile.departureMode === 'wave') return 'Un départ par SAS sera attribué selon les règles de l’événement.'
  if (profile.departureMode === 'fixed') return 'Le départ fixe défini pour ce billet sera appliqué.'
  return 'Aucun départ ne sera attribué.'
}

/**
 * Whether a participant must pick a departure slot (SAS) when registering.
 * The ticket's explicit configuration decides. Only a ticket with no
 * operational configuration at all falls back to the legacy OPEN naming, so
 * older events keep working until their tickets are configured.
 */
export function ticketUsesWaveSelection(ticket: {
  name?: string | null
  race?: { name?: string | null } | null
  operations_config?: TicketOperationsConfig | Record<string, unknown> | null
}): boolean {
  const { departureMode } = resolveTicketOperationsProfile(ticket.operations_config)
  if (departureMode) return departureMode === 'wave'
  return isOpenFormatTicket(ticket.name, ticket.race?.name)
}

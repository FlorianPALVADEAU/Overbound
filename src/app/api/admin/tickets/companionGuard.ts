import type { SupabaseClient } from '@supabase/supabase-js'
import { validateOpenCompanionAssignment, type CompanionTicketRef } from '@/lib/tickets/openCompanionAdmin'
import type { TicketOperationsConfig } from '@/types/Ticket'

type RaceRelation = { name: string | null } | { name: string | null }[] | null

interface EventTicketRow {
  id: string
  event_id: string
  name: string | null
  operations_config: TicketOperationsConfig | null
  race: RaceRelation
}

const firstRace = (race: RaceRelation) => (Array.isArray(race) ? race[0] ?? null : race)

/**
 * Error message when the "Option OPEN" carried by a ticket being saved cannot work, null otherwise.
 * Run before every ticket write so a bad option is refused at the source instead of surfacing at checkout.
 */
export const checkTicketCompanion = async (
  admin: SupabaseClient,
  organizationId: string,
  owner: { id?: string; event_id: string; name?: string | null; operations_config?: TicketOperationsConfig | null },
): Promise<string | null> => {
  if (!owner.operations_config?.open_companion) return null

  const { data, error } = await admin
    .from('tickets')
    .select('id, event_id, name, operations_config, race:races!tickets_race_id_fkey(name)')
    .eq('event_id', owner.event_id)
    .eq('organization_id', organizationId)
  if (error) throw error

  const eventTickets: CompanionTicketRef[] = ((data ?? []) as unknown as EventTicketRow[]).map((row) => ({
    id: row.id,
    event_id: row.event_id,
    name: row.name,
    race: firstRace(row.race),
    operations_config: row.operations_config,
  }))
  return validateOpenCompanionAssignment({ owner, eventTickets })
}

/** Names of the tickets whose "Option OPEN" is issued on `openTicketId`. Deleting it would break them. */
export const findTicketsUsingAsCompanion = async (
  admin: SupabaseClient,
  organizationId: string,
  openTicketId: string,
): Promise<string[]> => {
  const { data, error } = await admin
    .from('tickets')
    .select('name')
    .eq('organization_id', organizationId)
    .eq('operations_config->open_companion->>ticket_id', openTicketId)
  if (error) throw error
  return (data ?? []).map((row: { name: string | null }) => row.name ?? 'Billet sans nom')
}

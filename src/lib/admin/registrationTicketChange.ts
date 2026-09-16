import { isOpenFormatTicket, isRankedFormatTicket } from '@/lib/openSas'

export type RegistrationTicketFormat = 'open' | 'ranked' | 'unknown'

/**
 * Ticket format is intentionally inferred from the ticket/race labels. This
 * matches the production wave-assignment rule; IDs must never encode format.
 */
export const getRegistrationTicketFormat = (
  ticketName?: string | null,
  raceName?: string | null,
): RegistrationTicketFormat => {
  const isOpen = isOpenFormatTicket(ticketName, raceName)
  const isRanked = isRankedFormatTicket(ticketName, raceName)

  if (isOpen === isRanked) return 'unknown'
  return isOpen ? 'open' : 'ranked'
}

export const registrationTicketFormatLabel = (format: RegistrationTicketFormat) => {
  if (format === 'open') return 'OPEN'
  if (format === 'ranked') return 'RANKED'
  return 'Format à vérifier'
}

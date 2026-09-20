import { isOpenFormatTicket, isRankedFormatTicket } from '@/lib/openSas'

export type RegistrationTicketFormat = 'open' | 'ranked' | 'custom'

/**
 * Legacy labels are supported for backwards compatibility only. New ticket
 * behavior must be supplied by the ticket's explicit operational profile.
 */
export const getRegistrationTicketFormat = (
  ticketName?: string | null,
  raceName?: string | null,
): RegistrationTicketFormat => {
  const isOpen = isOpenFormatTicket(ticketName, raceName)
  const isRanked = isRankedFormatTicket(ticketName, raceName)

  if (isOpen === isRanked) return 'custom'
  return isOpen ? 'open' : 'ranked'
}

export const registrationTicketFormatLabel = (format: RegistrationTicketFormat) => {
  if (format === 'open') return 'OPEN'
  if (format === 'ranked') return 'RANKED'
  return 'Configuration personnalisée'
}

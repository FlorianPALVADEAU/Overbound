import type { SessionProfile } from '@/app/api/session/sessionQueries'
import { isOwnTicket } from '@/lib/account/tickets'
import { resolveParticipantIdentity, type ParticipantIdentity } from '@/lib/account/participant'
import { formatClockTimeParis } from '@/lib/dateTime'
import type { AccountRegistrationItem } from '@/types/AccountRegistration'

/** Everything a bib needs to know about "who is looking and when", passed down once. */
export interface TicketContext {
  userEmail: string | null | undefined
  now: Date
  identify: (ticket: AccountRegistrationItem) => ParticipantIdentity
}

export const createTicketContext = (
  user: { email?: string | null },
  profile: Pick<SessionProfile, 'full_name' | 'date_of_birth' | 'avatar_url'> | null,
  now: Date,
): TicketContext => ({
  userEmail: user.email,
  now,
  identify: (ticket) =>
    resolveParticipantIdentity(
      ticket.participant,
      // The profile only describes the account holder, never a friend's bib.
      isOwnTicket(ticket, user.email)
        ? { fullName: profile?.full_name, birthDate: profile?.date_of_birth, avatarUrl: profile?.avatar_url }
        : null,
      now,
    ),
})

export interface TicketFact {
  label: string
  value: string
}

const FORMAT_LABEL = { open: 'OPEN', ranked: 'RANKED' } as const

/** Practical info printed on the bib; entries without data are dropped. */
export const getTicketFacts = (ticket: AccountRegistrationItem): TicketFact[] => {
  const departure = formatClockTimeParis(ticket.start_time)
  const facts: Array<TicketFact | null> = [
    departure ? { label: 'Départ', value: departure } : null,
    ticket.wave_index ? { label: 'SAS', value: String(ticket.wave_index) } : null,
    ticket.race_format ? { label: 'Format', value: FORMAT_LABEL[ticket.race_format] } : null,
  ]
  return facts.filter((fact): fact is TicketFact => fact !== null)
}

/** The printed bib number, or null when none is assigned yet (never a placeholder dash). */
export const bibLabel = (bib: number | null | undefined) => (typeof bib === 'number' ? String(bib) : null)

/** « Camille DUPONT · 29 ans », degrading to the email, then to nothing. */
export const describeHolder = (ticket: AccountRegistrationItem, identity: ParticipantIdentity) => {
  const name = identity.name ?? ticket.email ?? null
  if (!name) return null
  return identity.age !== null ? `${name} · ${identity.age} ans` : name
}

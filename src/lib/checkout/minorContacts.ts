/**
 * What a minor's registration must carry besides the adult's data: the legal representative who signs the
 * parental authorization, and an adult on site who stays reachable for the whole participation
 * (the organiser's own rule, not an insurer's condition). They may be the same person. The representative's
 * email receives the ticket copy of the minor's registration.
 */
export const MINOR_CONTACT_FIELDS = ['guardianName', 'guardianPhone', 'guardianEmail', 'referentName', 'referentPhone'] as const

export type MinorContactField = (typeof MINOR_CONTACT_FIELDS)[number]

export type MinorContacts = Partial<Record<MinorContactField, string | null | undefined>>

export const missingMinorContacts = (contacts: MinorContacts): MinorContactField[] =>
  MINOR_CONTACT_FIELDS.filter((field) => !contacts[field]?.trim())

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Shape check only: a rejected address would make the ticket copy bounce without an exception. */
export const isPlausibleEmail = (value: string | null | undefined): boolean => EMAIL_PATTERN.test(value?.trim() ?? '')

/**
 * Address that receives a copy of a minor's ticket: the representative, unless it is the minor's own address
 * (then the ticket already reaches them). Adults never get a copy.
 */
export const guardianTicketCopyRecipient = ({
  isMinor,
  participantEmail,
  guardianEmail,
}: {
  isMinor: boolean
  participantEmail: string | null | undefined
  guardianEmail: string | null | undefined
}): string | undefined => {
  if (!isMinor) return undefined
  const copy = guardianEmail?.trim()
  if (!copy) return undefined
  if (participantEmail?.trim().toLowerCase() === copy.toLowerCase()) return undefined
  return copy
}

const trimmedOrNull = (value: string | null | undefined): string | null => value?.trim() || null

/** Columns that store the minor's contacts on the registration. Nothing is stored for an adult. */
export const minorGuardianColumns = (isMinor: boolean, contacts: MinorContacts) =>
  isMinor
    ? {
        guardian_name: trimmedOrNull(contacts.guardianName),
        guardian_phone: trimmedOrNull(contacts.guardianPhone),
        guardian_email: trimmedOrNull(contacts.guardianEmail),
        referent_name: trimmedOrNull(contacts.referentName),
        referent_phone: trimmedOrNull(contacts.referentPhone),
      }
    : {}

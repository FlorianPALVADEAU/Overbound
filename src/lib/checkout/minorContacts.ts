/**
 * What a minor's registration must carry besides the adult's data: the legal representative who signs the
 * parental authorization, and an adult on site who stays reachable for the whole participation
 * (the organiser's own rule, not an insurer's condition). They may be the same person.
 */
export const MINOR_CONTACT_FIELDS = ['guardianName', 'guardianPhone', 'referentName', 'referentPhone'] as const

export type MinorContactField = (typeof MINOR_CONTACT_FIELDS)[number]

export type MinorContacts = Partial<Record<MinorContactField, string | null | undefined>>

export const missingMinorContacts = (contacts: MinorContacts): MinorContactField[] =>
  MINOR_CONTACT_FIELDS.filter((field) => !contacts[field]?.trim())

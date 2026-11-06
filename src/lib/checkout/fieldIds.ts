/** DOM ids of the checkout fields: validation points at them, the form renders them. One list, no drift. */

export type ParticipantField =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'birthDate'
  | 'emergencyContactName'
  | 'emergencyContactPhone'
  | 'guardianName'
  | 'guardianPhone'
  | 'guardianEmail'
  | 'referentName'
  | 'referentPhone'
  | 'wave'
  | 'companionWave'
  | 'healthDataConsent'
  | 'tshirtSize'
  | 'sex'

const PARTICIPANT_FIELD_SUFFIX: Record<ParticipantField, string> = {
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email',
  birthDate: 'birthDate',
  emergencyContactName: 'emergency',
  emergencyContactPhone: 'emergencyPhone',
  guardianName: 'guardian',
  guardianPhone: 'guardianPhone',
  guardianEmail: 'guardianEmail',
  referentName: 'referent',
  referentPhone: 'referentPhone',
  wave: 'wave',
  companionWave: 'companion-wave',
  healthDataConsent: 'health-consent',
  tshirtSize: 'tshirt-size',
  sex: 'sex',
}

export const participantFieldId = (participantId: string, field: ParticipantField) =>
  `${participantId}-${PARTICIPANT_FIELD_SUFFIX[field]}`

export const CONSENT_FIELD_IDS = {
  disclaimerRead: 'disclaimer-read',
  rulebookAccepted: 'rulebook-accepted',
  disclaimerAccepted: 'disclaimer-accepted',
  groupAttestation: 'group-attestation',
  minorAttestation: 'minor-attestation',
  signature: 'signature-pad',
} as const

export type ConsentField = keyof typeof CONSENT_FIELD_IDS

export const TICKETS_SECTION_ID = 'checkout-tickets'

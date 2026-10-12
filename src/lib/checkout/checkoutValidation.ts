import type { Participant } from '@/components/registration/types'
import { needsHealthDataConsent } from '@/lib/legal/healthData'
import { CONSENT_FIELD_IDS, participantFieldId, TICKETS_SECTION_ID, type ConsentField, type ParticipantField } from './fieldIds'
import { isAdultOnEventDate, MINIMUM_AGE } from './participantAge'

export const REQUIRED_MESSAGE = 'Ce champ est obligatoire.'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface CheckoutValidationInput {
  participants: Participant[]
  /** Bibs the visitor selected; participants follow them one by one. */
  ticketCount: number
  eventDate: string
  /** Whether a ticket asks its holder to pick a departure SAS. */
  ticketUsesWaveSelection: (ticketId: string) => boolean
  /** A member of an anchored group never picks a SAS: the group's departure wins. */
  hasGroupAnchor: boolean
  consents: Record<Exclude<ConsentField, 'groupAttestation' | 'signature'>, boolean>
  /** Undefined when the buyer registers only themself. */
  groupAttestation: boolean | undefined
  hasSignature: boolean
}

export type ParticipantErrors = Partial<Record<ParticipantField, string>>

export interface CheckoutValidation {
  isValid: boolean
  sections: { tickets: boolean; participants: boolean; confirmation: boolean }
  participantErrors: Record<string, ParticipantErrors>
  consentErrors: Partial<Record<ConsentField, string>>
  /** Where to take the visitor first: the earliest problem in reading order. */
  firstInvalidId: string | null
}

const participantErrorsOf = (participant: Participant, input: CheckoutValidationInput): ParticipantErrors => {
  const errors: ParticipantErrors = {}
  const required: ParticipantField[] = ['firstName', 'lastName', 'email', 'birthDate', 'emergencyContactName', 'emergencyContactPhone']
  for (const field of required) {
    const value = participant[field as keyof Participant]
    if (typeof value !== 'string' || !value.trim()) errors[field] = REQUIRED_MESSAGE
  }
  if (!errors.email && !EMAIL_PATTERN.test(participant.email.trim())) errors.email = 'Adresse email invalide.'
  if (!errors.birthDate && !isAdultOnEventDate(participant.birthDate, input.eventDate)) {
    errors.birthDate = `Il faut avoir ${MINIMUM_AGE} ans le jour de l'événement.`
  }
  if (input.ticketUsesWaveSelection(participant.ticketId) && !input.hasGroupAnchor && !participant.selectedWaveIndex) {
    errors.wave = 'Choisis ton SAS de départ.'
  }
  if (needsHealthDataConsent(participant.medicalInfo) && participant.healthDataConsent !== true) {
    errors.healthDataConsent = 'Ton accord est nécessaire pour enregistrer ces informations.'
  }
  return errors
}

const consentErrorsOf = (input: CheckoutValidationInput) => {
  const errors: Partial<Record<ConsentField, string>> = {}
  for (const [field, accepted] of Object.entries(input.consents) as Array<[ConsentField, boolean]>) {
    if (!accepted) errors[field] = REQUIRED_MESSAGE
  }
  if (input.groupAttestation === false) errors.groupAttestation = REQUIRED_MESSAGE
  if (!input.hasSignature) errors.signature = 'Dessine ta signature pour continuer.'
  return errors
}

/** Every rule the visitor must meet before paying, with the first field to fix. */
export const validateCheckout = (input: CheckoutValidationInput): CheckoutValidation => {
  const ticketsValid = input.ticketCount > 0
  const participantErrors = Object.fromEntries(
    input.participants.map((participant) => [participant.id, participantErrorsOf(participant, input)]),
  )
  const participantsValid =
    input.participants.length === input.ticketCount &&
    Object.values(participantErrors).every((errors) => Object.keys(errors).length === 0)
  const consentErrors = consentErrorsOf(input)
  const confirmationValid = Object.keys(consentErrors).length === 0

  const firstParticipantError = input.participants
    .flatMap((participant) =>
      (Object.keys(participantErrors[participant.id] ?? {}) as ParticipantField[]).map((field) =>
        participantFieldId(participant.id, field),
      ),
    )
    .at(0)
  const firstConsentError = (Object.keys(CONSENT_FIELD_IDS) as ConsentField[]).find((field) => consentErrors[field])

  return {
    isValid: ticketsValid && participantsValid && confirmationValid,
    sections: { tickets: ticketsValid, participants: ticketsValid && participantsValid, confirmation: confirmationValid },
    participantErrors,
    consentErrors,
    firstInvalidId: !ticketsValid
      ? TICKETS_SECTION_ID
      : (firstParticipantError ?? (firstConsentError ? CONSENT_FIELD_IDS[firstConsentError] : null)),
  }
}

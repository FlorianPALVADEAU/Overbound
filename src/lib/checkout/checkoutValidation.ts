import type { Participant } from '@/components/registration/types'
import { needsHealthDataConsent } from '@/lib/legal/healthData'
import { CONSENT_FIELD_IDS, participantFieldId, TICKETS_SECTION_ID, type ConsentField, type ParticipantField } from './fieldIds'
import { isParticipantOffered, isTshirtSize, type TshirtOffer } from '@/lib/tshirtOffer'
import { isPlausibleEmail, MINOR_CONTACT_FIELDS } from './minorContacts'
import { isParticipantSex } from './participantSex'
import { ageRefusalMessage, classifyParticipantAge } from './participantAge'

export const REQUIRED_MESSAGE = 'Ce champ est obligatoire.'

export interface CheckoutValidationInput {
  participants: Participant[]
  /** Bibs the visitor selected; participants follow them one by one. */
  ticketCount: number
  eventDate: string
  /** `events.minimum_age`: 18, or 16 when the edition admits minors on the OPEN format. */
  minimumAge: number
  /** Whether a ticket is of the OPEN format, the only one a minor may book. */
  ticketIsOpenFormat: (ticketId: string) => boolean
  /** Whether a ticket asks its holder to pick a departure SAS. */
  ticketUsesWaveSelection: (ticketId: string) => boolean
  /** A member of an anchored group never picks a SAS: the group's departure wins. */
  hasGroupAnchor: boolean
  consents: Record<Exclude<ConsentField, 'groupAttestation' | 'minorAttestation' | 'signature'>, boolean>
  /** Undefined when the buyer registers only themself. */
  groupAttestation: boolean | undefined
  /** Undefined when no participant is a minor. */
  minorAttestation?: boolean
  hasSignature: boolean
  /** Free T-shirt offer: the first participants it still covers must pick a size. */
  tshirtOffer?: TshirtOffer | null
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

const participantErrorsOf = (participant: Participant, input: CheckoutValidationInput, index: number): ParticipantErrors => {
  const errors: ParticipantErrors = {}
  const required: ParticipantField[] = ['birthDate', 'firstName', 'lastName', 'email', 'emergencyContactName', 'emergencyContactPhone']
  for (const field of required) {
    const value = participant[field as keyof Participant]
    if (typeof value !== 'string' || !value.trim()) errors[field] = REQUIRED_MESSAGE
  }
  if (!errors.email && !isPlausibleEmail(participant.email)) errors.email = 'Adresse email invalide.'
  if (!errors.birthDate) {
    const age = classifyParticipantAge({
      birthDate: participant.birthDate,
      eventDate: input.eventDate,
      minimumAge: input.minimumAge,
      isOpenFormat: input.ticketIsOpenFormat(participant.ticketId),
    })
    if (age.status === 'refused') errors.birthDate = ageRefusalMessage(age.reason, input.minimumAge)
    if (age.status === 'minor') {
      for (const field of MINOR_CONTACT_FIELDS) {
        if (!participant[field]?.trim()) errors[field] = REQUIRED_MESSAGE
      }
      if (!errors.guardianEmail && !isPlausibleEmail(participant.guardianEmail)) {
        errors.guardianEmail = 'Adresse email invalide.'
      }
    }
  }
  if (!isParticipantSex(participant.sex)) errors.sex = REQUIRED_MESSAGE
  if (input.ticketUsesWaveSelection(participant.ticketId) && !input.hasGroupAnchor && !participant.selectedWaveIndex) {
    errors.wave = 'Choisis ton SAS de départ.'
  }
  if (participant.companion === true && !participant.companionWaveIndex) {
    errors.companionWave = 'Choisis ton SAS OPEN.'
  }
  if (isParticipantOffered(input.tshirtOffer, index) && !isTshirtSize(participant.tshirtSize)) {
    errors.tshirtSize = 'Choisis la taille de ton T-shirt.'
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
  if (input.minorAttestation === false) errors.minorAttestation = REQUIRED_MESSAGE
  if (!input.hasSignature) errors.signature = 'Dessine ta signature pour continuer.'
  return errors
}

/** Every rule the visitor must meet before paying, with the first field to fix. */
export const validateCheckout = (input: CheckoutValidationInput): CheckoutValidation => {
  const ticketsValid = input.ticketCount > 0
  const participantErrors = Object.fromEntries(
    input.participants.map((participant, index) => [participant.id, participantErrorsOf(participant, input, index)]),
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

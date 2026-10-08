import { Availability } from '../shared/Availability'
import { PersonName } from '../shared/PersonName'
import {
  EVENT_SELECTION_CUSTOM,
  type VolunteerApplicationPayload,
  type VolunteerFieldErrors,
  type VolunteerFormValues,
  type VolunteerStep,
} from './formValues'
import type { VolunteerEventCatalog } from './VolunteerEventCatalog'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const STEP_FIELDS: Record<VolunteerStep, readonly (keyof VolunteerFormValues)[]> = {
  0: ['eventSelection', 'customEventName', 'availability', 'mission'],
  1: ['firstName', 'lastName', 'email', 'phone'],
  2: ['gdprConsent'],
}

export interface ValidationResult {
  errors: VolunteerFieldErrors
  payload: VolunteerApplicationPayload | null
}

export class VolunteerApplicationValidator {
  constructor(private readonly events: VolunteerEventCatalog) {}

  validate(values: VolunteerFormValues): ValidationResult {
    const errors = this.collectErrors(values)
    if (Object.keys(errors).length > 0) return { errors, payload: null }

    const name = PersonName.create(values.firstName, values.lastName)
    if (!name) return { errors: this.collectErrors(values), payload: null }

    const { eventId, eventName } = this.events.resolve(values)
    return {
      errors,
      payload: {
        firstName: name.firstName,
        lastName: name.lastName,
        email: values.email.trim(),
        phone: values.phone.trim(),
        eventId,
        eventName,
        availability: Availability.labelOf(values.availability),
        mission: values.mission,
        experience: values.experience.trim() || undefined,
        motivations: values.motivations.trim() || undefined,
        gdprConsent: true,
      },
    }
  }

  validateStep(step: VolunteerStep, values: VolunteerFormValues): VolunteerFieldErrors {
    const allowed = STEP_FIELDS[step]
    return Object.fromEntries(
      Object.entries(this.collectErrors(values)).filter(([field]) => allowed.includes(field as keyof VolunteerFormValues)),
    )
  }

  firstInvalidStep(values: VolunteerFormValues): VolunteerStep | null {
    return ([0, 1, 2] as const).find((step) => Object.keys(this.validateStep(step, values)).length > 0) ?? null
  }

  private collectErrors(values: VolunteerFormValues): VolunteerFieldErrors {
    const errors: VolunteerFieldErrors = { ...PersonName.validate(values.firstName, values.lastName) }
    const phone = values.phone.trim()

    if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Renseigne une adresse email valide.'

    if (!phone) errors.phone = 'Renseigne ton numéro de téléphone.'
    else if (phone.replace(/\D/g, '').length < 6) errors.phone = 'Le téléphone doit contenir au moins 6 chiffres.'

    if (!values.eventSelection) errors.eventSelection = 'Choisis un événement ou précise-le à l’équipe.'
    else if (values.eventSelection === EVENT_SELECTION_CUSTOM && values.customEventName.trim().length < 3) {
      errors.customEventName = 'Précise le nom de l’événement.'
    }

    if (!values.availability) errors.availability = 'Sélectionne tes disponibilités.'
    if (!values.mission) errors.mission = 'Choisis le poste qui t’inspire le plus.'
    if (!values.gdprConsent) errors.gdprConsent = 'Nous avons besoin de ton accord pour te contacter.'

    return errors
  }
}

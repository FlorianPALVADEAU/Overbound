import { DEFAULT_AVAILABILITY } from '../shared/Availability'
import { DEFAULT_MISSION } from '../shared/Pod'

export const EVENT_SELECTION_ANY = 'any'
export const EVENT_SELECTION_CUSTOM = 'custom'

export interface VolunteerFormValues {
  firstName: string
  lastName: string
  email: string
  phone: string
  eventSelection: string
  customEventName: string
  availability: string
  mission: string
  experience: string
  motivations: string
  gdprConsent: boolean
}

export const INITIAL_VOLUNTEER_VALUES: VolunteerFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  eventSelection: '',
  customEventName: '',
  availability: DEFAULT_AVAILABILITY,
  mission: DEFAULT_MISSION,
  experience: '',
  motivations: '',
  gdprConsent: false,
}

export type VolunteerFieldErrors = Partial<Record<keyof VolunteerFormValues, string>>

// Étapes du formulaire : 0 = créneau, 1 = contact, 2 = message.
export type VolunteerStep = 0 | 1 | 2

export interface VolunteerApplicationPayload {
  firstName: string
  lastName: string
  email: string
  phone: string
  eventId?: string
  eventName?: string
  availability: string
  mission: string
  experience?: string
  motivations?: string
  gdprConsent: true
}

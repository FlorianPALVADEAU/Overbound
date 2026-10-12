import type { CreateRegistrationRequest } from './registrationRequestSchema'

export type RegistrationOutcome = { ok: true; registrationId: string | null } | { ok: false; message: string }

/** Creates the registrations of a paid or free order. Never throws: failures come back as a message. */
export const createRegistrations = async (request: CreateRegistrationRequest): Promise<RegistrationOutcome> => {
  try {
    const response = await fetch('/api/registrations/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) return { ok: false, message: body.error || "Erreur lors de la finalisation de l'inscription." }
    return { ok: true, registrationId: Array.isArray(body.registrations) ? (body.registrations[0] ?? null) : null }
  } catch {
    return { ok: false, message: 'Connexion perdue. Vérifie ta connexion et réessaie.' }
  }
}

/** Where the visitor lands once registered: the celebration page, or their tickets as a fallback. */
export const registrationSuccessPath = (eventSlug: string, registrationId: string | null) =>
  registrationId ? `/events/${eventSlug}/success?registration_id=${registrationId}` : '/account/tickets'

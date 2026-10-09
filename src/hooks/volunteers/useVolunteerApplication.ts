'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/app/api/session/sessionQueries'
import {
  EVENT_SELECTION_CUSTOM,
  INITIAL_VOLUNTEER_VALUES,
  type VolunteerFieldErrors,
  type VolunteerFormValues,
  type VolunteerStep,
} from '@/lib/volunteers/apply/formValues'
import { VolunteerApplicationValidator } from '@/lib/volunteers/apply/VolunteerApplicationValidator'
import { VolunteerEventCatalog } from '@/lib/volunteers/apply/VolunteerEventCatalog'
import { PersonName } from '@/lib/volunteers/shared/PersonName'

const DRAFT_KEY = 'overbound:volunteer-draft:v1'

// Le brouillon survit à la redirection vers /auth/login. Aucune donnée d'identité
// (nom, email, téléphone) n'y est stockée : elles viennent de la session au retour.
const DRAFT_FIELDS = [
  'mission',
  'eventSelection',
  'customEventName',
  'availability',
  'experience',
  'motivations',
] as const satisfies readonly (keyof VolunteerFormValues)[]

type DraftValues = Pick<VolunteerFormValues, (typeof DRAFT_FIELDS)[number]>

interface Draft {
  values: Partial<DraftValues>
  step: VolunteerStep
}

const readDraft = (): Draft | null => {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const { values, step } = parsed as { values?: Record<string, unknown>; step?: unknown }
    if (!values || typeof values !== 'object') return null
    const clean: Partial<DraftValues> = {}
    for (const field of DRAFT_FIELDS) {
      if (typeof values[field] === 'string') clean[field] = values[field]
    }
    return { values: clean, step: step === 1 || step === 2 ? step : 0 }
  } catch {
    return null
  }
}

const writeDraft = (draft: Draft) => {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // stockage indisponible (navigation privée) : le brouillon est un confort, pas un prérequis.
  }
}

// Posé quand le visiteur part se connecter depuis le formulaire : au retour, et seulement alors,
// la page le ramène sur sa candidature. Sans ce marqueur, un brouillon ancien ne doit jamais
// déclencher de défilement automatique.
const RESUME_KEY = 'overbound:volunteer-resume:v1'

export const markResumeAfterLogin = () => {
  try {
    window.sessionStorage.setItem(RESUME_KEY, '1')
  } catch {
    // stockage indisponible : on perd seulement le retour automatique sur le formulaire.
  }
}

export const consumeResumeAfterLogin = (): boolean => {
  try {
    const pending = window.sessionStorage.getItem(RESUME_KEY) === '1'
    if (pending) window.sessionStorage.removeItem(RESUME_KEY)
    return pending
  } catch {
    return false
  }
}

const clearDraft = () => {
  try {
    window.localStorage.removeItem(DRAFT_KEY)
  } catch {
    // voir writeDraft
  }
}

const fetchVolunteerEvents = async (): Promise<VolunteerEventCatalog> => {
  const response = await fetch('/api/events')
  if (!response.ok) throw new Error('Impossible de charger les événements.')
  return VolunteerEventCatalog.fromApiPayload(await response.json())
}

export interface SubmittedApplication {
  firstName: string
  email: string
  eventName: string
}

export function useVolunteerApplication() {
  const { data: session, isLoading: sessionLoading } = useSession()
  const isAuthenticated = Boolean(session?.user)

  const eventsQuery = useQuery({
    queryKey: ['volunteer', 'events'],
    queryFn: fetchVolunteerEvents,
    staleTime: 5 * 60 * 1000,
  })
  const catalog = useMemo(() => eventsQuery.data ?? new VolunteerEventCatalog([]), [eventsQuery.data])
  const events = catalog.list()
  const validator = useMemo(() => new VolunteerApplicationValidator(catalog), [catalog])

  const [values, setValues] = useState<VolunteerFormValues>(INITIAL_VOLUNTEER_VALUES)
  const [errors, setErrors] = useState<VolunteerFieldErrors>({})
  const [step, setStep] = useState<VolunteerStep>(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<SubmittedApplication | null>(null)
  const [draftRestored, setDraftRestored] = useState(false)
  const [draftLoaded, setDraftLoaded] = useState(false)

  useEffect(() => {
    const draft = readDraft()
    if (draft) {
      setValues((previous) => ({ ...previous, ...draft.values }))
      setStep(draft.step)
      setDraftRestored(true)
    }
    setDraftLoaded(true)
  }, [])

  useEffect(() => {
    if (!draftLoaded || submitted) return
    const draftValues = Object.fromEntries(DRAFT_FIELDS.map((field) => [field, values[field]]))
    writeDraft({ values: draftValues, step })
  }, [values, step, draftLoaded, submitted])

  // Préremplissage depuis la session, sans écraser ce que le visiteur a déjà saisi.
  useEffect(() => {
    if (!session?.user) return
    setValues((previous) => {
      const known = PersonName.split(session.profile?.full_name || session.user?.user_metadata?.full_name || '')
      const firstName = previous.firstName || known.firstName
      const lastName = previous.lastName || known.lastName
      const email = previous.email || session.user?.email || ''
      const phone = previous.phone || session.profile?.phone || ''
      if (
        firstName === previous.firstName &&
        lastName === previous.lastName &&
        email === previous.email &&
        phone === previous.phone
      ) {
        return previous
      }
      return { ...previous, firstName, lastName, email, phone }
    })
  }, [session])

  useEffect(() => {
    const options = catalog.list()
    if (options.length === 1) {
      setValues((previous) => (previous.eventSelection ? previous : { ...previous, eventSelection: options[0].id }))
    }
  }, [catalog])

  const setValue = useCallback(
    <Key extends keyof VolunteerFormValues>(field: Key, value: VolunteerFormValues[Key]) => {
      setValues((previous) => ({
        ...previous,
        [field]: value,
        ...(field === 'eventSelection' && value !== EVENT_SELECTION_CUSTOM ? { customEventName: '' } : {}),
      }))
      setErrors((previous) => {
        if (!(field in previous)) return previous
        const { [field]: _removed, ...rest } = previous
        return rest
      })
      setSubmitError(null)
    },
    [],
  )

  const goToStep = useCallback((target: VolunteerStep) => {
    setStep(target)
    setSubmitError(null)
  }, [])

  const next = useCallback(() => {
    const stepErrors = validator.validateStep(step, values)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return false
    }
    setErrors({})
    setStep((current) => Math.min(current + 1, 2) as VolunteerStep)
    return true
  }, [step, values, validator])

  const back = useCallback(() => {
    setErrors({})
    setStep((current) => Math.max(current - 1, 0) as VolunteerStep)
  }, [])

  const submit = useCallback(async () => {
    if (submitting) return
    const { errors: allErrors, payload } = validator.validate(values)
    if (!payload) {
      setErrors(allErrors)
      // Ramène le visiteur sur la première étape fautive.
      const firstBad = validator.firstInvalidStep(values)
      if (firstBad !== null) setStep(firstBad)
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const response = await fetch('/api/volunteers/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const result: { error?: string } | null = await response.json().catch(() => null)
        setSubmitError(
          response.status === 401
            ? 'Ta session a expiré. Reconnecte-toi : tes choix sont gardés.'
            : (result?.error ??
                'Impossible d’enregistrer ta candidature. Réessaie dans quelques minutes ou contacte-nous.'),
        )
        return
      }
      setSubmitted({
        firstName: payload.firstName,
        email: payload.email,
        eventName: payload.eventName ?? 'Disponible pour plusieurs événements',
      })
      clearDraft()
      setErrors({})
    } catch (error) {
      console.error('[volunteers] application submit failed', error)
      setSubmitError('Impossible d’enregistrer ta candidature. Réessaie dans quelques minutes ou contacte-nous.')
    } finally {
      setSubmitting(false)
    }
  }, [submitting, values, validator])

  const reset = useCallback(() => {
    setSubmitted(null)
    setStep(0)
    setValues((previous) => ({
      ...INITIAL_VOLUNTEER_VALUES,
      firstName: previous.firstName,
      lastName: previous.lastName,
      email: previous.email,
      phone: previous.phone,
    }))
  }, [])

  return {
    values,
    errors,
    step,
    events,
    eventsLoading: eventsQuery.isLoading,
    eventsError: eventsQuery.isError,
    sessionLoading,
    isAuthenticated,
    submitting,
    submitError,
    submitted,
    draftRestored,
    setValue,
    goToStep,
    next,
    back,
    submit,
    reset,
  }
}

export type VolunteerApplication = ReturnType<typeof useVolunteerApplication>

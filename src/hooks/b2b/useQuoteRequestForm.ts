'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import { readUtmParams } from '@/lib/attribution/utm'
import { PROJECT_TYPES, TEAM_SIZES } from '@/lib/b2b/quoteRequest'
import { isTurnstileEnabled } from '@/components/b2b/TurnstileWidget'

type TextField = 'companyName' | 'fullName' | 'email' | 'phone' | 'message' | 'website'

const EMPTY = {
  companyName: '',
  fullName: '',
  email: '',
  phone: '',
  message: '',
  website: '',
  teamSize: '' as string,
  projectType: PROJECT_TYPES[0].value as string,
}

export function useQuoteRequestForm() {
  const [values, setValues] = useState(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const setField = (field: TextField) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setError(null)
    setValues((previous) => ({ ...previous, [field]: event.target.value }))
  }

  const setChoice = (field: 'teamSize' | 'projectType') => (value: string) => {
    setError(null)
    setValues((previous) => ({ ...previous, [field]: value }))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!values.teamSize) {
      setError(`Indiquez la taille de l'équipe (${TEAM_SIZES.map((size) => size.label).join(', ')}).`)
      return
    }

    if (isTurnstileEnabled && !turnstileToken) {
      setError('Vérification anti-spam en cours. Réessayez dans un instant.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/b2b/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, turnstileToken: turnstileToken ?? undefined, utm: readUtmParams() ?? undefined }),
      })
      const data = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) {
        setError(data.error ?? 'Envoi impossible pour le moment. Écrivez-nous à contact@overbound-race.com.')
        return
      }
      setSent(true)
      setValues(EMPTY)
    } catch {
      setError('Envoi impossible pour le moment. Écrivez-nous à contact@overbound-race.com.')
    } finally {
      setSubmitting(false)
    }
  }

  return { values, error, sent, submitting, setField, setChoice, setTurnstileToken, submit, sentTo: values.email }
}

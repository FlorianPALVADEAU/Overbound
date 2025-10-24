'use client'

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SessionProfile } from '@/app/api/session/sessionQueries'
import {
  ACCOUNT_REGISTRATIONS_QUERY_KEY,
  type AccountRegistrationsResponse,
} from '@/app/api/account/registrations/accountRegistrationsQueries'
import { SESSION_QUERY_KEY } from '@/app/api/session/sessionQueries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'

interface AccountProfileFormProps {
  profile: SessionProfile | null
  email?: string | null
  onSuccess?: () => void
}

type FormFieldKey = 'full_name' | 'phone' | 'date_of_birth'
type BooleanFieldKey = 'marketing_opt_in'

interface FormValues {
  full_name: string
  phone: string
  date_of_birth: string
  marketing_opt_in: boolean
}

type UpdatePayload = Partial<Record<FormFieldKey, string | null>> & {
  marketing_opt_in?: boolean
}

interface UpdateProfileResponse {
  success: boolean
  profile?: SessionProfile | null
  error?: string
}

const FORM_FIELDS: FormFieldKey[] = ['full_name', 'phone', 'date_of_birth']
const BOOLEAN_FIELDS: BooleanFieldKey[] = ['marketing_opt_in']

const normalize = (value: string) => value.trim()

export function AccountProfileForm({ profile, email, onSuccess }: AccountProfileFormProps) {
  const queryClient = useQueryClient()

  const initialValues = useMemo<FormValues>(
    () => ({
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      date_of_birth: profile?.date_of_birth ?? '',
      marketing_opt_in: Boolean(profile?.marketing_opt_in),
    }),
    [profile?.full_name, profile?.phone, profile?.date_of_birth, profile?.marketing_opt_in],
  )

  const [savedValues, setSavedValues] = useState<FormValues>(initialValues)
  const [formValues, setFormValues] = useState<FormValues>(initialValues)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )

  useEffect(() => {
    setSavedValues(initialValues)
    setFormValues(initialValues)
  }, [initialValues])

  const mutation = useMutation<UpdateProfileResponse, Error, UpdatePayload>({
    mutationFn: async (payload) => {
      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = (await response.json().catch(() => ({}))) as UpdateProfileResponse

      if (!response.ok) {
        throw new Error(data.error || 'Impossible de mettre à jour le profil.')
      }

      return data
    },
    onSuccess: async (data, sentPayload) => {
      const updatedProfile = data.profile ?? null

      if (updatedProfile) {
        const nextValues: FormValues = {
          full_name: updatedProfile.full_name ?? '',
          phone: updatedProfile.phone ?? '',
          date_of_birth: updatedProfile.date_of_birth ?? '',
          marketing_opt_in: Boolean((updatedProfile as any).marketing_opt_in),
        }
        setSavedValues(nextValues)
        setFormValues(nextValues)
      } else {
        // Fall back to merging with existing values when API returns no profile payload
        setSavedValues((previous) => {
          const merged: FormValues = { ...previous }
          FORM_FIELDS.forEach((field) => {
            if (field in sentPayload) {
              const value = sentPayload[field]
              merged[field] = value ?? ''
            }
          })
          BOOLEAN_FIELDS.forEach((field) => {
            if (field in sentPayload) {
              merged[field] = Boolean(sentPayload[field as BooleanFieldKey])
            }
          })
          setFormValues(merged)
          return merged
        })
      }

      setFeedback({ type: 'success', message: 'Profil mis à jour.' })

      queryClient.setQueryData<AccountRegistrationsResponse | undefined>(
        ACCOUNT_REGISTRATIONS_QUERY_KEY,
        (prev) =>
          prev
            ? {
                ...prev,
                profile:
                  data.profile ??
                  {
                    ...(prev.profile ?? {}),
                    ...Object.fromEntries(
                      Object.entries(sentPayload).map(([key, value]) => [key, value ?? null]),
                    ),
                    ...BOOLEAN_FIELDS.reduce<Record<string, boolean>>((accumulator, field) => {
                      if (field in sentPayload) {
                        accumulator[field] = Boolean(sentPayload[field as BooleanFieldKey])
                      }
                      return accumulator
                    }, {}),
                  },
              }
            : prev,
      )

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ACCOUNT_REGISTRATIONS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY }),
      ])

      onSuccess?.()
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: error.message })
    },
  })

  const maxBirthdate = useMemo(() => {
    const today = new Date()
    return today.toISOString().split('T')[0] ?? ''
  }, [])

  const handleChange =
    (field: FormFieldKey) => (event: ChangeEvent<HTMLInputElement>) => {
      setFormValues((prev) => ({ ...prev, [field]: event.target.value }))
      if (feedback) {
        setFeedback(null)
      }
    }

  const buildPayload = (): UpdatePayload => {
    const payload: UpdatePayload = {}

    FORM_FIELDS.forEach((field) => {
      const current = normalize(formValues[field])
      const saved = normalize(savedValues[field])

      if (current !== saved) {
        payload[field] = current.length > 0 ? current : null
      }
    })

    BOOLEAN_FIELDS.forEach((field) => {
      if (formValues[field] !== savedValues[field]) {
        payload[field] = formValues[field]
      }
    })

    return payload
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const payload = buildPayload()
    if (Object.keys(payload).length === 0) {
      return
    }
    mutation.mutate(payload)
  }

  const isDirty = useMemo(
    () =>
      FORM_FIELDS.some(
        (field) => normalize(formValues[field]) !== normalize(savedValues[field]),
      ) ||
      BOOLEAN_FIELDS.some((field) => formValues[field] !== savedValues[field]),
    [formValues, savedValues],
  )

  const isSubmitting = mutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="account-full-name">Nom complet</Label>
          <Input
            id="account-full-name"
            name="full_name"
            placeholder="Votre nom"
            value={formValues.full_name}
            onChange={handleChange('full_name')}
            autoComplete="name"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="account-email">Adresse e-mail</Label>
          <Input
            id="account-email"
            name="email"
            type="email"
            value={email ?? ''}
            disabled
            readOnly
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="account-phone">Téléphone</Label>
          <Input
            id="account-phone"
            name="phone"
            type="tel"
            placeholder="+33 6 12 34 56 78"
            value={formValues.phone}
            onChange={handleChange('phone')}
            autoComplete="tel"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="account-birthdate">Date de naissance</Label>
          <Input
            id="account-birthdate"
            name="date_of_birth"
            type="date"
            value={formValues.date_of_birth}
            max={maxBirthdate}
            onChange={handleChange('date_of_birth')}
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="account-marketing-opt-in">Préférences de communication</Label>
          <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Recevoir les emails d’actualités</p>
              <p className="text-sm text-muted-foreground">
                Nouveaux événements, offres partenaires et contenus exclusifs. Tu peux te désabonner à tout moment.
              </p>
            </div>
            <Switch
              id="account-marketing-opt-in"
              checked={formValues.marketing_opt_in}
              onCheckedChange={(checked) => {
                setFormValues((prev) => ({ ...prev, marketing_opt_in: checked }))
                if (feedback) {
                  setFeedback(null)
                }
              }}
              aria-label="Activer ou désactiver les emails marketing"
            />
          </div>
        </div>
      </div>

      {feedback ? (
        <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}

export default AccountProfileForm

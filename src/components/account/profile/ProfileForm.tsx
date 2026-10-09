'use client'

import { useState, type FormEvent } from 'react'
import type { SessionProfile } from '@/app/api/session/sessionQueries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateProfile, type ProfileUpdatePayload } from '@/hooks/account/useUpdateProfile'
import type { ProfileField } from '@/lib/account/profile'
import { cn } from '@/lib/utils'

type FormValues = Record<ProfileField, string>

const FIELDS: Array<{
  field: ProfileField
  label: string
  type: string
  autoComplete: string
  placeholder?: string
  inputMode?: 'tel'
}> = [
  { field: 'full_name', label: 'Nom complet', type: 'text', autoComplete: 'name', placeholder: 'Prénom Nom' },
  { field: 'phone', label: 'Téléphone', type: 'tel', autoComplete: 'tel', placeholder: '06 12 34 56 78', inputMode: 'tel' },
  { field: 'date_of_birth', label: 'Date de naissance', type: 'date', autoComplete: 'bday' },
]

const toValues = (profile: SessionProfile | null): FormValues => ({
  full_name: profile?.full_name ?? '',
  phone: profile?.phone ?? '',
  date_of_birth: profile?.date_of_birth ?? '',
})

const today = () => new Date().toISOString().split('T')[0]

export function ProfileForm({ profile, email }: { profile: SessionProfile | null; email: string | null | undefined }) {
  const update = useUpdateProfile()
  const [saved, setSaved] = useState<FormValues>(() => toValues(profile))
  const [values, setValues] = useState<FormValues>(saved)
  const [justSaved, setJustSaved] = useState(false)

  const changed = FIELDS.filter(({ field }) => values[field].trim() !== saved[field].trim())

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (changed.length === 0) return
    const payload: ProfileUpdatePayload = Object.fromEntries(
      changed.map(({ field }) => [field, values[field].trim() || null]),
    )
    update.mutate(payload, {
      onSuccess: () => {
        setSaved(values)
        setJustSaved(true)
      },
    })
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {FIELDS.map(({ field, label, type, autoComplete, placeholder, inputMode }) => {
        const missing = values[field].trim() === ''
        return (
          <div key={field} className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label htmlFor={`profile-${field}`} className="text-sm font-semibold">
                {label}
              </Label>
              {missing ? <span className="text-xs font-semibold text-destructive">À compléter</span> : null}
            </div>
            <Input
              id={`profile-${field}`}
              name={field}
              type={type}
              inputMode={inputMode}
              autoComplete={autoComplete}
              placeholder={placeholder}
              value={values[field]}
              max={type === 'date' ? today() : undefined}
              onChange={(event) => {
                setJustSaved(false)
                setValues((previous) => ({ ...previous, [field]: event.target.value }))
              }}
              className={cn('h-12 text-base', missing && 'border-destructive/60')}
            />
          </div>
        )
      })}

      <div className="space-y-2">
        <Label htmlFor="profile-email" className="text-sm font-semibold">
          Email
        </Label>
        <Input id="profile-email" type="email" value={email ?? ''} readOnly disabled className="h-12 text-base" />
      </div>

      {update.error ? <p role="alert" className="text-sm text-destructive">{update.error.message}</p> : null}

      <Button type="submit" disabled={changed.length === 0 || update.isPending} className="h-12 w-full text-base font-bold">
        {update.isPending ? 'Enregistrement…' : justSaved ? 'Enregistré ✓' : 'Enregistrer'}
      </Button>
    </form>
  )
}

'use client'

import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DISPLAY_TITLE } from '@/components/ds'
import { PROJECT_TYPES, TEAM_SIZES } from '@/lib/b2b/quoteRequest'
import { useQuoteRequestForm } from '@/hooks/b2b/useQuoteRequestForm'
import { TurnstileWidget } from './TurnstileWidget'
import { cn } from '@/lib/utils'

interface ChoiceGroupProps {
  legend: string
  name: string
  options: ReadonlyArray<{ value: string; label: string }>
  value: string
  onChange: (value: string) => void
  disabled: boolean
  /** Show the short value ("10-19") instead of the label, to keep one row in a narrow card. */
  short?: boolean
}

function ChoiceGroup({ legend, name, options, value, onChange, disabled, short = false }: ChoiceGroupProps) {
  return (
    <fieldset className="min-w-0 space-y-2" disabled={disabled}>
      <legend className="text-sm font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {options.map((option) => {
          const active = value === option.value
          return (
            <label
              key={option.value}
              className={cn(
                'inline-flex min-h-11 cursor-pointer items-center rounded-full border text-sm font-medium transition-colors', short ? 'px-2.5 sm:px-3' : 'px-4',
                'has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-foreground/80 hover:border-primary/60',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={active}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {short ? option.value : option.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

interface QuoteRequestFormProps {
  /** `compact` asks for the essentials only (hero card); the project defaults to billets. */
  variant?: 'full' | 'compact'
}

const SELECT_CLASS =
  'h-11 w-full rounded-md border border-input bg-transparent px-3 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 md:text-sm'

export function QuoteRequestForm({ variant = 'full' }: QuoteRequestFormProps) {
  const form = useQuoteRequestForm()
  const uid = useId()
  const compact = variant === 'compact'
  // On a phone the optional fields start folded: three fields and a button, not a wall of inputs.
  const [detailsOpen, setDetailsOpen] = useState(false)

  if (form.sent) {
    return (
      <div role="status" className="space-y-3">
        <h3 className={cn(DISPLAY_TITLE, 'text-title')}>Demande envoyée</h3>
        <p className="text-muted-foreground">
          Merci. Un e-mail de confirmation vient de partir. Nous revenons vers vous avec une offre adaptée à votre équipe.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={form.submit} className="space-y-4">
      <div className={cn('grid gap-3', compact ? 'grid-cols-2' : 'sm:grid-cols-2 sm:gap-4')}>
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-company`}>Entreprise</Label>
          <Input
            id={`${uid}-company`}
            name="companyName"
            autoComplete="organization"
            required
            minLength={2}
            maxLength={120}
            value={form.values.companyName}
            onChange={form.setField('companyName')}
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-name`}>Votre nom</Label>
          <Input
            id={`${uid}-name`}
            name="fullName"
            autoComplete="name"
            required
            minLength={2}
            maxLength={120}
            value={form.values.fullName}
            onChange={form.setField('fullName')}
            className="h-11"
          />
        </div>
        <div className={cn('space-y-1.5', compact ? 'col-span-2' : 'sm:col-span-2')}>
          <Label htmlFor={`${uid}-email`}>E-mail professionnel</Label>
          <Input
            id={`${uid}-email`}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.values.email}
            onChange={form.setField('email')}
            className="h-11"
          />
        </div>
      </div>

      <ChoiceGroup
        legend="Combien de participants ?"
        name={`${uid}-teamSize`}
        options={TEAM_SIZES}
        value={form.values.teamSize}
        onChange={form.setChoice('teamSize')}
        disabled={form.submitting}
        short
      />

      {compact ? null : (
        <>
          <button
            type="button"
            onClick={() => setDetailsOpen((open) => !open)}
            aria-expanded={detailsOpen}
            aria-controls={`${uid}-details`}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline lg:hidden"
          >
            {detailsOpen ? 'Masquer les précisions' : 'Ajouter des précisions (facultatif)'}
          </button>

          <div id={`${uid}-details`} className={cn('gap-3 sm:grid-cols-2 sm:gap-4 lg:grid', detailsOpen ? 'grid' : 'hidden')}>
            <div className="space-y-1.5">
              <Label htmlFor={`${uid}-phone`}>Téléphone (facultatif)</Label>
              <Input
                id={`${uid}-phone`}
                name="phone"
                type="tel"
                autoComplete="tel"
                maxLength={30}
                value={form.values.phone}
                onChange={form.setField('phone')}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${uid}-project`}>Votre projet</Label>
              <select
                id={`${uid}-project`}
                name="projectType"
                value={form.values.projectType}
                onChange={(event) => form.setChoice('projectType')(event.target.value)}
                disabled={form.submitting}
                className={SELECT_CLASS}
              >
                {PROJECT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor={`${uid}-message`}>Précisions (facultatif)</Label>
              <Textarea
                id={`${uid}-message`}
                name="message"
                rows={3}
                maxLength={2000}
                value={form.values.message}
                onChange={form.setField('message')}
                placeholder="Budget, facture, CSE, niveau des participants, questions."
              />
            </div>
          </div>
        </>
      )}

      {/* Honeypot: hidden from people and from assistive technology. */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor={`${uid}-website`}>Ne pas remplir</label>
        <input
          id={`${uid}-website`}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={form.values.website}
          onChange={form.setField('website')}
        />
      </div>

      <TurnstileWidget onToken={form.setTurnstileToken} />

      {form.error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {form.error}
        </p>
      ) : null}

      <div className="space-y-2">
        <Button type="submit" size="cta" disabled={form.submitting} className="w-full sm:w-auto">
          {form.submitting ? 'Envoi en cours…' : compact ? 'Recevoir mon devis' : 'Envoyer ma demande de devis'}
        </Button>
        <p className="flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
          {compact ? 'Utilisées uniquement pour répondre.' : 'Vos données servent uniquement à répondre à cette demande.'}
          <a href="/privacy-policies" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-foreground">
            Politique de confidentialité
          </a>
        </p>
      </div>
    </form>
  )
}

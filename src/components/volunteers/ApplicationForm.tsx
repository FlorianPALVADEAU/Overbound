'use client'

import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, Loader2, LogIn } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { EVENT_SELECTION_ANY, EVENT_SELECTION_CUSTOM } from '@/lib/volunteers/apply/formValues'
import { AVAILABILITY_OPTIONS } from '@/lib/volunteers/shared/Availability'
import { DEFAULT_MISSION, podCatalog } from '@/lib/volunteers/shared/Pod'
import { markResumeAfterLogin, type VolunteerApplication } from '@/hooks/volunteers/useVolunteerApplication'

const STEP_LABELS = ['Créneau', 'Contact', 'Message'] as const
const LOGIN_URL = '/auth/login?next=/volunteers'
const REGISTER_URL = '/auth/register?next=/volunteers'

const formatEventDate = (date: string | null): string | null => {
  if (!date || Number.isNaN(Date.parse(date))) return null
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  )
}

const primaryButton =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-base font-black text-primary-foreground transition hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
const ghostButton =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/20 px-5 text-base font-bold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

export function ApplicationForm({ application }: { application: VolunteerApplication }) {
  const {
    values,
    errors,
    step,
    events,
    eventsLoading,
    sessionLoading,
    isAuthenticated,
    submitting,
    submitError,
    submitted,
    draftRestored,
    setValue,
    next,
    back,
    submit,
    reset,
  } = application

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-primary/40 bg-primary/10 p-8 text-center" role="status">
        <CheckCircle2 className="h-12 w-12 text-primary" aria-hidden />
        <h3 className="text-2xl font-black text-white">Candidature reçue, {submitted.firstName} !</h3>
        <p className="text-gray-200">
          La tribu te contacte sous 48 h avec ton poste et les infos pratiques. Pour : {submitted.eventName}.
        </p>
        <p className="text-sm text-gray-400">
          Un email de confirmation part à {submitted.email}. Pense à vérifier tes spams.
        </p>
        <button type="button" onClick={reset} className={ghostButton}>
          Candidater pour quelqu’un d’autre
        </button>
      </div>
    )
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (step < 2) {
      next()
      return
    }
    if (isAuthenticated) void submit()
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <ol className="grid grid-cols-3 gap-2" aria-label="Étapes de la candidature">
        {STEP_LABELS.map((label, index) => (
          <li key={label} aria-current={index === step ? 'step' : undefined}>
            <span
              className={cn(
                'block h-1.5 rounded-full transition-colors duration-300 motion-reduce:transition-none',
                index <= step ? 'bg-primary' : 'bg-white/15',
              )}
            />
            <span
              className={cn(
                'mt-2 block text-xs font-black uppercase tracking-wider',
                index === step ? 'text-white' : 'text-gray-500',
              )}
            >
              {index + 1}. {label}
            </span>
          </li>
        ))}
      </ol>

      {draftRestored && step === 0 ? (
        <p className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-gray-100">
          Tes choix précédents sont conservés.
        </p>
      ) : null}

      {step === 0 ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="mission" className="text-base text-white">
              Poste
            </Label>
            <div className="relative">
              <select
                id="mission"
                value={values.mission}
                onChange={(event) => setValue('mission', event.target.value)}
                className="h-12 w-full appearance-none rounded-md border border-input bg-neutral-950 px-3 pr-10 text-base text-white outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {podCatalog.all().map((pod) => (
                  <option key={pod.key} value={pod.title}>
                    {pod.title}
                  </option>
                ))}
                <option value={DEFAULT_MISSION}>Je laisse l’équipe décider</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-selection" className="text-base text-white">
              Événement
            </Label>
            <div className="relative">
              <select
                id="event-selection"
                value={values.eventSelection}
                onChange={(event) => setValue('eventSelection', event.target.value)}
                aria-invalid={Boolean(errors.eventSelection)}
                aria-describedby={errors.eventSelection ? 'event-selection-error' : undefined}
                className="h-12 w-full appearance-none rounded-md border border-input bg-neutral-950 px-3 pr-10 text-base text-white outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
              >
                <option value="" disabled>
                  {eventsLoading ? 'Chargement…' : 'Sélectionne ton événement'}
                </option>
                {events.map((option) => (
                  <option key={option.id} value={option.id}>
                    {[option.title, formatEventDate(option.date), option.location].filter(Boolean).join(' · ')}
                  </option>
                ))}
                <option value={EVENT_SELECTION_ANY}>Je peux aider sur plusieurs événements</option>
                <option value={EVENT_SELECTION_CUSTOM}>Mon événement n’est pas dans la liste</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
            </div>
            <FieldError id="event-selection-error" message={errors.eventSelection} />
          </div>

          {values.eventSelection === EVENT_SELECTION_CUSTOM ? (
            <div className="space-y-2">
              <Label htmlFor="custom-event" className="text-base text-white">
                Nom de l’événement
              </Label>
              <Input
                id="custom-event"
                className="h-12 text-base"
                placeholder="Overbound Lyon – 12 mai"
                value={values.customEventName}
                onChange={(event) => setValue('customEventName', event.target.value)}
                aria-invalid={Boolean(errors.customEventName)}
                aria-describedby={errors.customEventName ? 'custom-event-error' : undefined}
              />
              <FieldError id="custom-event-error" message={errors.customEventName} />
            </div>
          ) : null}

          <fieldset className="space-y-3">
            <legend className="text-base font-medium text-white">Créneau</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {AVAILABILITY_OPTIONS.map((option) => {
                const checked = values.availability === option.value
                return (
                  <label
                    key={option.value}
                    className={cn(
                      'relative flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-white motion-reduce:transition-none',
                      checked ? 'border-primary bg-primary/10' : 'border-white/15 hover:border-white/40',
                    )}
                  >
                    <input
                      type="radio"
                      name="availability"
                      value={option.value}
                      checked={checked}
                      onChange={() => setValue('availability', option.value)}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                        checked ? 'border-primary' : 'border-white/40',
                      )}
                      aria-hidden
                    >
                      {checked ? <span className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
                    </span>
                    <span className="min-w-0 text-sm font-bold text-white">{option.label}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-5">
          {!sessionLoading && !isAuthenticated ? (
            <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-gray-200">
              <p className="font-bold text-white">Un compte Overbound est nécessaire pour envoyer.</p>
              <p className="mt-1">Tes choix sont conservés pendant la connexion.</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <a href={LOGIN_URL} onClick={markResumeAfterLogin} className={primaryButton}>
                  <LogIn className="h-4 w-4" aria-hidden /> Me connecter
                </a>
                <a href={REGISTER_URL} onClick={markResumeAfterLogin} className={ghostButton}>
                  Créer un compte
                </a>
              </div>
            </div>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-base text-white">Prénom</Label>
              <Input
                id="firstName"
                className="h-12 text-base"
                placeholder="Anaïs"
                autoComplete="given-name"
                value={values.firstName}
                onChange={(event) => setValue('firstName', event.target.value)}
                aria-invalid={Boolean(errors.firstName)}
                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
              />
              <FieldError id="firstName-error" message={errors.firstName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-base text-white">Nom de famille</Label>
              <Input
                id="lastName"
                className="h-12 text-base"
                placeholder="Dupont"
                autoComplete="family-name"
                value={values.lastName}
                onChange={(event) => setValue('lastName', event.target.value)}
                aria-invalid={Boolean(errors.lastName)}
                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
              />
              <FieldError id="lastName-error" message={errors.lastName} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base text-white">Email</Label>
            <Input
              id="email"
              type="email"
              className="h-12 text-base"
              placeholder="prenom@exemple.com"
              autoComplete="email"
              value={values.email}
              onChange={(event) => setValue('email', event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            <FieldError id="email-error" message={errors.email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-base text-white">Téléphone portable</Label>
            <Input
              id="phone"
              type="tel"
              className="h-12 text-base"
              placeholder="06 12 34 56 78"
              autoComplete="tel"
              value={values.phone}
              onChange={(event) => setValue('phone', event.target.value)}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
            />
            <FieldError id="phone-error" message={errors.phone} />
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="experience" className="text-base text-white">
              Ton expérience <span className="text-gray-400">(optionnel)</span>
            </Label>
            <Textarea
              id="experience"
              rows={3}
              maxLength={600}
              placeholder="Déjà aidé sur des courses ? Première fois ? Dis-nous."
              value={values.experience}
              onChange={(event) => setValue('experience', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="motivations" className="text-base text-white">
              Message <span className="text-gray-400">(optionnel)</span>
            </Label>
            <Textarea
              id="motivations"
              rows={3}
              maxLength={1200}
              placeholder="Motivations, contraintes, amis à placer avec toi…"
              value={values.motivations}
              onChange={(event) => setValue('motivations', event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="relative flex min-h-14 cursor-pointer items-start gap-3 rounded-xl bg-white/5 p-4 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-white">
              <input
                id="gdprConsent"
                type="checkbox"
                checked={values.gdprConsent}
                onChange={(event) => setValue('gdprConsent', event.target.checked)}
                aria-invalid={Boolean(errors.gdprConsent)}
                aria-describedby={errors.gdprConsent ? 'gdpr-error' : undefined}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2',
                  values.gdprConsent ? 'border-primary bg-primary text-primary-foreground' : 'border-white/40',
                )}
                aria-hidden
              >
                {values.gdprConsent ? <Check className="h-3.5 w-3.5" /> : null}
              </span>
              <span className="text-sm leading-relaxed text-gray-300">
                J’accepte qu’Overbound me contacte au sujet de cette mission bénévole et des informations
                logistiques associées.
              </span>
            </label>
            <FieldError id="gdpr-error" message={errors.gdprConsent} />
          </div>

          {submitError ? (
            <p role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-white">
              {submitError}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {step > 0 ? (
          <button type="button" onClick={back} className={ghostButton}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> Retour
          </button>
        ) : (
          <span />
        )}

        {step < 2 ? (
          <button type="submit" className={primaryButton}>
            Continuer <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        ) : isAuthenticated ? (
          <button type="submit" disabled={submitting} className={primaryButton}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Envoyer ma candidature
          </button>
        ) : (
          <a href={LOGIN_URL} onClick={markResumeAfterLogin} className={primaryButton}>
            <LogIn className="h-4 w-4" aria-hidden /> Me connecter pour envoyer
          </a>
        )}
      </div>
    </form>
  )
}

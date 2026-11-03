/** Ages the checkout can enforce: adults only, or open to 16 to 17 year olds on the OPEN format. */
export const MINIMUM_AGE_OPTIONS = [18, 16] as const

export type MinimumAge = (typeof MINIMUM_AGE_OPTIONS)[number]

/** Normalise `events.minimum_age` typed in the admin: 16, or 18 for anything else (adults only is the safe default). */
export const parseMinimumAge = (value: unknown): MinimumAge => {
  const parsed = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10)
  return parsed === 16 ? 16 : 18
}

/** Bold lead of the age rule on the event page. */
export const ageRuleHeadline = (minimumAge: number): string =>
  minimumAge < 18 ? `Dès ${minimumAge} ans.` : `Réservé aux ${minimumAge} ans et plus.`

/** One sentence for the ticket step: who may register, and on which conditions. */
export const ageRuleSentence = (minimumAge: number): string =>
  minimumAge < 18
    ? `Dès ${minimumAge} ans. Avant 18 ans : format OPEN uniquement, autorisation parentale signée et adulte référent présent sur le site.`
    : 'Réservé aux personnes majeures (18 ans le jour de l’événement).'

interface MinimumAgeChange {
  next: MinimumAge
  current: MinimumAge
  /** Registrations of minors that are not cancelled. */
  activeMinorRegistrations: number
}

/** Going back to adults only would strand the minors already registered: refuse it. Returns an error message or null. */
export const validateMinimumAgeChange = ({ next, current, activeMinorRegistrations }: MinimumAgeChange): string | null => {
  if (next === 18 && current < 18 && activeMinorRegistrations > 0) {
    return `${activeMinorRegistrations} inscription(s) de mineur(s) sont déjà enregistrées : l'événement ne peut plus être réservé aux majeurs. Annule ou rembourse-les d'abord.`
  }
  return null
}

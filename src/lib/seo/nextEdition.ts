import { NEXT_EDITION } from './siteFacts'

/**
 * What the site says about the next edition. While no event is announced it
 * is the fallback window from siteFacts; once an event is announced or on
 * sale in the database, the date and venue come from that event, so the
 * switch needs no deploy.
 */
export interface NextEditionFacts {
  confirmed: boolean
  /** Phrase to follow "prévue" or "aura lieu": "entre avril et juin 2027" or "le 7 février 2027". */
  window: string
  /** Short value for a figure cell: "Avril à juin 2027" or "7 février 2027". */
  shortLabel: string
  venue: string | null
  detailsStatus: string
}

export const FALLBACK_NEXT_EDITION: NextEditionFacts = {
  confirmed: false,
  window: NEXT_EDITION.window,
  shortLabel: 'Avril à juin 2027',
  venue: null,
  detailsStatus: NEXT_EDITION.detailsStatus,
}

type NextEditionEvent = {
  date: string | null | undefined
  location: string | null | undefined
}

const formatParisDate = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' }).format(
    new Date(iso),
  )

export const resolveNextEdition = (event: NextEditionEvent | null | undefined): NextEditionFacts => {
  if (!event?.date || Number.isNaN(new Date(event.date).getTime())) return FALLBACK_NEXT_EDITION
  const label = formatParisDate(event.date)
  const venue = event.location?.trim() || null
  return {
    confirmed: true,
    window: `le ${label}`,
    shortLabel: label,
    venue,
    detailsStatus: venue ? `Lieu : ${venue}.` : 'Le lieu sera annoncé prochainement.',
  }
}

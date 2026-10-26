import {
  OPEN_FORMAT_RULES,
  RANKED_FORMAT_RULES,
  RANKED_LAP_TIME_LIMITS_SUMMARY,
  SHARED_FORMAT_RULES,
} from '@/constants/raceFormatRules'

/**
 * Single source for the public facts about Overbound. Pages, JSON-LD and
 * llms.txt read from here so that a figure is never typed twice.
 * Update NEXT_EDITION when the 2027 date and venue are confirmed.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com').replace(/\/$/, '')

export const BRAND = {
  name: 'Overbound',
  tagline: 'Course à obstacles en boucles',
  area: 'Paris, Île-de-France',
} as const

export const PREVIOUS_EDITION = {
  name: 'Ultra Arena 2026',
  slug: 'ultra-arena-2026',
  dateLabel: '12 septembre 2026',
  dateIso: '2026-09-12',
  venue: 'Île de Loisirs de Saint-Quentin-en-Yvelines',
  participants: 'plus de 300 participants',
} as const

export const NEXT_EDITION = {
  window: 'entre avril et juin 2027',
  detailsStatus: 'La date et le lieu seront annoncés dès leur confirmation.',
  confirmed: false,
} as const

export const FORMAT_FACTS = {
  loopKm: SHARED_FORMAT_RULES.loopKm,
  minAge: SHARED_FORMAT_RULES.minAge,
  open: {
    name: 'OPEN',
    summary: `Sans classement. Départs par vagues toutes les ${OPEN_FORMAT_RULES.sasIntervalMinutes} minutes, de ${OPEN_FORMAT_RULES.firstSasDeparture} à ${OPEN_FORMAT_RULES.lastSasDeparture}. Dernier tour lancé avant ${OPEN_FORMAT_RULES.lastLapStart}, fermeture du parcours à ${OPEN_FORMAT_RULES.courseClosing}.`,
  },
  ranked: {
    name: 'RANKED',
    departure: RANKED_FORMAT_RULES.departure,
    lapLimits: RANKED_LAP_TIME_LIMITS_SUMMARY,
    summary: `Départ unique à ${RANKED_FORMAT_RULES.departure}. Un tour à boucler dans un temps limite qui diminue : ${RANKED_LAP_TIME_LIMITS_SUMMARY}. Dernier coureur en course : vainqueur.`,
  },
} as const

export interface PageLink {
  href: string
  label: string
}

export const PILLAR_LINKS: Record<'paris' | 'loops' | 'facts', PageLink> = {
  paris: { href: '/course-a-obstacles-paris', label: 'Course à obstacles à Paris' },
  loops: { href: '/course-a-obstacles-en-boucles', label: 'Course à obstacles en boucles' },
  facts: { href: '/overbound-en-bref', label: 'Overbound en bref' },
}

/** Listings of the 2026 edition on third-party sites (event pages, not profiles of the organizer). */
export const EDITION_2026_LISTINGS = [
  'https://fr.milesrepublic.com/event/overbound-race-15645',
  'https://www.preparun.com/fr-FR/c/overbound-race-2026',
  'https://werun.world/course/overbound/',
  'https://www.raceup.org/event/overbound-race-2026-09-12-trappes',
  'https://www.finishers.com/course/overbound-backyard-a-obstacles',
  'https://trainerday.com/fr/events/fr/overbound-backyard-a-obstacles',
  'https://www.runtrail.run/event/39561-overbound-backyard-a-obstacles',
] as const

export const TEASER_VIDEO = {
  name: 'Teaser Overbound, course à obstacles en boucles',
  description: "Le teaser d'Overbound : une boucle de 2 km, plus de 10 obstacles, deux formats OPEN et RANKED.",
  contentPath: '/videos/teaser.mp4',
  posterPath: '/images/og/crowd.jpg',
  uploadDate: '2026-10-26',
  duration: 'PT1M27S',
} as const

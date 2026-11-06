/**
 * Plain replacement for the Sanity "settings" singleton (siteTitle,
 * description, default OG image). Three fields, edited maybe once a year:
 * not worth a CMS round trip.
 */
export const SITE_SETTINGS = {
  siteTitle: 'Overbound',
  description:
    "Overbound, la course à obstacles où tu choisis ton format : OPEN à ton rythme ou RANKED en compétition.",
  ogImage: '/images/images/overbound-og-cover.jpg',
} as const

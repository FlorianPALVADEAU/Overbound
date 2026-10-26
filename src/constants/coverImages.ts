/**
 * Single source for the cover photos. A slot is one name, one place to swap
 * a picture: edit the file name here, nowhere else.
 * Photos live in /public/images; heroes are webp, share cards are jpg (see OG_PHOTOS).
 */
const photo = (file: string) => `/images/images/${file}` as const
const obstacle = (file: string) => `/images/obstacles/${file}` as const

export const COVER = {
  home: {
    poster: obstacle('tire-flip.webp'),
    cta: photo('P1102323.webp'),
    volunteersAppeal: photo('benevoles-47.webp'),
  },
  event: {
    fallbackHero: obstacle('tire-flip2.webp'),
    bandPerks: photo('P1091330.webp'),
    bandReassurance: obstacle('wall-under.webp'),
    gallery: [
      photo('P1102314.webp'),
      obstacle('tire-drag2.webp'),
      photo('P1091180.webp'),
      photo('benevoles-47.webp'),
    ],
    projectionBackground: photo('P1102323.webp'),
  },
  auth: [
    obstacle('chain-carry1.webp'),
    obstacle('chain-carry2.webp'),
    obstacle('chain-carry3.webp'),
    obstacle('chain-carry4.webp'),
    obstacle('log-carry1.webp'),
    obstacle('log-carry2.webp'),
    obstacle('monkey-bars.webp'),
    obstacle('wall-over.webp'),
    obstacle('balance-beam.webp'),
  ],
  /** Square cards of the « why Overbound » band on /races/[id], in display order. */
  raceValues: [
    obstacle('log-carry-end.webp'),
    photo('P1102314.webp'),
    obstacle('tire-flip.webp'),
    photo('benevoles-47.webp'),
    obstacle('log-carry1.webp'),
    obstacle('chain-carry2.webp'),
    photo('P1091330.webp'),
    photo('P1102323.webp'),
  ],
  community: {
    volunteerPerks: photo('benevoles-47.webp'),
    eventOver: obstacle('log-carry2.webp'),
    comeTogether: photo('P1102314.webp'),
  },
  pages: {
    formats: obstacle('tire-drag.webp'),
    formatsJourney: photo('P1091330.webp'),
    obstacles: obstacle('barbels.webp'),
    volunteers: photo('benevoles-5.webp'),
    bootcamps: obstacle('tire-drag2.webp'),
    ourStory: photo('P1090801.webp'),
    faq: photo('P1102314.webp'),
    partners: photo('P1091180.webp'),
    credits: photo('P1091511.webp'),
    contact: obstacle('farmer-carry.webp'),
    blog: obstacle('barbels2.webp'),
  },
} as const

/**
 * Photos usable behind a share card. jpg only: the card renderer and some
 * social crawlers do not read webp or avif. Paths are relative to /public.
 */
export const OG_PHOTOS = {
  crowd: 'images/og/crowd.jpg',
  tire: 'images/og/tire.jpg',
  tire2: 'images/og/tire2.jpg',
  barbed: 'images/og/barbed.jpg',
  podium: 'images/og/podium.jpg',
  women: 'images/og/women.jpg',
  group: 'images/og/group.jpg',
  partners: 'images/og/partners.jpg',
  volunteers: 'images/og/volunteers.jpg',
  pride: 'images/og/pride.jpg',
  start: 'images/og/start.jpg',
  drag: 'images/og/drag.jpg',
} as const

export type OgPhotoKey = keyof typeof OG_PHOTOS

export const isOgPhotoKey = (value: string | null): value is OgPhotoKey =>
  value !== null && Object.prototype.hasOwnProperty.call(OG_PHOTOS, value)

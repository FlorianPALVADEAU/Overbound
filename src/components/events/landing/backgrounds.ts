import { COVER } from '@/constants/coverImages'
/**
 * Template photos behind the landing bands. Swap any path for another file in
 * /public (or an https URL allowed in next.config) to change a section's photo.
 */
export const LANDING_BACKGROUNDS = {
  perks: COVER.event.bandPerks,
  reassurance: COVER.event.bandReassurance,
} as const

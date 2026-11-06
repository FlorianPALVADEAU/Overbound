import type { ParticipantSex } from '@/lib/checkout/participantSex'

/** Label shown in the back-office for each sex. */
export const PARTICIPANT_SEX_LABELS: Record<ParticipantSex, string> = {
  homme: 'Homme',
  femme: 'Femme',
}

/**
 * Badge tone per sex, from the design tokens only. Blue and amber stay apart at a glance
 * and neither is the action green, which is reserved for primary actions.
 */
export const PARTICIPANT_SEX_BADGE_CLASS: Record<ParticipantSex, string> = {
  homme: 'border-info/40 bg-info/15 text-info',
  femme: 'border-warning/40 bg-warning/15 text-warning',
}

/** Bar fill per sex for the back-office statistics. Same tokens as the badges. */
export const PARTICIPANT_SEX_BAR_CLASS: Record<ParticipantSex, string> = {
  homme: 'bg-info',
  femme: 'bg-warning',
}

/** Bibs whose sex was never recorded (created before the field existed). */
export const PARTICIPANT_SEX_UNKNOWN_LABEL = 'Non renseigné'

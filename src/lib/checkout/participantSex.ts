import { z } from 'zod'

/**
 * Sex of a participant, kept on each bib for the rankings (podium per gender on RANKED).
 * Two values only: the rankings need exactly these, so no third option.
 */
export const PARTICIPANT_SEXES = ['homme', 'femme'] as const

export type ParticipantSex = (typeof PARTICIPANT_SEXES)[number]

export const participantSexSchema = z.enum(PARTICIPANT_SEXES)

export const isParticipantSex = (value: unknown): value is ParticipantSex => participantSexSchema.safeParse(value).success

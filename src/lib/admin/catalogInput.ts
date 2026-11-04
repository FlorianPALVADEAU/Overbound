import { z } from 'zod'

const RACE_TYPES = ['trail', 'obstacle', 'urbain', 'nature', 'extreme'] as const
const TARGET_PUBLICS = ['débutant', 'intermédiaire', 'expert', 'famille', 'elite', 'pro'] as const
const OBSTACLE_TYPES = ['force', 'agilité', 'technique', 'endurance', 'mental', 'équilibre', 'vitesse'] as const

const optionalText = z
  .string()
  .nullish()
  .transform((value) => {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
  })

const difficultyScale = z.coerce.number().int('La difficulté doit être un nombre entier').min(1, 'La difficulté doit être entre 1 et 10').max(10, 'La difficulté doit être entre 1 et 10')

/** Body of POST and PUT /api/admin/races. Obstacles are referenced by id; their order is their position. */
export const raceInputSchema = z.object({
  name: z.string().trim().min(1, 'Nom obligatoire'),
  logo_url: optionalText,
  type: z.enum(RACE_TYPES, { message: 'Type de course inconnu' }),
  difficulty: difficultyScale.default(5),
  target_public: z.enum(TARGET_PUBLICS, { message: 'Public cible inconnu' }),
  distance_km: z.coerce.number({ message: 'Distance invalide' }).positive('La distance doit être positive'),
  description: optionalText,
  is_universal: z.boolean().nullish().transform((value) => value ?? false),
  obstacle_ids: z
    .array(z.string().uuid('Obstacle invalide'))
    .nullish()
    .transform((value) => value ?? []),
})

export type RaceInput = z.infer<typeof raceInputSchema>

/** Body of PUT /api/admin/obstacles/[id]. */
export const obstacleInputSchema = z.object({
  name: z.string().trim().min(1, 'Nom obligatoire'),
  description: optionalText,
  image_url: optionalText,
  video_url: optionalText,
  difficulty: difficultyScale,
  type: z.enum(OBSTACLE_TYPES, { message: 'Type d’obstacle inconnu' }),
  metric_label: optionalText,
  metric_value: optionalText,
  weight_male: optionalText,
  weight_female: optionalText,
  penalty: optionalText,
})

export type ObstacleInput = z.infer<typeof obstacleInputSchema>

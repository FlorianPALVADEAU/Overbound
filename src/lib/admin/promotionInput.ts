import { z } from 'zod'

const DEFAULT_LINK_TEXT = "Découvrir l'offre"

/**
 * Body of PUT /api/admin/promotions/[id]. The title, description and link are required (the banner
 * cannot render without them); the dates must be readable and the end strictly after the start.
 */
export const promotionUpdateSchema = z
  .object({
    type: z.string().trim().min(1).default('banner'),
    title: z.string().trim().min(1, 'Titre obligatoire'),
    description: z.string().trim().min(1, 'Description obligatoire'),
    link_url: z.string().trim().min(1, 'Lien obligatoire'),
    link_text: z
      .string()
      .nullish()
      .transform((value) => value?.trim() || DEFAULT_LINK_TEXT),
    starts_at: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Date de début invalide'),
    ends_at: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Date de fin invalide'),
    is_active: z.boolean().nullish().transform((value) => value ?? true),
    popup_config: z.unknown().nullish().transform((value) => value ?? null),
  })
  .refine((value) => Date.parse(value.ends_at) > Date.parse(value.starts_at), {
    message: 'La date de fin doit être postérieure à la date de début',
    path: ['ends_at'],
  })

export type PromotionUpdateInput = z.infer<typeof promotionUpdateSchema>

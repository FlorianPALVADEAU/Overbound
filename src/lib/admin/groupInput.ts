import { z } from 'zod'

/**
 * Body of PATCH /api/admin/groups/[id]. Every field is optional: the route applies only what is sent.
 * The anchor is the group's OPEN wave (1 to 24, see FDR-0005); null clears it.
 */
export const groupUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Nom obligatoire').max(120, 'Nom trop long').optional(),
  captain_id: z.string().uuid('Capitaine invalide').optional(),
  anchor_event_id: z.string().uuid('Événement invalide').nullish(),
  anchor_ticket_id: z.string().uuid('Billet invalide').nullish(),
  anchor_wave_index: z.number().int('Vague invalide').min(1, 'La vague va de 1 à 24').max(24, 'La vague va de 1 à 24').nullish(),
  promotional_code: z.string().trim().max(64).optional(),
})

export type GroupUpdateInput = z.infer<typeof groupUpdateSchema>

/** Body of POST /api/admin/groups/[id]/delegate: the member who becomes captain. */
export const groupDelegateSchema = z.object({
  new_captain_id: z.string().uuid('Nouveau capitaine requis'),
})

/** Body of POST /api/admin/groups/[id]/members: the profile to add. */
export const groupMemberAddSchema = z.object({
  profile_id: z.string().uuid('Profil membre requis'),
})

/** Body of POST /api/admin/groups/from-promocode. */
export const groupFromPromocodeSchema = z.object({
  name: z.string().trim().min(1, 'Nom de groupe requis').max(120, 'Nom trop long'),
  promotional_code: z.string().trim().min(1, 'Code promo requis').max(64, 'Code promo trop long'),
  captain_profile_id: z.string().uuid('Capitaine requis'),
})

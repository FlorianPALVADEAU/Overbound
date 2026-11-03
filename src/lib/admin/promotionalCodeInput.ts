import { z } from 'zod'

/** Body of a promotional code, as the admin form sends it on both create and update. */
export const promotionalCodeInputSchema = z
  .object({
    code: z.string().min(1, 'Champs obligatoires manquants'),
    name: z.string().min(1, 'Champs obligatoires manquants'),
    description: z.string().nullable().optional(),
    discount_percent: z.number().nullable().optional(),
    discount_amount: z.number().nullable().optional(),
    currency: z.string().optional(),
    valid_from: z.string().min(1, 'Champs obligatoires manquants'),
    valid_until: z.string().min(1, 'Champs obligatoires manquants'),
    usage_limit: z.number().nullable().optional(),
    is_active: z.boolean().optional(),
    tier_order: z.number().nullable().optional(),
    auto_activate: z.boolean().optional(),
    event_ids: z.array(z.string().uuid()).optional(),
  })
  .superRefine((payload, ctx) => {
    const { discount_percent, discount_amount } = payload
    if ((discount_percent && discount_amount) || (!discount_percent && !discount_amount)) {
      ctx.addIssue({ code: 'custom', message: 'Spécifiez soit un pourcentage, soit un montant de réduction.' })
    }
    if (discount_percent && (discount_percent < 0 || discount_percent > 100)) {
      ctx.addIssue({ code: 'custom', message: 'Le pourcentage de réduction doit être compris entre 0 et 100.' })
    }
    if (discount_amount && discount_amount < 0) {
      ctx.addIssue({ code: 'custom', message: 'Le montant de réduction doit être positif.' })
    }
  })

export type PromotionalCodeInput = z.infer<typeof promotionalCodeInputSchema>

/** Columns written to `promotional_codes`: defaults applied, the event links handled separately. */
export function toPromotionalCodeRow(body: PromotionalCodeInput) {
  return {
    code: body.code,
    name: body.name,
    description: body.description || null,
    discount_percent: body.discount_percent ?? null,
    discount_amount: body.discount_amount ?? null,
    currency: body.currency || 'eur',
    valid_from: body.valid_from,
    valid_until: body.valid_until,
    usage_limit: body.usage_limit ?? null,
    is_active: body.is_active ?? true,
    tier_order: body.tier_order ?? null,
    auto_activate: body.auto_activate ?? false,
  }
}

import { z } from 'zod'

const EVENT_STATUSES = ['draft', 'announced', 'on_sale', 'sold_out', 'closed', 'cancelled', 'completed'] as const

const optionalText = z
  .string()
  .nullish()
  .transform((value) => {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
  })

const isoDateText = z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), 'Date invalide')

const optionalIsoDate = z
  .string()
  .nullish()
  .transform((value) => value?.trim() || null)
  .refine((value) => value === null || !Number.isNaN(Date.parse(value)), 'Date invalide')

/** A whole number sent as a number or as its digits. Empty text is refused, never read as 0. */
const wholeNumber = z.union([
  z.number().int().min(0, 'Ne peut pas être négatif'),
  z
    .string()
    .trim()
    .regex(/^\d+$/, 'Doit être un nombre entier')
    .transform(Number),
])

/**
 * Body of PUT /api/admin/events/[id]. The form always sends every field, so a missing `status` is an
 * error, not a silent reset to `draft`. `ranked_bib_capacity`, `minimum_age` and `tshirt_offer_quota`
 * keep their own parsers (lib/events/bibCapacity, minimumAge, tshirtOffer), which hold their rules.
 */
export const eventUpdateSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'Slug obligatoire')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide : minuscules, chiffres et tirets'),
  title: z.string().trim().min(1, 'Titre obligatoire'),
  subtitle: optionalText,
  description: optionalText,
  image_url: optionalText,
  date: isoDateText,
  sales_start: optionalIsoDate,
  location: z.string().trim().min(1, 'Lieu obligatoire'),
  capacity: wholeNumber,
  ranked_bib_capacity: z.unknown().optional(),
  minimum_age: z.unknown().optional(),
  tshirt_offer_quota: z.unknown().optional(),
  status: z.enum(EVENT_STATUSES, { message: 'Statut inconnu' }),
  external_provider: optionalText,
  external_event_id: optionalText,
  external_url: optionalText,
})

export type EventUpdateInput = z.infer<typeof eventUpdateSchema>

/** Body of POST /api/admin/events: same rules, but a missing status is a draft and a missing capacity is 0. */
export const eventCreateSchema = eventUpdateSchema.extend({
  status: z.enum(EVENT_STATUSES, { message: 'Statut inconnu' }).default('draft'),
  capacity: eventUpdateSchema.shape.capacity.default(0),
})

export type EventCreateInput = z.infer<typeof eventCreateSchema>

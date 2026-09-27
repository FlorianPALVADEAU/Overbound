import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { externalUpsellImagesSchema, getLegacyImageUrl, type ExternalUpsellImageInput } from './media'

const imageUrlSchema = z.string().url().refine((value) => new URL(value).protocol === 'https:').nullable().optional()

const optionsSchema = z.object({
  sizes: z.array(z.string().trim().min(1).max(30)).max(30).optional(),
}).strict().nullable().optional()

export const adminUpsellPayloadSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4_000).nullable().optional(),
  price_cents: z.number().int().min(0),
  currency: z.enum(['eur', 'usd', 'gbp']).default('eur'),
  type: z.enum(['tshirt', 'photos', 'patch', 'other']),
  event_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().default(true),
  stock_quantity: z.number().int().min(0).nullable().optional(),
  image_url: imageUrlSchema,
  images: externalUpsellImagesSchema.optional(),
  options: optionsSchema,
})

export type AdminUpsellInput = z.infer<typeof adminUpsellPayloadSchema>

export function toUpsellWritePayload(input: AdminUpsellInput) {
  const options = input.options?.sizes?.length ? { sizes: input.options.sizes } : null
  return {
    name: input.name,
    description: input.description || null,
    price_cents: input.price_cents,
    currency: input.currency,
    type: input.type,
    event_id: input.event_id || null,
    is_active: input.is_active,
    stock_quantity: input.stock_quantity ?? null,
    image_url: getLegacyImageUrl(input.images ?? [], input.image_url ?? null),
    options,
  }
}

export async function replaceExternalUpsellImages(
  client: ReturnType<typeof supabaseAdmin>,
  upsellId: string,
  images: ExternalUpsellImageInput[] | undefined,
) {
  if (!images) return
  const { error: deleteError } = await client.from('upsell_images').delete().eq('upsell_id', upsellId).eq('source', 'external')
  if (deleteError) throw new Error(deleteError.message)
  if (images.length === 0) return
  const { error: insertError } = await client.from('upsell_images').insert(images.map((image) => ({
    upsell_id: upsellId,
    source: image.source,
    external_url: image.external_url,
    alt_text: image.alt_text ?? null,
    position: image.position,
  })))
  if (insertError) throw new Error(insertError.message)
}

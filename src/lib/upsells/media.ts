import { z } from 'zod'

const httpsUrlSchema = z
  .string()
  .url('L\'URL de l\'image doit être valide')
  .refine((value) => new URL(value).protocol === 'https:', {
    message: 'L\'URL de l\'image doit utiliser HTTPS',
  })

export const externalUpsellImageSchema = z.object({
  source: z.literal('external'),
  external_url: httpsUrlSchema,
  alt_text: z.string().trim().max(500).nullable().optional(),
  position: z.number().int().min(0).max(99),
}).strict()

export const externalUpsellImagesSchema = z
  .array(externalUpsellImageSchema)
  .max(10, 'Un upsell peut contenir au maximum 10 images')
  .superRefine((images, context) => {
    const positions = new Set<number>()
    for (const [index, image] of images.entries()) {
      if (positions.has(image.position)) {
        context.addIssue({
          code: 'custom',
          message: 'Chaque image doit avoir une position unique',
          path: [index, 'position'],
        })
      }
      positions.add(image.position)
    }
  })

export type ExternalUpsellImageInput = z.infer<typeof externalUpsellImageSchema>

/** Input shared by the admin image replacement/deletion commands. */
export const uploadedUpsellImageMutationSchema = z.object({
  image_id: z.string().uuid('Identifiant image invalide'),
}).strict()

export type UploadedUpsellImageMutation = z.infer<typeof uploadedUpsellImageMutationSchema>

export const uploadedImageMimeTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
} as const

export const MAX_UPSELL_IMAGE_BYTES = 10 * 1024 * 1024

export const getLegacyImageUrl = (
  images: readonly ExternalUpsellImageInput[],
  explicitImageUrl: string | null,
): string | null => {
  if (explicitImageUrl) return explicitImageUrl

  return [...images]
    .sort((left, right) => left.position - right.position)
    .at(0)?.external_url ?? null
}

import type { OgPhotoKey } from '@/constants/coverImages'

export const OG_SIZE = { width: 1200, height: 630 } as const

interface OgImageInput {
  title: string
  kicker?: string
  photo?: OgPhotoKey
}

/** Relative URL of the generated share card; Next resolves it with metadataBase. */
export const ogImageUrl = ({ title, kicker, photo = 'crowd' }: OgImageInput): string => {
  const params = new URLSearchParams({ title, photo })
  if (kicker) params.set('kicker', kicker)
  return `/og?${params.toString()}`
}

/** `openGraph.images` / `twitter.images` entry for a page. */
export const ogImageMetadata = (input: OgImageInput) => ({
  url: ogImageUrl(input),
  ...OG_SIZE,
  alt: input.title,
})

/** Generic share card for pages without their own. */
export const DEFAULT_OG_IMAGE_URL = ogImageUrl({
  title: 'Course à obstacles en boucles',
  kicker: 'Overbound · Paris',
  photo: 'crowd',
})

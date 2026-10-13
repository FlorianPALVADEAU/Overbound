import { getImageProps } from 'next/image'

/** Posters are shown at most ~400 CSS px wide; next/image adds the 2x variant itself. */
const POSTER_WIDTH = 384
const POSTER_HEIGHT = 576

/**
 * Poster of a testimonial video, resized by the image optimizer. The source
 * JPEGs are 1080 px wide, about three times what the cards display.
 * Returns undefined when the media URL has no file name.
 */
export function testimonialPosterUrl(mediaUrl: string): string | undefined {
  const fileName = mediaUrl.split('/').pop()?.replace(/\.(webm|mp4)$/i, '')
  if (!fileName) return undefined
  const { props } = getImageProps({
    src: `/images/feedbacks/posters/${fileName}.jpg`,
    alt: '',
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
  })
  return props.src
}

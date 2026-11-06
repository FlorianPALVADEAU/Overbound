import { AVATAR_SIZE_PX } from './avatar'
import type { CropRegion } from './cropRegion'

const OUTPUT_QUALITY = 0.88

/** Reads the photo with its EXIF rotation applied. The caller closes the bitmap. */
export const loadAvatarBitmap = (file: Blob): Promise<ImageBitmap> => createImageBitmap(file, { imageOrientation: 'from-image' })

/** Draws a square region of the photo onto a canvas (preview and final cut share this). */
export const drawCropRegion = (bitmap: ImageBitmap, region: CropRegion, canvas: HTMLCanvasElement, size: number) => {
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Ton navigateur ne permet pas de traiter la photo.')
  context.imageSmoothingQuality = 'high'
  context.drawImage(bitmap, region.x, region.y, region.side, region.side, 0, 0, size, size)
}

/**
 * Cuts the chosen square out of the photo and downsizes it in the browser, so uploads stay small and
 * phone photos never leak their EXIF data (location…).
 */
export async function cropAvatar(bitmap: ImageBitmap, region: CropRegion, size: number = AVATAR_SIZE_PX): Promise<Blob> {
  const canvas = document.createElement('canvas')
  drawCropRegion(bitmap, region, canvas, size)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', OUTPUT_QUALITY))
  if (!blob) throw new Error('Impossible de préparer la photo.')
  return blob
}

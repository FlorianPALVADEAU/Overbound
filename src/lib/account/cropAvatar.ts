import { AVATAR_SIZE_PX } from './avatar'

const OUTPUT_QUALITY = 0.88

/**
 * Centre-crops the chosen photo to a square and downsizes it in the browser, so
 * uploads stay small and phone photos never leak their EXIF data (location…).
 */
export async function cropAvatar(file: File, size: number = AVATAR_SIZE_PX): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const side = Math.min(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Ton navigateur ne permet pas de traiter la photo.')

    context.imageSmoothingQuality = 'high'
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', OUTPUT_QUALITY))
    if (!blob) throw new Error('Impossible de préparer la photo.')
    return blob
  } finally {
    bitmap.close()
  }
}

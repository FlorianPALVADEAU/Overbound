export interface CropView {
  imageWidth: number
  imageHeight: number
  /** 1 shows the largest centred square; 3 shows a third of its side. */
  zoom: number
  /** Centre of the visible square, in source pixels. */
  centerX: number
  centerY: number
}

export interface CropRegion {
  /** Top-left corner and side of the square taken from the source image, in source pixels. */
  x: number
  y: number
  side: number
}

export const MIN_ZOOM = 1
export const MAX_ZOOM = 4

/** The square to cut out of the photo for a zoom and a centre, always kept inside the photo. */
export const resolveCropRegion = ({ imageWidth, imageHeight, zoom, centerX, centerY }: CropView): CropRegion => {
  const safeZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
  const side = Math.min(imageWidth, imageHeight) / safeZoom
  const clamp = (value: number, size: number) => Math.min(size - side, Math.max(0, value - side / 2))
  return { x: clamp(centerX, imageWidth), y: clamp(centerY, imageHeight), side }
}

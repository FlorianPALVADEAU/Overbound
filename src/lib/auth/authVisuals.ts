import { COVER } from '@/constants/coverImages'

export const AUTH_VISUALS = COVER.auth

export function pickRandomAuthVisual() {
  const randomIndex = Math.floor(Math.random() * AUTH_VISUALS.length)
  return AUTH_VISUALS[randomIndex] ?? AUTH_VISUALS[0]
}

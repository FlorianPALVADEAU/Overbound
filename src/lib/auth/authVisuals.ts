export const AUTH_VISUALS = [
  '/images/images/young-man-carrying-a-swingy-chain-to-his-neck.webp',
  '/images/images/young-lady-ramping-below-barbed-wires.webp',
  '/images/images/tree-participants-running.webp',
  '/images/images/participants-carrying-wooden-logs-going-uphill.webp',
  '/images/images/old-man-carrying-chains.webp',
  '/images/images/man-looking-determined-staring-at-the-floor.webp',
  '/images/images/lot-of-runner-going-everywhere-with-chains-on-their-necks.webp',
  '/images/images/ladies-with-logs-on-their-shoulders.webp',
  '/images/images/a-young-man-lifting-a-tire-from-the-ground.webp',
] as const

export function pickRandomAuthVisual() {
  const randomIndex = Math.floor(Math.random() * AUTH_VISUALS.length)
  return AUTH_VISUALS[randomIndex] ?? AUTH_VISUALS[0]
}

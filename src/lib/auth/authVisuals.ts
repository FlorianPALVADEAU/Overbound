export const AUTH_VISUALS = [
  '/images/images/young-man-carrying-a-swingy-chain-to-his-neck.avif',
  '/images/images/young-lady-ramping-below-barbed-wires.avif',
  '/images/images/tree-participants-running.avif',
  '/images/images/participants-carrying-wooden-logs-going-uphill.avif',
  '/images/images/old-man-carrying-chains.avif',
  '/images/images/man-looking-determined-staring-at-the-floor.avif',
  '/images/images/lot-of-runner-going-everywhere-with-chains-on-their-necks.avif',
  '/images/images/ladies-with-logs-on-their-shoulders.avif',
  '/images/images/a-young-man-lifting-a-tire-from-the-ground.avif',
] as const

export function pickRandomAuthVisual() {
  const randomIndex = Math.floor(Math.random() * AUTH_VISUALS.length)
  return AUTH_VISUALS[randomIndex] ?? AUTH_VISUALS[0]
}

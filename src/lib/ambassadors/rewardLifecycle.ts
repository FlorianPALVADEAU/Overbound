/** A reward expires when its season ends (`expires_at`). Null means no expiry. */
export function isAmbassadorRewardExpired(expiresAt: string | null | undefined, now = new Date()): boolean {
  return Boolean(expiresAt && new Date(expiresAt).getTime() <= now.getTime())
}

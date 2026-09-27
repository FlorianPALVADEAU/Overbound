import type { AmbassadorRewardStatus } from '@/types/Ambassador'

export function isAmbassadorRewardExpired(expiresAt: string | null | undefined, now = new Date()): boolean {
  return Boolean(expiresAt && new Date(expiresAt).getTime() <= now.getTime())
}

export function canClaimAmbassadorReward(
  status: AmbassadorRewardStatus,
  expiresAt: string | null | undefined,
  now = new Date(),
): boolean {
  return status === 'earned' && !isAmbassadorRewardExpired(expiresAt, now)
}

export function getCurrentProgramYear(now = new Date()): number {
  return Number(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
  }).format(now))
}

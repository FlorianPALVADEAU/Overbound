import type { AmbassadorRewardStatus } from '@/types/Ambassador'

export const resolveRewardStatus = (value: string | null | undefined): AmbassadorRewardStatus => {
  const normalized = String(value || '').toLowerCase()
  if (normalized === 'claimed') return 'claimed'
  if (normalized === 'fulfilled') return 'fulfilled'
  if (normalized === 'cancelled') return 'cancelled'
  return 'earned'
}

export const deriveNameFromEmail = (email: string): string => {
  const local = email.split('@')[0] || email
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export const formatRecruitName = (
  isSharedOrder: boolean,
  displayName: string | null | undefined,
  email: string | null | undefined,
): string => {
  if (isSharedOrder) {
    if (email) return deriveNameFromEmail(email)
    return displayName?.trim() || 'Utilisateur'
  }
  return displayName?.trim() || (email ? deriveNameFromEmail(email) : 'Utilisateur')
}

export const formatLeaderboardName = (
  name: { first_name?: string | null; last_name?: string | null } | null | undefined,
  profileId: string,
): string => {
  const first = name?.first_name?.trim() ?? ''
  const last = name?.last_name?.trim() ?? ''
  if (!first) {
    return `Ambassadeur ${profileId.slice(0, 4).toUpperCase()}`
  }
  const lastInitial = last ? `${last.charAt(0).toUpperCase()}.` : ''
  return [first, lastInitial].filter(Boolean).join(' ').trim()
}

export const getTicketDetails = (
  value: unknown,
): { name: string | null; race_format: string | null; race_name: string | null } => {
  const rawTicket = Array.isArray(value) ? value[0] : value
  if (!rawTicket || typeof rawTicket !== 'object') {
    return { name: null, race_format: null, race_name: null }
  }

  const ticket = rawTicket as {
    name?: string | null
    race_format?: string | null
    race?: unknown
  }

  const rawRace = Array.isArray(ticket.race) ? ticket.race[0] : ticket.race
  const raceName =
    rawRace && typeof rawRace === 'object'
      ? ((rawRace as { name?: string | null }).name ?? null)
      : null

  return {
    name: ticket.name ?? null,
    race_format: ticket.race_format ?? null,
    race_name: raceName,
  }
}

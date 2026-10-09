import { hasAmbassadorAccess } from '@/lib/ambassadors/access'

export type AccountSpaceId = 'admin' | 'volunteer' | 'ambassador'

export interface AccountSpace {
  id: AccountSpaceId
  label: string
  description: string
  href: string
}

/** Flattens role claims (string, comma list, array, nested metadata) into lowercase tokens. */
export const normalizeRoles = (candidates: unknown[]): string[] =>
  candidates.flatMap((value) => {
    if (!value) return []
    const list = Array.isArray(value) ? value : String(value).split(',')
    return list.map((role) => String(role).trim().toLowerCase()).filter(Boolean)
  })

export interface AccountAccess {
  isAdmin: boolean
  isVolunteer: boolean
  hasDashboardAccess: boolean
  hasAmbassadorAccess: boolean
}

export const resolveAccountAccess = (roles: string[], email: string | null | undefined): AccountAccess => {
  const isAdmin = roles.some((role) => role.includes('admin'))
  const isVolunteer = roles.includes('volunteer')
  return {
    isAdmin,
    isVolunteer,
    hasDashboardAccess: isAdmin || isVolunteer || roles.includes('staff'),
    hasAmbassadorAccess: hasAmbassadorAccess({
      role: roles.includes('ambassador') ? 'ambassador' : null,
      email: email ?? null,
    }),
  }
}

/** Extra spaces the holder can enter from the account (never shown to regular participants). */
export const getAccountSpaces = (access: AccountAccess): AccountSpace[] => {
  const spaces: AccountSpace[] = []

  if (access.hasDashboardAccess) {
    spaces.push(
      access.isVolunteer && !access.isAdmin
        ? {
            id: 'volunteer',
            label: 'Espace bénévole',
            description: 'Check-in et planning du jour J',
            href: '/dashboard',
          }
        : {
            id: 'admin',
            label: 'Administration',
            description: 'Événements, inscriptions, opérations',
            href: '/dashboard',
          },
    )
  }

  if (access.hasAmbassadorAccess) {
    spaces.push({
      id: 'ambassador',
      label: 'Espace ambassadeur',
      description: 'Ton code, tes points et tes récompenses',
      href: '/ambassadors/dashboard',
    })
  }

  return spaces
}

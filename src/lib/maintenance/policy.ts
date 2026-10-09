export interface MaintenanceSettings {
  enabled: boolean
  message: string | null
  estimated_end: string | null
}

export const MAINTENANCE_PATH = '/maintenance'

const EXEMPT_PREFIXES = ['/auth', '/api/auth', MAINTENANCE_PATH, '/_next']
const EXEMPT_FILES = ['/robots.txt', '/sitemap.xml']

/** Paths that stay reachable for everybody while maintenance is on (login flow, the maintenance screen itself). */
export const isMaintenanceExemptPath = (pathname: string): boolean =>
  EXEMPT_FILES.includes(pathname) ||
  EXEMPT_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

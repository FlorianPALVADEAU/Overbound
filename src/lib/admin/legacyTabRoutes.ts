/**
 * Old back-office links looked like `/dashboard?tab=members&event=…`. E-mails and push notifications
 * already sent still carry them, so they keep working by redirecting to the page that replaced the tab.
 */
const TAB_ROUTES: Record<string, string> = {
  overview: '/dashboard',
  events: '/dashboard/events',
  ambassadors: '/dashboard/ambassadors',
  'distribution-lists': '/dashboard/distribution-lists',
  upsells: '/dashboard/upsells',
  logs: '/dashboard/logs',
  races: '/dashboard/races',
  obstacles: '/dashboard/obstacles',
  promocodes: '/dashboard/promocodes',
  promotions: '/dashboard/promotions',
  groups: '/dashboard/groups',
  bootcamps: '/dashboard/bootcamps',
  users: '/dashboard/users',
  tickets: '/dashboard/tickets',
  checkin: '/dashboard/checkin',
  emails: '/dashboard/emails',
  'lucky-wheel': '/dashboard/lucky-wheel',
  maintenance: '/dashboard/maintenance',
  volunteers: '/dashboard/volunteers',
  'b2b-quotes': '/dashboard/b2b-quotes',
  members: '/dashboard/participants',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Where a legacy `?tab=` link leads, or null when it is not a legacy link. Extra parameters (event, search) are kept. */
export function resolveLegacyTabRoute(params: { get(name: string): string | null }): string | null {
  const tab = params.get('tab')
  const base = tab ? TAB_ROUTES[tab] : undefined
  if (!base) return null

  const eventParam = params.get('event')
  const eventId = eventParam && UUID.test(eventParam) ? eventParam : null
  if (eventId && (tab === 'members' || tab === 'tickets')) {
    return `/dashboard/events/${eventId}/${tab === 'members' ? 'participants' : 'tickets'}`
  }

  const next = new URLSearchParams()
  if (eventId) next.set('event', eventId)
  const search = params.get('search')
  if (search) next.set('search', search)
  const query = next.toString()
  return query ? `${base}?${query}` : base
}

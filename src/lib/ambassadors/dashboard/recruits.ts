import type { AmbassadorPointsStatus, AmbassadorRecruitRow } from '@/types/Ambassador'
import { formatRecruitName, getTicketDetails } from '@/lib/ambassadors/dashboardHelpers'
import { resolvePaymentStatus, resolveRaceFormat } from '@/lib/ambassadors/program'

export interface RecruitRegistration {
  id: string
  user_id: string | null
  email: string | null
  created_at: string | null
  order_id: string | null
  ticket: unknown
}

export interface RecruitPointEvent {
  registration_id: string
  points: number
  race_format: string
  revoked_at: string | null
}

export interface RecruitRowsInput {
  registrations: RecruitRegistration[]
  orderStatuses: ReadonlyMap<string, string | null>
  profileNames: ReadonlyMap<string, string | null>
  pointEvents: RecruitPointEvent[]
  /** Referrals registered before this instant and without a ledger event belong to a closed season. */
  seasonStartedAt: string
}

const resolvePointsStatus = (event: RecruitPointEvent | undefined): AmbassadorPointsStatus => {
  if (!event) return 'none'
  return event.revoked_at ? 'revoked' : 'counted'
}

const timeOf = (value: string | null) => (value ? new Date(value).getTime() : 0)

/**
 * Referral rows of the running season. Points come from the ledger only: a referral without a
 * ledger event (unpaid, own registration, free order) shows 0, never an inferred value.
 */
export function buildRecruitRows({
  registrations,
  orderStatuses,
  profileNames,
  pointEvents,
  seasonStartedAt,
}: RecruitRowsInput): AmbassadorRecruitRow[] {
  const eventByRegistration = new Map(pointEvents.map((event) => [event.registration_id, event]))

  const registrationsPerOrder = new Map<string, number>()
  for (const registration of registrations) {
    if (registration.order_id) {
      registrationsPerOrder.set(registration.order_id, (registrationsPerOrder.get(registration.order_id) ?? 0) + 1)
    }
  }

  return registrations
    .filter((registration) => eventByRegistration.has(registration.id) || timeOf(registration.created_at) >= new Date(seasonStartedAt).getTime())
    .map((registration): AmbassadorRecruitRow => {
      const event = eventByRegistration.get(registration.id)
      const pointsStatus = resolvePointsStatus(event)
      const ticket = getTicketDetails(registration.ticket)
      const orderStatus = registration.order_id ? orderStatuses.get(registration.order_id) : null

      return {
        id: registration.id,
        name: formatRecruitName(
          registration.order_id ? (registrationsPerOrder.get(registration.order_id) ?? 1) > 1 : false,
          registration.user_id ? profileNames.get(registration.user_id) : null,
          registration.email,
        ),
        signup_date: registration.created_at,
        race_format: resolveRaceFormat(event?.race_format ?? ticket.race_format),
        payment_status: resolvePaymentStatus(orderStatus),
        points: pointsStatus === 'counted' && event ? event.points : 0,
        points_status: pointsStatus,
        order_id: registration.order_id,
      }
    })
    .sort((a, b) => timeOf(b.signup_date) - timeOf(a.signup_date))
}

import { sendInactiveUserEmail, sendAbandonedCheckoutEmail } from '@/lib/email'
import { getLastEmailLog, recordEmailLog } from '@/lib/email/emailLogs'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getMarketingOptInRecipients, type MarketingRecipient } from '@/lib/email/marketing'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://overbound.com'

export async function sendInactiveUserWinback() {
  try {
    const admin = supabaseAdmin()
    const recipients = await getMarketingOptInRecipients()
    if (recipients.length === 0) {
      return 0
    }

    const userIds = recipients
      .map((recipient) => recipient.userId)
      .filter((value): value is string => typeof value === 'string' && value.length > 0)

    const { data: registrations } = await admin
      .from('registrations')
      .select('user_id, created_at, event:events(title, slug)')
      .in('user_id', userIds)
      .order('created_at', { ascending: false })

    const lastRegistrationByUser = new Map<string, { created_at: string; event?: any }>()
    for (const registration of registrations ?? []) {
      if (!lastRegistrationByUser.has(registration.user_id)) {
        lastRegistrationByUser.set(registration.user_id, {
          created_at: registration.created_at,
          event: Array.isArray(registration.event)
            ? registration.event[0] ?? null
            : registration.event ?? null,
        })
      }
    }

    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000

    let sent = 0

    await Promise.all(
      recipients.map(async (recipient) => {
        if (!recipient.userId) {
          return
        }

        const lastRegistration = lastRegistrationByUser.get(recipient.userId)
        const lastCreated = lastRegistration?.created_at
        if (lastCreated && new Date(lastCreated).getTime() > ninetyDaysAgo) {
          return
        }

        const alreadySent = await getLastEmailLog({
          userId: recipient.userId,
          emailType: 'reactivation_inactive',
        })

        if (alreadySent) {
          return
        }

        await sendInactiveUserEmail({
          to: recipient.email,
          fullName: recipient.fullName,
          lastEventTitle: lastRegistration?.event?.title ?? null,
          eventsUrl: `${SITE_URL}/events`,
          highlightEventTitle: lastRegistration?.event?.title ?? null,
          highlightEventUrl: lastRegistration?.event?.slug
            ? `${SITE_URL}/events/${lastRegistration.event.slug}`
            : undefined,
        })

        await recordEmailLog({
          userId: recipient.userId,
          email: recipient.email,
          emailType: 'reactivation_inactive',
        })

        sent += 1
      }),
    )

    return sent
  } catch (error) {
    console.error('[reactivation] inactive winback error', error)
    return 0
  }
}

export async function sendAbandonedCheckoutReminders() {
  try {
    const admin = supabaseAdmin()
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()

    const { data: pendingOrders, error } = await admin
      .from('orders')
      .select('id, user_id, email, created_at, amount_total, currency')
      .eq('status', 'pending')
      .lt('created_at', twoDaysAgo)

    if (error) {
      console.error('[reactivation] pending orders fetch error', error)
      return 0
    }

    const orders = (pendingOrders ?? []).filter((order) => Boolean(order.email && order.user_id))

    if (orders.length === 0) {
      return 0
    }

    const orderIds = orders.map((order) => order.id)

    const { data: registrationRows } = await admin
      .from('registrations')
      .select('order_id, event:events(title, slug), ticket:tickets(name)')
      .in('order_id', orderIds)

    const registrationByOrder = new Map<string, any[]>()
    for (const row of registrationRows ?? []) {
      const list = registrationByOrder.get(row.order_id) ?? []
      list.push(row)
      registrationByOrder.set(row.order_id, list)
    }

    const authUsers = await loadAuthUsers(Array.from(new Set(orders.map((order) => order.user_id))))

    let sent = 0

    for (const order of orders) {
      const email = order.email
      if (!email) continue

      const alreadySent = await getLastEmailLog({
        userId: order.user_id,
        emailType: 'reactivation_abandoned_checkout',
        contextFilters: { order_id: order.id },
      })

      if (alreadySent) {
        continue
      }

      const registration = registrationByOrder.get(order.id)?.[0] ?? null

      const event = registration?.event
        ? Array.isArray(registration.event)
          ? registration.event[0] ?? null
          : registration.event
        : null

      await sendAbandonedCheckoutEmail({
        to: email,
        fullName: authUsers.get(order.user_id)?.user_metadata?.full_name ?? null,
        eventTitle: event?.title ?? 'ton prochain challenge',
        ticketName: registration?.ticket
          ? Array.isArray(registration.ticket)
            ? registration.ticket[0]?.name ?? null
            : registration.ticket.name ?? null
          : null,
        resumeUrl: `${SITE_URL}/events/${event?.slug ?? ''}/register`,
        incentive: order.amount_total
          ? `Tu as déjà réservé un total de ${(order.amount_total / 100).toLocaleString('fr-FR', {
              style: 'currency',
              currency: (order.currency ?? 'EUR').toUpperCase(),
            })}. Finalise ton inscription en un clic.`
          : null,
      })

      await recordEmailLog({
        userId: order.user_id,
        email,
        emailType: 'reactivation_abandoned_checkout',
        context: { order_id: order.id },
      })

      sent += 1
    }

    return sent
  } catch (error) {
    console.error('[reactivation] abandoned checkout error', error)
    return 0
  }
}

async function loadAuthUsers(userIds: string[]) {
  const admin = supabaseAdmin()
  const perPage = 1000
  const map = new Map<string, any>()

  for (let page = 1; ; page += 1) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage })
    const users = data.users ?? []

    for (const user of users) {
      if (userIds.includes(user.id)) {
        map.set(user.id, user)
      }
    }

    if (users.length < perPage || map.size >= userIds.length) {
      break
    }
  }

  return map
}

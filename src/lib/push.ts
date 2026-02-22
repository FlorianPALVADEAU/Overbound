import webpush from 'web-push'
import { supabaseAdmin } from '@/lib/supabase/server'

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const ADMIN_PUSH_EMAILS = (process.env.ADMIN_PUSH_EMAILS || 'florian.plvd@gmail.com')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:contact@overbound-race.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
  )
}

export async function sendAdminPushNotification(payload: {
  title: string
  body: string
  url?: string
}) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[push] Missing VAPID keys')
    return
  }

  const admin = supabaseAdmin()
  const { data: subscriptions, error } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, email')
    .in('email', ADMIN_PUSH_EMAILS)

  if (error) {
    console.error('[push] failed to load subscriptions', error)
    return
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? '/',
  })

  for (const sub of subscriptions || []) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        notificationPayload,
      )
    } catch (err: any) {
      const statusCode = err?.statusCode || err?.status
      console.error('[push] send error', statusCode, err?.body || err)
      if (statusCode === 404 || statusCode === 410) {
        await admin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      }
    }
  }
}

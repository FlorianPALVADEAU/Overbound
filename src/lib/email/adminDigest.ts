import { supabaseAdmin } from '@/lib/supabase/server'
import { getLastEmailLog, recordEmailLog } from '@/lib/email/emailLogs'
import { sendAdminDigestEmail } from '@/lib/email'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://overbound.com'
const ADMIN_LOGS_URL = `${SITE_URL}/admin?tab=logs`

interface AdminRecipient {
  userId: string
  email: string
  fullName?: string | null
}

interface AdminDigestOptions {
  lookbackMinutes?: number
}

export async function sendAdminDigest({ lookbackMinutes = 60 }: AdminDigestOptions = {}) {
  if (!process.env.RESEND_API_KEY) {
    return 0
  }

  const admin = supabaseAdmin()

  const recipients = await getAdminRecipients(admin)
  if (recipients.length === 0) {
    return 0
  }

  const since = new Date(Date.now() - lookbackMinutes * 60 * 1000)

  const { data: logs, error } = await admin
    .from('admin_request_logs')
    .select('created_at, summary, status_code, user_email, action_type, path, duration_ms')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[admin digest] logs fetch error', error)
    return 0
  }

  const logItems = logs ?? []
  const totalActions = logItems.length
  const totalErrors = logItems.filter((log) => (log.status_code ?? 0) >= 400).length

  const payloadItems = logItems.map((log) => ({
    timestamp: log.created_at,
    summary: log.summary ?? 'Action effectuée',
    statusCode: log.status_code ?? null,
    userEmail: log.user_email ?? null,
    actionType: log.action_type ?? null,
    path: log.path ?? '',
    durationMs: log.duration_ms ?? null,
  }))

  const periodLabel = `${since.toLocaleString('fr-FR')} → ${new Date().toLocaleString('fr-FR')}`

  await Promise.all(
    recipients.map(async (recipient) => {
      const alreadySent = await getLastEmailLog({
        userId: recipient.userId,
        emailType: 'admin_digest',
        contextFilters: { period_label: periodLabel },
      })

      if (alreadySent) {
        return
      }

      await sendAdminDigestEmail({
        to: recipient.email,
        periodLabel,
        totalActions,
        totalErrors,
        items: payloadItems,
        logsUrl: ADMIN_LOGS_URL,
      })

      await recordEmailLog({
        userId: recipient.userId,
        email: recipient.email,
        emailType: 'admin_digest',
        context: {
          period_label: periodLabel,
        },
      })
    }),
  )

  return recipients.length
}

const getAdminRecipients = async (admin = supabaseAdmin()): Promise<AdminRecipient[]> => {
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'admin')

  if (error || !profiles || profiles.length === 0) {
    return []
  }

  const adminIds = profiles.map((profile) => profile.id)
  const authUsers = await loadAuthUsers(adminIds)

  return profiles
    .map((profile) => {
      const authUser = authUsers.get(profile.id)
      if (!authUser?.email) {
        return null
      }

      return {
        userId: profile.id,
        email: authUser.email,
        fullName: (profile as Record<string, any>)?.full_name ?? authUser.user_metadata?.full_name ?? null,
      }
    })
    .filter(Boolean) as AdminRecipient[]
}

const loadAuthUsers = async (userIds: string[]) => {
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

import { sendOnboardingEmail, sendProfileCompletionReminderEmail } from '@/lib/email'
import { getLastEmailLog, recordEmailLog } from '@/lib/email/emailLogs'

interface ProfileSnapshot {
  full_name?: string | null
  phone?: string | null
  date_of_birth?: string | null
}

interface EngagementContext {
  userId: string
  email: string
  fullName?: string | null
  userCreatedAt?: string | null
  profile?: ProfileSnapshot | null
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://overbound-race.com'

const PROFILE_FIELD_LABELS: Record<keyof ProfileSnapshot, string> = {
  full_name: 'Nom complet',
  phone: 'Téléphone',
  date_of_birth: 'Date de naissance',
}

const PROFILE_REMINDER_COOLDOWN_DAYS = 7

const ms = (days: number) => days * 24 * 60 * 60 * 1000

export async function processAccountEngagementEmails(context: EngagementContext) {
  if (!process.env.RESEND_API_KEY) {
    return
  }

  try {
    await ensureOnboardingEmail(context)
  } catch (error) {
    console.error('[engagement] onboarding email error', error)
  }

  try {
    await ensureProfileReminderEmail(context)
  } catch (error) {
    console.error('[engagement] profile reminder email error', error)
  }
}

async function ensureOnboardingEmail(context: EngagementContext) {
  if (!context.email) return

  const alreadySent = await getLastEmailLog({
    userId: context.userId,
    emailType: 'onboarding',
  })

  if (alreadySent) {
    return
  }

  const accountUrl = `${BASE_URL}/account`
  const eventsUrl = `${BASE_URL}/events`
  const blogUrl = `${BASE_URL}/blog`

  await sendOnboardingEmail({
    to: context.email,
    fullName: context.fullName,
    accountUrl,
    eventsUrl,
    blogUrl,
  })

  await recordEmailLog({
    userId: context.userId,
    email: context.email,
    emailType: 'onboarding',
  })
}

async function ensureProfileReminderEmail(context: EngagementContext) {
  if (!context.email || !context.profile) {
    return
  }

  const missingFields = getMissingProfileFields(context.profile)
  if (missingFields.length === 0) {
    return
  }

  const lastReminder = await getLastEmailLog({
    userId: context.userId,
    emailType: 'profile_nudge',
  })

  if (lastReminder) {
    const lastSent = new Date(lastReminder.sent_at).getTime()
    if (!Number.isNaN(lastSent)) {
      const now = Date.now()
      if (now - lastSent < ms(PROFILE_REMINDER_COOLDOWN_DAYS)) {
        return
      }
    }
  }

  const accountUrl = `${BASE_URL}/account`

  await sendProfileCompletionReminderEmail({
    to: context.email,
    fullName: context.fullName,
    accountUrl,
    missingFields,
  })

  await recordEmailLog({
    userId: context.userId,
    email: context.email,
    emailType: 'profile_nudge',
    context: { missing_fields: missingFields },
  })
}

function getMissingProfileFields(profile: ProfileSnapshot) {
  const missing: string[] = []
  ;(Object.keys(PROFILE_FIELD_LABELS) as Array<keyof ProfileSnapshot>).forEach((key) => {
    const value = profile[key]
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      missing.push(PROFILE_FIELD_LABELS[key])
    }
  })
  return missing
}

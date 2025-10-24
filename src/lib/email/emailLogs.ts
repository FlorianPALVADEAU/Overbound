import { supabaseAdmin } from '@/lib/supabase/server'

export type EngagementEmailType =
  | 'onboarding'
  | 'profile_nudge'
  | 'event_prep'
  | 'post_event_thankyou'
  | 'document_required'
  | 'document_approved'
  | 'document_rejected'
  | 'marketing_new_event'
  | 'marketing_price_change'
  | 'marketing_promo'
  | 'reactivation_inactive'
  | 'reactivation_abandoned_checkout'
  | 'event_updated'
  | 'admin_digest'
  | 'volunteer_recruitment'
  | 'volunteer_assignment'

interface EmailLogRecord {
  id: string
  user_id: string
  email: string
  email_type: EngagementEmailType
  context: Record<string, unknown> | null
  sent_at: string
}

export async function recordEmailLog(params: {
  userId: string
  email: string
  emailType: EngagementEmailType
  context?: Record<string, unknown>
}) {
  const admin = supabaseAdmin()

  await admin.from('email_logs').insert({
    user_id: params.userId,
    email: params.email,
    email_type: params.emailType,
    context: params.context ?? null,
  })
}

export async function getLastEmailLog(params: {
  userId: string
  emailType: EngagementEmailType
  contextFilters?: Record<string, unknown>
}) {
  const admin = supabaseAdmin()

  let query = admin
    .from('email_logs')
    .select('*')
    .eq('user_id', params.userId)
    .eq('email_type', params.emailType)
    .order('sent_at', { ascending: false })
    .limit(1)

  if (params.contextFilters) {
    query = query.contains('context', params.contextFilters)
  }

  const { data, error } = await query

  if (error) {
    console.error('[emailLogs] failed to fetch log', error)
    return null
  }

  return (data?.[0] as EmailLogRecord | undefined) ?? null
}

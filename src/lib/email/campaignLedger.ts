import { supabaseAdmin } from '@/lib/supabase/server'

export type SendStatus = 'sent' | 'failed_permanent' | 'failed_transient'

export interface SendOutcome {
  campaignKey: string
  email: string
  userId?: string | null
  status: SendStatus
  provider: string
  messageId?: string | null
  error?: string | null
  attempts: number
}

export interface CampaignLedger {
  /** Addresses a rerun must skip: already sent. Failed ones are retried (a systemic error must not poison the campaign). */
  loadFinished: (campaignKey: string) => Promise<Set<string>>
  record: (outcome: SendOutcome) => Promise<{ ok: true } | { ok: false; message: string }>
}

const PAGE_SIZE = 1000

export const supabaseCampaignLedger: CampaignLedger = {
  async loadFinished(campaignKey) {
    const admin = supabaseAdmin()
    const finished = new Set<string>()

    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await admin
        .from('marketing_sends')
        .select('email')
        .eq('campaign_key', campaignKey)
        .eq('status', 'sent')
        .order('email')
        .range(from, from + PAGE_SIZE - 1)

      // Throws: without the ledger a rerun could mail everyone twice.
      if (error) {
        throw new Error(`[campaign] ledger read failed: ${error.message}`)
      }
      for (const row of (data ?? []) as Array<{ email: string }>) {
        finished.add(row.email)
      }
      if ((data ?? []).length < PAGE_SIZE) {
        return finished
      }
    }
  },

  async record(outcome) {
    const { error } = await supabaseAdmin()
      .from('marketing_sends')
      .upsert(
        {
          campaign_key: outcome.campaignKey,
          email: outcome.email.trim().toLowerCase(),
          user_id: outcome.userId ?? null,
          status: outcome.status,
          provider: outcome.provider,
          message_id: outcome.messageId ?? null,
          error: outcome.error ?? null,
          attempts: outcome.attempts,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'campaign_key,email' },
      )

    return error ? { ok: false, message: error.message } : { ok: true }
  },
}

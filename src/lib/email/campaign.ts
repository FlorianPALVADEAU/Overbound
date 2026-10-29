import { filterSuppressed } from '@/lib/email/suppression'
import { supabaseCampaignLedger, type CampaignLedger } from '@/lib/email/campaignLedger'
import type { SendResult } from '@/lib/email/transport/types'

export interface CampaignRecipient {
  email: string
  userId?: string | null
  fullName?: string | null
}

export interface CampaignFailure {
  email: string
  error: string
}

export interface CampaignReport {
  /** Distinct addresses given to the campaign. */
  total: number
  sent: number
  failed: number
  /** Skipped because a previous run already sent them. */
  alreadyDone: number
  /** Dropped because of a bounce or complaint. */
  suppressed: number
  /** Left for another run when the time budget ran out. */
  remaining: number
  /** Mails sent whose ledger row could not be written: a rerun may mail these again. */
  ledgerErrors: number
  /** Set when the run stopped because every recent send failed (misconfiguration, outage). */
  aborted: string | null
  failures: CampaignFailure[]
}

export interface RunCampaignOptions<R extends CampaignRecipient> {
  /** Identifies the campaign for resuming; the same key means the same mail. */
  campaignKey: string
  recipients: R[]
  send: (recipient: R) => Promise<SendResult>
  /** Name stored in the ledger, e.g. "ses". */
  provider: string
  budgetMs?: number
  ratePerSecond?: number
  maxAttempts?: number
}

export interface RunCampaignDeps {
  ledger?: CampaignLedger
  filter?: <T extends { email: string }>(recipients: T[]) => Promise<T[]>
  sleep?: (ms: number) => Promise<void>
  now?: () => number
}

const DEFAULT_BUDGET_MS = 45_000
const DEFAULT_RATE_PER_SECOND = 14
const DEFAULT_MAX_ATTEMPTS = 3
const ABORT_AFTER_FAILED_CHUNKS = 2
const RETRY_BASE_DELAY_MS = 500

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function distinctByEmail<R extends CampaignRecipient>(recipients: R[]): R[] {
  const byEmail = new Map<string, R>()
  for (const recipient of recipients) {
    const email = recipient.email.trim().toLowerCase()
    if (email && !byEmail.has(email)) {
      byEmail.set(email, { ...recipient, email })
    }
  }
  return Array.from(byEmail.values())
}

/**
 * Sends one campaign to many recipients within a time budget.
 * - Suppressed addresses are dropped first; if the list cannot be read the campaign aborts.
 * - A resumable ledger skips addresses already handled; if it cannot be read the campaign aborts.
 * - Sends are paced (ratePerSecond) and transient failures are retried with backoff;
 *   permanent failures are recorded and never retried.
 * Delivery is at least once: a crash between a send and its ledger row can repeat one mail.
 */
export async function runCampaign<R extends CampaignRecipient>(
  options: RunCampaignOptions<R>,
  deps: RunCampaignDeps = {},
): Promise<CampaignReport> {
  const ledger = deps.ledger ?? supabaseCampaignLedger
  const filter = deps.filter ?? filterSuppressed
  const sleep = deps.sleep ?? defaultSleep
  const now = deps.now ?? Date.now
  const budgetMs = options.budgetMs ?? DEFAULT_BUDGET_MS
  const ratePerSecond = options.ratePerSecond ?? DEFAULT_RATE_PER_SECOND
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS

  const distinct = distinctByEmail(options.recipients)
  const eligible = await filter(distinct)
  const finished = await ledger.loadFinished(options.campaignKey)
  const todo = eligible.filter((recipient) => !finished.has(recipient.email))

  const report: CampaignReport = {
    total: distinct.length,
    sent: 0,
    failed: 0,
    alreadyDone: eligible.length - todo.length,
    suppressed: distinct.length - eligible.length,
    remaining: 0,
    ledgerErrors: 0,
    aborted: null,
    failures: [],
  }

  const startedAt = now()

  const record = async (recipient: R, outcome: Pick<SendResultOutcome, 'status' | 'messageId' | 'error' | 'attempts'>) => {
    const result = await ledger.record({
      campaignKey: options.campaignKey,
      email: recipient.email,
      userId: recipient.userId ?? null,
      provider: options.provider,
      ...outcome,
    })
    if (!result.ok) {
      report.ledgerErrors += 1
      console.error('[campaign] ledger write failed', recipient.email, result.message)
    }
  }

  const deliver = async (recipient: R) => {
    for (let attempt = 1; ; attempt += 1) {
      let result: SendResult
      try {
        result = await options.send(recipient)
      } catch (error) {
        result = {
          ok: false,
          error: { kind: 'transient', code: 'THROWN', message: error instanceof Error ? error.message : String(error) },
        }
      }

      if (result.ok) {
        report.sent += 1
        await record(recipient, { status: 'sent', messageId: result.messageId, attempts: attempt })
        return
      }

      if (result.error.kind === 'transient' && attempt < maxAttempts) {
        await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1))
        continue
      }

      report.failed += 1
      report.failures.push({ email: recipient.email, error: `${result.error.code}: ${result.error.message}` })
      await record(recipient, {
        status: result.error.kind === 'permanent' ? 'failed_permanent' : 'failed_transient',
        error: `${result.error.code}: ${result.error.message}`,
        attempts: attempt,
      })
      return
    }
  }

  let failedChunks = 0

  for (let index = 0; index < todo.length; index += ratePerSecond) {
    if (index > 0 && now() - startedAt + 1000 > budgetMs) {
      report.remaining = todo.length - index
      break
    }

    const chunkStartedAt = now()
    const sentBefore = report.sent
    await Promise.all(todo.slice(index, index + ratePerSecond).map(deliver))

    // Two chunks in a row without a single success: stop instead of burning through the audience.
    failedChunks = report.sent === sentBefore ? failedChunks + 1 : 0
    if (failedChunks >= ABORT_AFTER_FAILED_CHUNKS) {
      report.remaining = todo.length - (index + ratePerSecond)
      report.aborted = report.failures[report.failures.length - 1]?.error ?? 'Every send failed'
      break
    }

    const isLastChunk = index + ratePerSecond >= todo.length
    const elapsed = now() - chunkStartedAt
    if (!isLastChunk && elapsed < 1000) {
      await sleep(1000 - elapsed)
    }
  }

  return report
}

type SendResultOutcome = Parameters<CampaignLedger['record']>[0]

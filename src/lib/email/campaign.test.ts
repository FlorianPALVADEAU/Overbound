import { describe, expect, it, vi } from 'vitest'
import { runCampaign, type CampaignRecipient } from './campaign'
import type { CampaignLedger, SendOutcome } from './campaignLedger'
import type { SendResult } from './transport/types'

const ok = (id = 'm1'): SendResult => ({ ok: true, messageId: id })
const fail = (kind: 'transient' | 'permanent', code = 'X'): SendResult => ({
  ok: false,
  error: { kind, code, message: `${code} message` },
})

function fakeLedger(finished: string[] = [], recordResult: { ok: true } | { ok: false; message: string } = { ok: true }) {
  const outcomes: SendOutcome[] = []
  const ledger: CampaignLedger = {
    loadFinished: vi.fn(async () => new Set(finished)),
    record: vi.fn(async (outcome) => {
      outcomes.push(outcome)
      return recordResult
    }),
  }
  return { ledger, outcomes }
}

const people = (...emails: string[]): CampaignRecipient[] => emails.map((email) => ({ email }))
const passthrough = async <T,>(recipients: T[]) => recipients
const instantDeps = (ledger: CampaignLedger, extra = {}) => ({
  ledger,
  filter: passthrough,
  sleep: async () => {},
  ...extra,
})

describe('runCampaign', () => {
  it('sends to every distinct address once and records each outcome', async () => {
    const { ledger, outcomes } = fakeLedger()
    const send = vi.fn(async () => ok('id-1'))

    const report = await runCampaign(
      { campaignKey: 'c1', provider: 'ses', send, recipients: people('A@x.fr', 'a@x.fr', 'b@x.fr') },
      instantDeps(ledger),
    )

    expect(send).toHaveBeenCalledTimes(2)
    expect(report).toMatchObject({ total: 2, sent: 2, failed: 0, remaining: 0, alreadyDone: 0 })
    expect(outcomes.map((o) => [o.email, o.status, o.provider, o.messageId])).toEqual([
      ['a@x.fr', 'sent', 'ses', 'id-1'],
      ['b@x.fr', 'sent', 'ses', 'id-1'],
    ])
  })

  it('skips addresses a previous run already sent', async () => {
    const { ledger } = fakeLedger(['a@x.fr'])
    const send = vi.fn(async () => ok())

    const report = await runCampaign(
      { campaignKey: 'c1', provider: 'ses', send, recipients: people('a@x.fr', 'b@x.fr') },
      instantDeps(ledger),
    )

    expect(send).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ email: 'b@x.fr' }))
    expect(report).toMatchObject({ sent: 1, alreadyDone: 1 })
  })

  it('never sends to a suppressed address', async () => {
    const { ledger } = fakeLedger()
    const send = vi.fn(async () => ok())
    const filter = async <T extends { email: string }>(recipients: T[]) =>
      recipients.filter((r) => r.email !== 'gone@x.fr')

    const report = await runCampaign(
      { campaignKey: 'c1', provider: 'ses', send, recipients: people('gone@x.fr', 'ok@x.fr') },
      instantDeps(ledger, { filter }),
    )

    expect(send).toHaveBeenCalledTimes(1)
    expect(report.suppressed).toBe(1)
  })

  it('retries a transient failure, then succeeds', async () => {
    const { ledger, outcomes } = fakeLedger()
    const send = vi
      .fn<() => Promise<SendResult>>()
      .mockResolvedValueOnce(fail('transient', 'Throttling'))
      .mockResolvedValueOnce(ok('retried'))

    const report = await runCampaign(
      { campaignKey: 'c1', provider: 'ses', send, recipients: people('a@x.fr') },
      instantDeps(ledger),
    )

    expect(send).toHaveBeenCalledTimes(2)
    expect(report).toMatchObject({ sent: 1, failed: 0 })
    expect(outcomes[0]).toMatchObject({ status: 'sent', attempts: 2, messageId: 'retried' })
  })

  it('gives up on a transient failure after max attempts and records it as retryable', async () => {
    const { ledger, outcomes } = fakeLedger()
    const send = vi.fn(async () => fail('transient', 'Throttling'))

    const report = await runCampaign(
      { campaignKey: 'c1', provider: 'ses', send, maxAttempts: 3, recipients: people('a@x.fr') },
      instantDeps(ledger),
    )

    expect(send).toHaveBeenCalledTimes(3)
    expect(report.failed).toBe(1)
    expect(outcomes[0]).toMatchObject({ status: 'failed_transient', attempts: 3 })
  })

  it('does not retry a permanent failure', async () => {
    const { ledger, outcomes } = fakeLedger()
    const send = vi.fn(async () => fail('permanent', 'MessageRejected'))

    const report = await runCampaign(
      { campaignKey: 'c1', provider: 'ses', send, recipients: people('a@x.fr') },
      instantDeps(ledger),
    )

    expect(send).toHaveBeenCalledTimes(1)
    expect(report.failures).toEqual([{ email: 'a@x.fr', error: 'MessageRejected: MessageRejected message' }])
    expect(outcomes[0].status).toBe('failed_permanent')
  })

  it('turns a thrown error into a transient failure instead of aborting the campaign', async () => {
    const { ledger } = fakeLedger()
    const send = vi.fn(async (r: CampaignRecipient): Promise<SendResult> => {
      if (r.email === 'a@x.fr') throw new Error('socket hang up')
      return ok()
    })

    const report = await runCampaign(
      { campaignKey: 'c1', provider: 'ses', send, maxAttempts: 1, recipients: people('a@x.fr', 'b@x.fr') },
      instantDeps(ledger),
    )

    expect(report).toMatchObject({ sent: 1, failed: 1 })
  })

  it('stops on the time budget and reports what is left for the next run', async () => {
    const { ledger } = fakeLedger()
    const send = vi.fn(async () => ok())
    let clock = 0

    const report = await runCampaign(
      {
        campaignKey: 'c1',
        provider: 'ses',
        send,
        ratePerSecond: 2,
        budgetMs: 2500,
        recipients: people('a@x.fr', 'b@x.fr', 'c@x.fr', 'd@x.fr', 'e@x.fr', 'f@x.fr'),
      },
      instantDeps(ledger, {
        sleep: async (ms: number) => {
          clock += ms
        },
        now: () => clock,
      }),
    )

    expect(report.sent).toBe(4)
    expect(report.remaining).toBe(2)
  })

  it('aborts a campaign whose sends all fail, instead of burning through the audience', async () => {
    const { ledger } = fakeLedger()
    const send = vi.fn(async () => fail('permanent', 'AccessDeniedException'))

    const report = await runCampaign(
      {
        campaignKey: 'c1',
        provider: 'ses',
        send,
        ratePerSecond: 2,
        recipients: people('a@x.fr', 'b@x.fr', 'c@x.fr', 'd@x.fr', 'e@x.fr', 'f@x.fr'),
      },
      instantDeps(ledger),
    )

    expect(send).toHaveBeenCalledTimes(4)
    expect(report.aborted).toContain('AccessDeniedException')
    expect(report.remaining).toBe(2)
  })

  it('counts a ledger write failure without losing the sent mail', async () => {
    const { ledger } = fakeLedger([], { ok: false, message: 'db down' })
    const send = vi.fn(async () => ok())

    const report = await runCampaign(
      { campaignKey: 'c1', provider: 'ses', send, recipients: people('a@x.fr') },
      instantDeps(ledger),
    )

    expect(report).toMatchObject({ sent: 1, ledgerErrors: 1 })
  })

  it('aborts before sending when the ledger cannot be read', async () => {
    const ledger: CampaignLedger = {
      loadFinished: vi.fn().mockRejectedValue(new Error('ledger down')),
      record: vi.fn(),
    }
    const send = vi.fn(async () => ok())

    await expect(
      runCampaign({ campaignKey: 'c1', provider: 'ses', send, recipients: people('a@x.fr') }, instantDeps(ledger)),
    ).rejects.toThrow('ledger down')
    expect(send).not.toHaveBeenCalled()
  })

  it('aborts before sending when the suppression list cannot be read', async () => {
    const { ledger } = fakeLedger()
    const send = vi.fn(async () => ok())
    const filter = vi.fn().mockRejectedValue(new Error('suppression down'))

    await expect(
      runCampaign(
        { campaignKey: 'c1', provider: 'ses', send, recipients: people('a@x.fr') },
        instantDeps(ledger, { filter }),
      ),
    ).rejects.toThrow('suppression down')
    expect(send).not.toHaveBeenCalled()
  })
})

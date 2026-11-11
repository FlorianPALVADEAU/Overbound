import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchReconsentPreview,
  isReportComplete,
  sendReconsentCampaign,
  sendReconsentTest,
} from './reconsentClient'

const reply = (status: number, body: Record<string, unknown>) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }))

const stubFetch = (...replies: Array<Promise<Response>>) => {
  const fetchMock = vi.fn()
  replies.forEach((r) => fetchMock.mockReturnValueOnce(r))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const bodyOf = (fetchMock: ReturnType<typeof vi.fn>, call: number) =>
  JSON.parse((fetchMock.mock.calls[call][1] as RequestInit).body as string)

afterEach(() => vi.unstubAllGlobals())

describe('isReportComplete', () => {
  const base = { total: 5, sent: 5, failed: 0, remaining: 0, alreadyDone: 0, suppressed: 0, aborted: null }

  it('is complete when nothing failed and nobody is left', () => {
    expect(isReportComplete(base)).toBe(true)
  })

  it.each([
    ['remaining', { remaining: 2 }],
    ['failed', { failed: 1 }],
    ['aborted', { aborted: 'boom' }],
  ])('is incomplete when %s', (_name, patch) => {
    expect(isReportComplete({ ...base, ...patch })).toBe(false)
  })
})

describe('fetchReconsentPreview', () => {
  it('returns the counts', async () => {
    stubFetch(reply(200, { success: true, total: 980, confirmed: 12, subject: 'Objet' }))

    expect(await fetchReconsentPreview()).toEqual({ ok: true, data: { total: 980, confirmed: 12, subject: 'Objet' } })
  })

  it('returns the server error', async () => {
    stubFetch(reply(403, { error: 'Interdit' }))

    expect(await fetchReconsentPreview()).toEqual({ ok: false, error: 'Interdit' })
  })

  it('survives a network failure', async () => {
    stubFetch(Promise.reject(new Error('offline')))

    expect(await fetchReconsentPreview()).toEqual({ ok: false, error: 'Connexion impossible.' })
  })
})

describe('sendReconsentTest', () => {
  it('asks for a self test', async () => {
    const fetchMock = stubFetch(reply(200, { success: true, message: 'Test envoyé.' }))

    expect(await sendReconsentTest()).toEqual({ ok: true, data: { message: 'Test envoyé.' } })
    expect(bodyOf(fetchMock, 0)).toEqual({ mode: 'self' })
  })

  it('reports a failed test', async () => {
    stubFetch(reply(502, { error: 'Échec envoi test: X' }))

    expect(await sendReconsentTest()).toEqual({ ok: false, error: 'Échec envoi test: X' })
  })
})

describe('sendReconsentCampaign', () => {
  it('runs a dry run first, then sends with its token', async () => {
    const fetchMock = stubFetch(
      reply(200, { success: true, total: 3, dryRunToken: 'tok' }),
      reply(200, { success: true, total: 3, sent: 3, failed: 0, remaining: 0, alreadyDone: 0, suppressed: 0, aborted: null }),
    )

    const result = await sendReconsentCampaign()

    expect(bodyOf(fetchMock, 0)).toEqual({ mode: 'dry_run' })
    expect(bodyOf(fetchMock, 1)).toEqual({ mode: 'all', dryRunToken: 'tok' })
    expect(result).toMatchObject({ ok: true, data: { sent: 3, remaining: 0 } })
  })

  it('returns a partial report so the admin can resume', async () => {
    stubFetch(
      reply(200, { total: 900, dryRunToken: 'tok' }),
      reply(200, { success: false, total: 900, sent: 600, failed: 0, remaining: 300, alreadyDone: 0, suppressed: 1, aborted: null }),
    )

    const result = await sendReconsentCampaign()

    expect(result.ok && isReportComplete(result.data)).toBe(false)
    expect(result).toMatchObject({ ok: true, data: { remaining: 300 } })
  })

  it('does not send when nobody is left to mail', async () => {
    const fetchMock = stubFetch(reply(200, { total: 0, dryRunToken: 'tok' }))

    expect(await sendReconsentCampaign()).toEqual({ ok: false, error: 'Aucun destinataire à contacter.' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('stops when the dry run is refused', async () => {
    const fetchMock = stubFetch(reply(403, { error: 'Interdit' }))

    expect(await sendReconsentCampaign()).toEqual({ ok: false, error: 'Interdit' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('surfaces a send error from the server', async () => {
    stubFetch(reply(200, { total: 3, dryRunToken: 'tok' }), reply(502, { error: "Aucun email n'a pu être envoyé." }))

    expect(await sendReconsentCampaign()).toEqual({ ok: false, error: "Aucun email n'a pu être envoyé." })
  })
})

import { describe, expect, it, vi } from 'vitest'
import { resendRegistrationTicket } from './resendTicket'

const row = (patch: Record<string, unknown> = {}) => ({
  id: 'reg-1',
  email: 'ana@example.com',
  user_id: 'u1',
  qr_code_token: 'tok',
  cancelled_at: null,
  start_time: '2027-09-12T08:00:00Z',
  wave_index: 3,
  bib_number: 42,
  event: { title: 'Overbound', date: '2027-09-12T08:00:00Z', location: 'Saint-Quentin' },
  ticket: { name: 'Ranked' },
  profile: { full_name: 'Ana Martin' },
  ...patch,
})

const admin = (data: unknown) =>
  ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data, error: null }) }) }) }) }) as never

const deps = () => ({
  siteUrl: 'https://site.test',
  resolveQrUrl: vi.fn(async (token: string) => `https://qr.test/${token}.png`),
  formatStartTime: vi.fn(() => '10:00'),
  send: vi.fn(async () => ({ data: { id: 'mail-1' }, error: null })),
})

describe('resendRegistrationTicket', () => {
  it('sends the ticket from what is stored now', async () => {
    const d = deps()
    const result = await resendRegistrationTicket({ admin: admin(row()), registrationId: 'reg-1', ...d })
    expect(result).toEqual({ to: 'ana@example.com' })
    expect(d.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ana@example.com',
        participantName: 'Ana Martin',
        ticketName: 'Ranked',
        waveIndex: 3,
        bibNumber: 42,
        startTime: '10:00',
        qrUrl: 'https://qr.test/tok.png',
        manageUrl: 'https://site.test/account/tickets?ticket=reg-1',
      }),
    )
  })

  it('refuses a cancelled bib', async () => {
    const d = deps()
    await expect(
      resendRegistrationTicket({ admin: admin(row({ cancelled_at: '2027-01-01T00:00:00Z' })), registrationId: 'reg-1', ...d }),
    ).rejects.toMatchObject({ code: 'CANCELLED' })
    expect(d.send).not.toHaveBeenCalled()
  })

  it('refuses a bib without QR code', async () => {
    const d = deps()
    await expect(
      resendRegistrationTicket({ admin: admin(row({ qr_code_token: null })), registrationId: 'reg-1', ...d }),
    ).rejects.toMatchObject({ code: 'NO_QR' })
  })

  it('reports a missing registration', async () => {
    const d = deps()
    await expect(resendRegistrationTicket({ admin: admin(null), registrationId: 'reg-1', ...d })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })

  it('surfaces a provider error', async () => {
    const d = deps()
    d.send.mockResolvedValueOnce({ error: { message: 'rate limit' } } as never)
    await expect(resendRegistrationTicket({ admin: admin(row()), registrationId: 'reg-1', ...d })).rejects.toMatchObject({
      code: 'SEND_FAILED',
    })
  })
})

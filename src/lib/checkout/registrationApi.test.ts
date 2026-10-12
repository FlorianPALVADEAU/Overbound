import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRegistrations, registrationSuccessPath } from './registrationApi'
import { buildRegistrationRequest } from './registrationRequest'
import { signedDraft } from './testDraft'

const request = buildRegistrationRequest(signedDraft(), { paymentIntentId: 'pi_1' })
const respond = (status: number, body: unknown) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })))

describe('createRegistrations', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns the first registration created', async () => {
    respond(200, { registrations: ['reg-1', 'reg-2'] })
    expect(await createRegistrations(request)).toEqual({ ok: true, registrationId: 'reg-1' })
  })

  it('returns the reason given by the API', async () => {
    respond(422, { error: 'SAS complet' })
    expect(await createRegistrations(request)).toEqual({ ok: false, message: 'SAS complet' })
  })

  it('returns a message when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
    const outcome = await createRegistrations(request)
    expect(outcome.ok).toBe(false)
  })
})

describe('registrationSuccessPath', () => {
  it('opens the celebration page of the registration', () => {
    expect(registrationSuccessPath('ultra-arena', 'reg-1')).toBe('/events/ultra-arena/success?registration_id=reg-1')
  })

  it('falls back to the tickets list', () => {
    expect(registrationSuccessPath('ultra-arena', null)).toBe('/account/tickets')
  })
})

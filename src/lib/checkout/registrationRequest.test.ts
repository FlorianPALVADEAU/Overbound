import { describe, expect, it } from 'vitest'
import { buildPaymentIntentRequest, paymentIntentRequestSchema } from './paymentIntentRequest'
import { buildRegistrationRequest, isSignedDraft } from './registrationRequest'
import { createRegistrationRequestSchema } from './registrationRequestSchema'
import { participant, signedDraft } from './testDraft'

describe('buildRegistrationRequest', () => {
  it('sends the chosen SAS and the group for a paid order (regression: both were dropped)', () => {
    const request = buildRegistrationRequest(signedDraft(), { paymentIntentId: 'pi_1' })
    expect(request.participants?.[0]?.selectedWaveIndex).toBe(3)
    expect(request.groupId).toBe('group-1')
  })

  it('sends the chosen SAS and the group for a free order too', () => {
    const request = buildRegistrationRequest(signedDraft(), { paymentIntentId: 'free_1', freeOrderMetadata: { currency: 'eur' } })
    expect(request).toMatchObject({ paymentIntentId: 'free_1', groupId: 'group-1', freeOrderMetadata: { currency: 'eur' } })
    expect(request.participants?.[0]?.selectedWaveIndex).toBe(3)
  })

  it('is accepted by the route contract', () => {
    const request = buildRegistrationRequest(signedDraft(), { paymentIntentId: 'pi_1' })
    expect(createRegistrationRequestSchema.safeParse(request).success).toBe(true)
  })

  it('sends options by participant position', () => {
    const draft = signedDraft({
      participants: [participant(), participant({ id: 'participant-2' })],
      selectedUpsells: { tshirt: { quantity: 1, meta: { assignments: [{ participantId: 'participant-2', quantity: 1, size: 'M' }] } } },
    })
    expect(buildRegistrationRequest(draft, { paymentIntentId: 'pi_1' }).upsells).toEqual([
      { upsellId: 'tshirt', quantity: 1, meta: { assignments: [{ participantIndex: 1, quantity: 1, size: 'M' }] } },
    ])
  })

  it('carries the group attestation only when the buyer registers others', () => {
    const solo = buildRegistrationRequest(signedDraft(), { paymentIntentId: 'pi_1' })
    expect(solo.disclaimer).not.toHaveProperty('groupAttestation')
  })
})

describe('isSignedDraft', () => {
  it('rejects a draft saved before sign-in', () => {
    expect(isSignedDraft({ ...signedDraft(), userId: null })).toBe(false)
  })
})

describe('buildPaymentIntentRequest', () => {
  it('sends what the server needs to check age, SAS, flexible option and group before charging', () => {
    const body = buildPaymentIntentRequest({ ...signedDraft(), userEmail: 'camille@example.com' }, null)
    expect(body.participants?.[0]).toEqual({ ticketId: 'open', flexible: false, birthDate: '1990-05-04', selectedWaveIndex: 3 })
    expect(body.groupId).toBe('group-1')
    expect(paymentIntentRequestSchema.safeParse(body).success).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import { validateCheckout, type CheckoutValidationInput } from './checkoutValidation'
import { participant } from './testDraft'

const input = (overrides: Partial<CheckoutValidationInput> = {}): CheckoutValidationInput => ({
  participants: [participant()],
  ticketCount: 1,
  eventDate: '2026-09-12T06:00:00.000Z',
  ticketUsesWaveSelection: (ticketId) => ticketId === 'open',
  hasGroupAnchor: false,
  consents: { disclaimerRead: true, rulebookAccepted: true, disclaimerAccepted: true },
  groupAttestation: undefined,
  hasSignature: true,
  ...overrides,
})

describe('validateCheckout', () => {
  it('accepts a complete order', () => {
    expect(validateCheckout(input())).toMatchObject({ isValid: true, firstInvalidId: null })
  })

  it('points at the tickets first when none is selected', () => {
    expect(validateCheckout(input({ ticketCount: 0, participants: [] })).firstInvalidId).toBe('checkout-tickets')
  })

  it('points at the first missing field of the first incomplete participant', () => {
    const result = validateCheckout(
      input({
        participants: [participant(), participant({ id: 'participant-2', lastName: '', email: '' })],
        ticketCount: 2,
      }),
    )
    expect(result.firstInvalidId).toBe('participant-2-lastName')
    expect(result.participantErrors['participant-2']).toEqual({ lastName: 'Ce champ est obligatoire.', email: 'Ce champ est obligatoire.' })
  })

  it('refuses a participant under 18 on the event day', () => {
    const result = validateCheckout(input({ participants: [participant({ birthDate: '2010-01-01' })] }))
    expect(result.participantErrors['participant-1']?.birthDate).toContain('18 ans')
  })

  it('refuses a malformed email', () => {
    const result = validateCheckout(input({ participants: [participant({ email: 'camille@' })] }))
    expect(result.participantErrors['participant-1']?.email).toBe('Adresse email invalide.')
  })

  it('asks for a SAS on an OPEN ticket, unless the group already has a departure', () => {
    const noWave = [participant({ selectedWaveIndex: null })]
    expect(validateCheckout(input({ participants: noWave })).firstInvalidId).toBe('participant-1-wave')
    expect(validateCheckout(input({ participants: noWave, hasGroupAnchor: true })).isValid).toBe(true)
  })

  it('asks for consent when medical information is given', () => {
    const result = validateCheckout(input({ participants: [participant({ medicalInfo: 'Asthme' })] }))
    expect(result.firstInvalidId).toBe('participant-1-health-consent')
  })

  it('points at the first missing consent, then the signature', () => {
    expect(validateCheckout(input({ consents: { disclaimerRead: true, rulebookAccepted: false, disclaimerAccepted: false } })).firstInvalidId).toBe(
      'rulebook-accepted',
    )
    expect(validateCheckout(input({ hasSignature: false })).firstInvalidId).toBe('signature-pad')
  })

  it('requires the group attestation only when asked', () => {
    expect(validateCheckout(input({ groupAttestation: false })).consentErrors.groupAttestation).toBeDefined()
    expect(validateCheckout(input({ groupAttestation: true })).isValid).toBe(true)
  })

  it('keeps the participants section open while some bibs have no participant yet', () => {
    expect(validateCheckout(input({ ticketCount: 2 })).sections.participants).toBe(false)
  })
})

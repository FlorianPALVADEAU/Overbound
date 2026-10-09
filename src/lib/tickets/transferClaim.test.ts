import { describe, expect, it } from 'vitest'
import { buildHandOverUpdate, buildTransferSignatureRecord, claimSubmissionSchema, isAdultAt } from './transferClaim'

describe('buildHandOverUpdate', () => {
  it('moves the bib to the new holder with a fresh QR token and closes the link', () => {
    const update = buildHandOverUpdate({
      newHolderId: 'new-user',
      newHolderEmail: 'new@example.com',
      previousHolderId: 'old-user',
      newQrToken: 'fresh-qr',
    })
    expect(update).toEqual({
      user_id: 'new-user',
      email: 'new@example.com',
      qr_code_token: 'fresh-qr',
      transfer_token: null,
      claim_status: 'claimed',
      is_affiliated: true,
      guarantor_user_id: 'old-user',
      flexible_refund: false,
    })
  })
})

const valid = {
  token: '72c24b79-68c0-4ca5-ac6a-6602e5afab58',
  participant: {
    firstName: 'Test',
    lastName: 'Palvadeau',
    birthDate: '1995-04-12',
    emergencyContactName: 'Marie',
    emergencyContactPhone: '0600000000',
  },
  signatureImage: 'data:image/png;base64,AAA',
  disclaimer: { read: true, accepted: true, rulebookAccepted: true },
}

describe('claimSubmissionSchema', () => {
  it('accepts a complete submission', () => {
    expect(claimSubmissionSchema.safeParse(valid).success).toBe(true)
  })

  it.each(['read', 'accepted', 'rulebookAccepted'] as const)('rejects when %s is not ticked', (key) => {
    const result = claimSubmissionSchema.safeParse({ ...valid, disclaimer: { ...valid.disclaimer, [key]: false } })
    expect(result.success).toBe(false)
  })

  it('rejects a missing signature or identity', () => {
    expect(claimSubmissionSchema.safeParse({ ...valid, signatureImage: '' }).success).toBe(false)
    expect(
      claimSubmissionSchema.safeParse({ ...valid, participant: { ...valid.participant, lastName: '  ' } }).success,
    ).toBe(false)
  })
})

describe('isAdultAt', () => {
  const now = new Date('2026-10-08T10:00:00Z')
  it('accepts 18 full years and refuses a minor or an invalid date', () => {
    expect(isAdultAt('2008-10-08', now)).toBe(true)
    expect(isAdultAt('2008-10-09', now)).toBe(false)
    expect(isAdultAt('2030-01-01', now)).toBe(false)
  })
})

describe('buildTransferSignatureRecord', () => {
  it('stores the new holder identity under the transfer context', () => {
    const record = buildTransferSignatureRecord(claimSubmissionSchema.parse(valid), {
      registrationId: 'reg-1',
      signerUserId: 'user-2',
      signerEmail: 'test@example.com',
      previousHolderId: 'user-1',
      ipAddress: null,
      userAgent: null,
      now: new Date('2026-10-08T10:00:00Z'),
      document: { version: '2026-10', sha256: 'abc' },
    })
    expect(record).toMatchObject({ registration_id: 'reg-1', context: 'transfer', signer_user_id: 'user-2', regulation_version: '2026-10' })
    const data = JSON.parse(record.signature_data)
    expect(data.participant).toMatchObject({ firstName: 'Test', lastName: 'Palvadeau', email: 'test@example.com' })
    expect(data.transfer.previousHolderId).toBe('user-1')
    expect(data.document).toEqual({ version: '2026-10', sha256: 'abc' })
  })

  it('drops medical notes when the new holder did not consent to keep them', () => {
    const context = {
      registrationId: 'reg-1',
      signerUserId: 'user-2',
      signerEmail: null,
      previousHolderId: 'user-1',
      ipAddress: null,
      userAgent: null,
      now: new Date('2026-10-08T10:00:00Z'),
      document: { version: '2026-10', sha256: 'abc' },
    }
    const withNotes = { ...valid, participant: { ...valid.participant, medicalInfo: 'asthme' } }
    const withoutConsent = JSON.parse(buildTransferSignatureRecord(claimSubmissionSchema.parse(withNotes), context).signature_data)
    expect(withoutConsent.participant.medicalInfo).toBe('')
    const consented = { ...withNotes, participant: { ...withNotes.participant, healthDataConsent: true } }
    const withConsent = JSON.parse(buildTransferSignatureRecord(claimSubmissionSchema.parse(consented), context).signature_data)
    expect(withConsent.participant.medicalInfo).toBe('asthme')
  })
})

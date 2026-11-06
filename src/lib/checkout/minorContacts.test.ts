import { describe, expect, it } from 'vitest'
import { guardianTicketCopyRecipient, minorGuardianColumns, missingMinorContacts } from './minorContacts'

describe('missingMinorContacts', () => {
  it('is empty when the representative, their email and the adult on site are given', () => {
    expect(
      missingMinorContacts({
        guardianName: 'Anne Martin',
        guardianPhone: '0612345678',
        guardianEmail: 'anne.martin@example.com',
        referentName: 'Anne Martin',
        referentPhone: '0612345678',
      }),
    ).toEqual([])
  })

  it('asks for the representative email, the way it asks for their phone', () => {
    expect(
      missingMinorContacts({ guardianName: 'Anne Martin', guardianPhone: '0612345678', referentName: 'Anne Martin', referentPhone: '0612345678' }),
    ).toEqual(['guardianEmail'])
  })

  it('lists what is missing, blank values included', () => {
    expect(missingMinorContacts({ guardianName: 'Anne Martin', guardianPhone: '   ', guardianEmail: '', referentName: undefined })).toEqual([
      'guardianPhone',
      'guardianEmail',
      'referentName',
      'referentPhone',
    ])
  })
})

describe('guardianTicketCopyRecipient', () => {
  it('copies the ticket to the representative of a minor, at their own address', () => {
    expect(
      guardianTicketCopyRecipient({ isMinor: true, participantEmail: 'lea@example.com', guardianEmail: 'anne.martin@example.com' }),
    ).toBe('anne.martin@example.com')
  })

  it('sends no copy for an adult, even when a representative email is present', () => {
    expect(
      guardianTicketCopyRecipient({ isMinor: false, participantEmail: 'alex@example.com', guardianEmail: 'anne.martin@example.com' }),
    ).toBeUndefined()
  })

  it('sends no copy when the representative is the minor, whatever the case and spaces', () => {
    expect(
      guardianTicketCopyRecipient({ isMinor: true, participantEmail: 'Anne.Martin@example.com', guardianEmail: ' anne.martin@example.com ' }),
    ).toBeUndefined()
  })

  it('sends no copy when no representative email was given', () => {
    expect(guardianTicketCopyRecipient({ isMinor: true, participantEmail: 'lea@example.com', guardianEmail: '  ' })).toBeUndefined()
  })
})

describe('minorGuardianColumns', () => {
  it('stores no minor contact for an adult', () => {
    expect(
      minorGuardianColumns(false, {
        guardianName: 'Anne Martin',
        guardianPhone: '0612345678',
        guardianEmail: 'anne.martin@example.com',
        referentName: 'Anne Martin',
        referentPhone: '0612345678',
      }),
    ).toEqual({})
  })

  it('stores the trimmed minor contacts, and null for the blank ones', () => {
    expect(
      minorGuardianColumns(true, {
        guardianName: ' Anne Martin ',
        guardianPhone: '0612345678',
        guardianEmail: 'anne.martin@example.com',
        referentName: 'Paul Martin',
        referentPhone: '   ',
      }),
    ).toEqual({
      guardian_name: 'Anne Martin',
      guardian_phone: '0612345678',
      guardian_email: 'anne.martin@example.com',
      referent_name: 'Paul Martin',
      referent_phone: null,
    })
  })
})

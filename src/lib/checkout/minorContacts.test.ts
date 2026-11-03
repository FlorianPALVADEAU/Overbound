import { describe, expect, it } from 'vitest'
import { missingMinorContacts } from './minorContacts'

describe('missingMinorContacts', () => {
  it('is empty when the representative and the adult on site are both given', () => {
    expect(
      missingMinorContacts({ guardianName: 'Anne Martin', guardianPhone: '0612345678', referentName: 'Anne Martin', referentPhone: '0612345678' }),
    ).toEqual([])
  })

  it('lists what is missing, blank values included', () => {
    expect(missingMinorContacts({ guardianName: 'Anne Martin', guardianPhone: '   ', referentName: undefined })).toEqual([
      'guardianPhone',
      'referentName',
      'referentPhone',
    ])
  })
})

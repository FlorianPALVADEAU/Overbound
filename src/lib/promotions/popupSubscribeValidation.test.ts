import { describe, expect, it } from 'vitest'
import {
  getPopupSubscribeValidationError,
  isValidPopupSubscribeEmail,
  normalizePopupSubscribeValue,
} from './popupSubscribeValidation'

describe('popupSubscribeValidation', () => {
  it('normalizes input values', () => {
    expect(normalizePopupSubscribeValue('  test  ')).toBe('test')
  })

  it('validates email format', () => {
    expect(isValidPopupSubscribeEmail('runner@overbound.com')).toBe(true)
    expect(isValidPopupSubscribeEmail(' bad-email ')).toBe(false)
  })

  it('rejects missing name and email', () => {
    expect(
      getPopupSubscribeValidationError({
        fullName: '   ',
        email: 'runner@overbound.com',
      }),
    ).toBe('Le prénom est requis.')

    expect(
      getPopupSubscribeValidationError({
        fullName: 'Thomas',
        email: '   ',
      }),
    ).toBe("L'adresse email est requise.")
  })

  it('rejects invalid email and accepts valid payload', () => {
    expect(
      getPopupSubscribeValidationError({
        fullName: 'Thomas',
        email: 'not-an-email',
      }),
    ).toBe('Adresse email invalide.')

    expect(
      getPopupSubscribeValidationError({
        fullName: 'Thomas',
        email: 'thomas@overbound.com',
      }),
    ).toBeNull()
  })
})

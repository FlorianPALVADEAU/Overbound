import { describe, expect, it } from 'vitest'
import { getRegistrationTicketFormat, registrationTicketFormatLabel } from './registrationTicketChange'

describe('registration ticket changes', () => {
  it('detects OPEN and RANKED from ticket or race labels, case-insensitively', () => {
    expect(getRegistrationTicketFormat('Primal OPEN', 'Primal')).toBe('open')
    expect(getRegistrationTicketFormat('Primal', 'RANKED 15 km')).toBe('ranked')
  })

  it('refuses labels that are ambiguous or do not declare a supported format', () => {
    expect(getRegistrationTicketFormat('OPEN RANKED', null)).toBe('unknown')
    expect(getRegistrationTicketFormat('Primal 15 km', null)).toBe('unknown')
    expect(registrationTicketFormatLabel('unknown')).toBe('Format à vérifier')
  })
})

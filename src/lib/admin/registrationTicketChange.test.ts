import { describe, expect, it } from 'vitest'
import { getRegistrationTicketFormat, registrationTicketFormatLabel } from './registrationTicketChange'

describe('registration ticket changes', () => {
  it('detects OPEN and RANKED from ticket or race labels, case-insensitively', () => {
    expect(getRegistrationTicketFormat('Primal OPEN', 'Primal')).toBe('open')
    expect(getRegistrationTicketFormat('Primal', 'RANKED 15 km')).toBe('ranked')
  })

  it('keeps arbitrary ticket names as custom profiles', () => {
    expect(getRegistrationTicketFormat('OPEN RANKED', null)).toBe('custom')
    expect(getRegistrationTicketFormat('Primal 15 km', null)).toBe('custom')
    expect(registrationTicketFormatLabel('custom')).toBe('Configuration personnalisée')
  })
})

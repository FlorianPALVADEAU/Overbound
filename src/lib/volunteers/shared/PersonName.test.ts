import { describe, expect, it } from 'vitest'
import { PersonName } from './PersonName'

describe('PersonName', () => {
  it('formats the full name as "Prénom NOM" whatever the input casing', () => {
    expect(PersonName.create('  jean-pierre ', 'de la fontaine')?.fullName).toBe('Jean-Pierre DE LA FONTAINE')
    expect(PersonName.create('ÉLODIE', "o'neil")?.fullName).toBe("Élodie O'NEIL")
  })

  it('refuses a missing, too short or non-alphabetic name', () => {
    expect(PersonName.create('', 'Dupont')).toBeNull()
    expect(PersonName.create('Anaïs', 'D')).toBeNull()
    expect(PersonName.validate('4n4', '!!')).toEqual({
      firstName: expect.any(String),
      lastName: expect.any(String),
    })
  })

  it('splits an existing full name into first and last name for prefilling', () => {
    expect(PersonName.split('Anaïs Dupont Martin')).toEqual({ firstName: 'Anaïs', lastName: 'Dupont Martin' })
    expect(PersonName.split('Cher')).toEqual({ firstName: 'Cher', lastName: '' })
  })
})

import { describe, expect, it } from 'vitest'
import { computeAge, formatParticipantName, parseParticipantFromSignature, resolveParticipantIdentity } from './participant'

const NOW = new Date('2026-10-08T10:00:00Z')

describe('parseParticipantFromSignature', () => {
  it('extracts identity and ignores the signature image', () => {
    const data = JSON.stringify({
      imageDataUrl: 'data:image/png;base64,AAAA',
      participant: { firstName: ' Camille ', lastName: 'Dupont', birthDate: '1995-03-14' },
    })
    expect(parseParticipantFromSignature(data)).toEqual({ first_name: 'Camille', last_name: 'Dupont', birth_date: '1995-03-14' })
  })

  it('keeps the name when the birth date is missing or malformed', () => {
    const data = JSON.stringify({ participant: { firstName: 'Léa', lastName: 'M', birthDate: 'hier' } })
    expect(parseParticipantFromSignature(data)?.birth_date).toBeNull()
  })

  it('returns null for empty, invalid or nameless payloads', () => {
    expect(parseParticipantFromSignature(null)).toBeNull()
    expect(parseParticipantFromSignature('not json')).toBeNull()
    expect(parseParticipantFromSignature(JSON.stringify({ participant: { firstName: '', lastName: '' } }))).toBeNull()
    expect(parseParticipantFromSignature(JSON.stringify({}))).toBeNull()
  })
})

describe('computeAge', () => {
  it('counts full years', () => {
    expect(computeAge('1995-10-09', NOW)).toBe(30)
    expect(computeAge('1995-10-08', NOW)).toBe(31)
  })

  it('returns null for missing, invalid or future dates', () => {
    expect(computeAge(null, NOW)).toBeNull()
    expect(computeAge('nope', NOW)).toBeNull()
    expect(computeAge('2030-01-01', NOW)).toBeNull()
  })
})

describe('resolveParticipantIdentity', () => {
  it('prefers the participant of the bib', () => {
    const identity = resolveParticipantIdentity({ first_name: 'Camille', last_name: 'Dupont', birth_date: '1995-03-14' }, { fullName: 'Autre', birthDate: null }, NOW)
    expect(identity).toEqual({ name: 'Camille DUPONT', age: 31, avatarUrl: null })
    expect(formatParticipantName({ first_name: 'A', last_name: 'b' })).toBe('A B')
  })

  it('falls back to the holder profile, then to nothing', () => {
    expect(resolveParticipantIdentity(null, { fullName: 'Flo P', birthDate: '2000-01-01' }, NOW)).toEqual({ name: 'Flo P', age: 26, avatarUrl: null })
    expect(resolveParticipantIdentity(null, null, NOW)).toEqual({ name: null, age: null, avatarUrl: null })
  })

  it('carries the holder photo, also when the bib has a participant identity', () => {
    const participant = { first_name: 'Camille', last_name: 'Dupont', birth_date: null }
    expect(resolveParticipantIdentity(participant, { fullName: 'x', birthDate: null, avatarUrl: 'https://p.test/a.webp' }, NOW).avatarUrl).toBe('https://p.test/a.webp')
    expect(resolveParticipantIdentity(null, { fullName: null, birthDate: null, avatarUrl: 'https://p.test/a.webp' }, NOW).avatarUrl).toBe('https://p.test/a.webp')
  })
})

import { describe, expect, it } from 'vitest'
import { isSafetyDataRedacted, keepHealthDataWithConsent, needsHealthDataConsent, redactParticipantSafetyData } from './healthData'

describe('keepHealthDataWithConsent', () => {
  it('keeps the trimmed notes when the participant consented', () => {
    expect(keepHealthDataWithConsent('  asthme  ', true)).toBe('asthme')
  })

  it('drops the notes without explicit consent', () => {
    expect(keepHealthDataWithConsent('asthme', false)).toBe('')
    expect(keepHealthDataWithConsent('asthme', undefined)).toBe('')
  })
})

describe('needsHealthDataConsent', () => {
  it('asks for consent only when notes are filled', () => {
    expect(needsHealthDataConsent('  ')).toBe(false)
    expect(needsHealthDataConsent('allergie')).toBe(true)
  })
})

describe('redactParticipantSafetyData', () => {
  const now = new Date('2026-10-09T10:00:00Z')

  it('clears health notes and the emergency contact but keeps identity and signature', () => {
    const original = JSON.stringify({
      imageDataUrl: 'data:image/png;base64,AAA',
      participant: { firstName: 'Ana', lastName: 'B', medicalInfo: 'asthme', emergencyContactName: 'Léo', emergencyContactPhone: '0600' },
    })
    const redacted = JSON.parse(redactParticipantSafetyData(original, now)!)
    expect(redacted.imageDataUrl).toBe('data:image/png;base64,AAA')
    expect(redacted.participant).toMatchObject({ firstName: 'Ana', lastName: 'B', medicalInfo: '', emergencyContactName: '', emergencyContactPhone: '' })
    expect(redacted.safetyDataRedactedAt).toBe(now.toISOString())
    expect(isSafetyDataRedacted(redactParticipantSafetyData(original, now)!)).toBe(true)
    expect(isSafetyDataRedacted(original)).toBe(false)
  })

  it('also clears the representative and the adult on site of a minor, and adds nothing for an adult', () => {
    const minor = JSON.stringify({
      participant: { firstName: 'Léa', guardianName: 'Anne', guardianPhone: '0611', referentName: 'Anne', referentPhone: '0611' },
    })
    expect(JSON.parse(redactParticipantSafetyData(minor, now)!).participant).toMatchObject({
      firstName: 'Léa',
      guardianName: '',
      guardianPhone: '',
      referentName: '',
      referentPhone: '',
    })
    const adult = JSON.stringify({ participant: { firstName: 'Ana' } })
    expect(JSON.parse(redactParticipantSafetyData(adult, now)!).participant).not.toHaveProperty('guardianName')
  })

  it('returns null for unreadable data', () => {
    expect(redactParticipantSafetyData('not json', now)).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import { formatDateTime, mutationMessage } from './rewardStatus'

describe('mutationMessage', () => {
  it('prefers the message sent by the API', () => {
    expect(mutationMessage({ response: { data: { error: 'Motif requis' } } }, 'Erreur')).toBe('Motif requis')
  })

  it('falls back to the error message, then to the default', () => {
    expect(mutationMessage(new Error('Network Error'), 'Erreur')).toBe('Network Error')
    expect(mutationMessage({}, 'Erreur')).toBe('Erreur')
    expect(mutationMessage(null, 'Erreur')).toBe('Erreur')
  })
})

describe('formatDateTime', () => {
  it('shows a dash for a missing date and Paris time otherwise', () => {
    expect(formatDateTime(null)).toBe('—')
    expect(formatDateTime('2026-11-03T12:30:00.000Z')).toContain('13:30')
  })
})

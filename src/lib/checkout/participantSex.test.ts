import { describe, expect, it } from 'vitest'
import { PARTICIPANT_SEXES, isParticipantSex, participantSexSchema } from './participantSex'

describe('isParticipantSex', () => {
  it('accepts the two values the rankings use', () => {
    expect(isParticipantSex('homme')).toBe(true)
    expect(isParticipantSex('femme')).toBe(true)
  })

  it('refuses any other value, blank or missing', () => {
    expect(isParticipantSex('autre')).toBe(false)
    expect(isParticipantSex('')).toBe(false)
    expect(isParticipantSex(undefined)).toBe(false)
  })
})

describe('participantSexSchema', () => {
  it('lists exactly homme and femme', () => {
    expect(PARTICIPANT_SEXES).toEqual(['homme', 'femme'])
  })

  it('rejects a value outside the list', () => {
    expect(participantSexSchema.safeParse('non-binaire').success).toBe(false)
    expect(participantSexSchema.safeParse('femme').success).toBe(true)
  })
})

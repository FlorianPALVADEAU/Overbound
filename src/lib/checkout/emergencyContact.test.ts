import { describe, expect, it } from 'vitest'
import type { Participant } from '@/components/registration/types'
import { emergencyContactToReuse } from './emergencyContact'

const participant = (id: string, name = '', phone = ''): Participant =>
  ({ id, emergencyContactName: name, emergencyContactPhone: phone }) as Participant

describe('emergencyContactToReuse', () => {
  it('suggests the contact of another participant who has one', () => {
    const participants = [participant('p1', 'Anne Martin', '0612345678'), participant('p2')]
    expect(emergencyContactToReuse(participants, 'p2')).toEqual({
      name: 'Anne Martin',
      phone: '0612345678',
      fromParticipantId: 'p1',
    })
  })

  it('suggests nothing when no other participant has a complete contact', () => {
    const participants = [participant('p1', 'Anne Martin'), participant('p2')]
    expect(emergencyContactToReuse(participants, 'p2')).toBeNull()
  })

  it('never overwrites a contact the participant already typed', () => {
    const participants = [participant('p1', 'Anne Martin', '0612345678'), participant('p2', 'Paul')]
    expect(emergencyContactToReuse(participants, 'p2')).toBeNull()
  })

  it('suggests nothing for a lone participant or an unknown id', () => {
    expect(emergencyContactToReuse([participant('p1')], 'p1')).toBeNull()
    expect(emergencyContactToReuse([participant('p1', 'A', '1')], 'missing')).toBeNull()
  })
})

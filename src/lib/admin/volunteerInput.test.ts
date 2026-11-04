import { describe, expect, it } from 'vitest'
import { volunteerAssignmentSchema } from './volunteerInput'

const VOLUNTEER_UUID = '7c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f'
const EVENT_UUID = '3f2a9c10-7d4e-4b8a-9c1d-2e5f6a7b8c9d'

const validBody = {
  volunteerId: VOLUNTEER_UUID,
  email: 'benevole@example.com',
  fullName: '  Marie  ',
  eventId: EVENT_UUID,
  eventTitle: 'Ultra Arena',
  eventDate: '2026-09-12',
  eventLocation: 'Saint-Quentin-en-Yvelines',
  shiftStart: '08:00',
  shiftEnd: '12:00',
  arrivalInstructions: '',
  contactEmail: null,
  contactPhone: undefined,
  checkinUrl: 'https://overbound-race.com/checkin',
}

describe('volunteerAssignmentSchema', () => {
  it('accepts a complete assignment and normalises optional text', () => {
    const parsed = volunteerAssignmentSchema.safeParse(validBody)

    expect(parsed.success).toBe(true)
    if (!parsed.success) return
    expect(parsed.data.fullName).toBe('Marie')
    expect(parsed.data.arrivalInstructions).toBeNull()
    expect(parsed.data.contactPhone).toBeNull()
  })

  it('refuses a volunteer id that is not a uuid', () => {
    const parsed = volunteerAssignmentSchema.safeParse({ ...validBody, volunteerId: 'abc' })

    expect(parsed.success).toBe(false)
  })

  it('refuses an invalid email', () => {
    const parsed = volunteerAssignmentSchema.safeParse({ ...validBody, email: 'pas-un-email' })

    expect(parsed.success).toBe(false)
    if (parsed.success) return
    expect(parsed.error.issues[0]?.message).toBe('Email bénévole invalide')
  })

  it('refuses a missing shift end', () => {
    const { shiftEnd: _omit, ...withoutShiftEnd } = validBody
    const parsed = volunteerAssignmentSchema.safeParse(withoutShiftEnd)

    expect(parsed.success).toBe(false)
  })

  it('refuses a blank event title', () => {
    const parsed = volunteerAssignmentSchema.safeParse({ ...validBody, eventTitle: '   ' })

    expect(parsed.success).toBe(false)
  })
})

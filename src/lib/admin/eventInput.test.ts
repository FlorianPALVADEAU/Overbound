import { describe, expect, it } from 'vitest'
import { eventCreateSchema, eventUpdateSchema } from './eventInput'

const validBody = {
  slug: 'ultra-arena-2027',
  title: 'Ultra Arena 2027',
  subtitle: '  ',
  description: null,
  image_url: '',
  date: '2027-04-24T10:00:00.000Z',
  sales_start: null,
  location: 'Saint-Quentin-en-Yvelines',
  capacity: '500',
  ranked_bib_capacity: 100,
  minimum_age: 16,
  tshirt_offer_quota: 200,
  status: 'draft',
  external_provider: null,
  external_event_id: null,
  external_url: null,
  latitude: 48.7,
}

describe('eventUpdateSchema', () => {
  it('accepts a full form payload and normalises blank text to null and digit strings to numbers', () => {
    const parsed = eventUpdateSchema.parse(validBody)
    expect(parsed.capacity).toBe(500)
    expect(parsed.subtitle).toBeNull()
    expect(parsed.image_url).toBeNull()
    expect(parsed.status).toBe('draft')
  })

  it('refuses a missing status instead of silently resetting the event to draft', () => {
    const { status: _omitted, ...withoutStatus } = validBody
    const result = eventUpdateSchema.safeParse(withoutStatus)
    expect(result.success).toBe(false)
  })

  it('refuses an unknown status', () => {
    expect(eventUpdateSchema.safeParse({ ...validBody, status: 'deleted' }).success).toBe(false)
  })

  it('refuses a slug that is not url-safe', () => {
    expect(eventUpdateSchema.safeParse({ ...validBody, slug: 'Ultra Arena!' }).success).toBe(false)
  })

  it('refuses an empty capacity rather than reading it as zero', () => {
    expect(eventUpdateSchema.safeParse({ ...validBody, capacity: '' }).success).toBe(false)
  })

  it('refuses a negative or fractional capacity', () => {
    expect(eventUpdateSchema.safeParse({ ...validBody, capacity: -1 }).success).toBe(false)
    expect(eventUpdateSchema.safeParse({ ...validBody, capacity: 1.5 }).success).toBe(false)
  })

  it('refuses an unreadable date', () => {
    expect(eventUpdateSchema.safeParse({ ...validBody, date: 'not a date' }).success).toBe(false)
  })
})

describe('eventCreateSchema', () => {
  it('defaults a missing status to draft and a missing capacity to 0', () => {
    const { status: _status, capacity: _capacity, ...withoutDefaults } = validBody
    const parsed = eventCreateSchema.safeParse(withoutDefaults)

    expect(parsed.success).toBe(true)
    if (!parsed.success) return
    expect(parsed.data.status).toBe('draft')
    expect(parsed.data.capacity).toBe(0)
  })

  it('keeps an explicit status', () => {
    const parsed = eventCreateSchema.safeParse({ ...validBody, status: 'on_sale' })

    expect(parsed.success).toBe(true)
    if (!parsed.success) return
    expect(parsed.data.status).toBe('on_sale')
  })

  it('refuses an unknown status instead of silently drafting it', () => {
    const parsed = eventCreateSchema.safeParse({ ...validBody, status: 'publie' })

    expect(parsed.success).toBe(false)
  })

  it('refuses a slug with uppercase or spaces', () => {
    const parsed = eventCreateSchema.safeParse({ ...validBody, slug: 'Ultra Arena' })

    expect(parsed.success).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import {
  getEffectiveEventStatus,
  hasSalesStarted,
  isEventOpenForRegistration,
} from './registrationStatus'

describe('registrationStatus', () => {
  const now = new Date('2026-02-27T12:00:00.000Z')

  it('treats announced events as open once sales_start has passed', () => {
    const event = {
      status: 'announced',
      sales_start: '2026-02-27T11:59:00.000Z',
      date: '2026-05-01T08:00:00.000Z',
    }

    expect(isEventOpenForRegistration(event, now)).toBe(true)
    expect(getEffectiveEventStatus(event, now)).toBe('on_sale')
  })

  it('keeps announced events closed before sales_start', () => {
    const event = {
      status: 'announced',
      sales_start: '2026-02-27T13:00:00.000Z',
      date: '2026-05-01T08:00:00.000Z',
    }

    expect(hasSalesStarted(event.sales_start, now)).toBe(false)
    expect(isEventOpenForRegistration(event, now)).toBe(false)
    expect(getEffectiveEventStatus(event, now)).toBe('announced')
  })

  it('keeps sold_out events closed', () => {
    const event = {
      status: 'sold_out',
      sales_start: '2026-02-27T11:00:00.000Z',
      date: '2026-05-01T08:00:00.000Z',
    }

    expect(isEventOpenForRegistration(event, now)).toBe(false)
    expect(getEffectiveEventStatus(event, now)).toBe('sold_out')
  })
})

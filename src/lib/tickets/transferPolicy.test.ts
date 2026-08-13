import { describe, expect, it } from 'vitest'
import {
  getTransferDeadline,
  isTicketTransferAllowed,
  TRANSFER_DEADLINE_DAYS_BEFORE_EVENT,
} from './transferPolicy'

describe('transferPolicy', () => {
  it('sets the transfer deadline to J-7 before the event', () => {
    const deadline = getTransferDeadline('2026-09-12T12:00:00.000Z')

    expect(TRANSFER_DEADLINE_DAYS_BEFORE_EVENT).toBe(7)
    expect(deadline?.toISOString()).toBe('2026-09-05T12:00:00.000Z')
  })

  it('allows transfers until the deadline inclusively', () => {
    expect(
      isTicketTransferAllowed(
        '2026-09-12T12:00:00.000Z',
        new Date('2026-09-05T12:00:00.000Z'),
      ),
    ).toBe(true)
  })

  it('blocks transfers after J-7', () => {
    expect(
      isTicketTransferAllowed(
        '2026-09-12T12:00:00.000Z',
        new Date('2026-09-05T12:00:01.000Z'),
      ),
    ).toBe(false)
  })

  it('blocks transfers when the event date is missing or invalid', () => {
    expect(isTicketTransferAllowed(null)).toBe(false)
    expect(isTicketTransferAllowed('not-a-date')).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import type { AccountRegistrationItem } from '@/types/AccountRegistration'
import {
  buildTransferUrl,
  canShowTicketQr,
  canTransferTicket,
  countdownDisplay,
  getDaysUntilEvent,
  getTransferState,
  getEventPhase,
  groupTicketsByEvent,
  isOwnTicket,
  pickFeaturedGroup,
} from './tickets'

const make = (overrides: Partial<AccountRegistrationItem> = {}): AccountRegistrationItem => ({
  registration_id: 'r1',
  user_id: 'u1',
  email: 'me@example.com',
  checked_in: false,
  claim_status: 'pending',
  qr_code_token: 'tok',
  qr_code_data_url: 'data:image/png;base64,AAA',
  transfer_token: 'xfer',
  created_at: '2026-06-01T10:00:00Z',
  ticket_id: 't1',
  ticket_name: 'Primal OPEN',
  event_id: 'e1',
  event_title: 'Ultra Arena',
  event_date: '2026-09-12T06:00:00Z',
  event_location: 'Saint-Quentin',
  amount_total: null,
  currency: null,
  order_status: null,
  invoice_url: null,
  order_created_at: null,
  approval_status: 'approved',
  document_url: null,
  requires_document: false,
  document_requires_attention: false,
  ...overrides,
})

describe('getEventPhase', () => {
  const eventDate = '2026-09-12T06:00:00Z' // 08:00 Paris

  it('is upcoming before the event day', () => {
    expect(getEventPhase(eventDate, new Date('2026-09-11T21:00:00Z'))).toBe('upcoming')
  })

  it('stays today after the event start (13:00 wave participant)', () => {
    expect(getEventPhase(eventDate, new Date('2026-09-12T11:00:00Z'))).toBe('today')
  })

  it('turns past from the next Paris day', () => {
    expect(getEventPhase(eventDate, new Date('2026-09-12T22:30:00Z'))).toBe('past')
  })

  it('treats a missing date as upcoming rather than hiding the ticket', () => {
    expect(getEventPhase(null, new Date())).toBe('upcoming')
  })
})

describe('getDaysUntilEvent', () => {
  it('counts Paris calendar days', () => {
    expect(getDaysUntilEvent('2026-09-12T06:00:00Z', new Date('2026-09-02T20:00:00Z'))).toBe(10)
  })

  it('returns null for an unknown date', () => {
    expect(getDaysUntilEvent(undefined, new Date())).toBeNull()
  })
})

describe('canShowTicketQr', () => {
  const before = new Date('2026-09-01T10:00:00Z')

  it('shows the QR for a valid upcoming ticket', () => {
    expect(canShowTicketQr(make(), before)).toBe(true)
  })

  it('shows the QR for a ticket received by transfer (claimed)', () => {
    expect(canShowTicketQr(make({ claim_status: 'claimed' }), before)).toBe(true)
  })

  it('hides the QR once checked in, after the event, or without a code', () => {
    expect(canShowTicketQr(make({ checked_in: true }), before)).toBe(false)
    expect(canShowTicketQr(make(), new Date('2026-09-13T10:00:00Z'))).toBe(false)
    expect(canShowTicketQr(make({ qr_code_data_url: null }), before)).toBe(false)
  })
})

describe('canTransferTicket', () => {
  it('allows transfer before the J-1 deadline', () => {
    expect(canTransferTicket(make(), new Date('2026-09-05T10:00:00Z'))).toBe(true)
  })

  it('refuses after the deadline, without token, or once checked in', () => {
    expect(canTransferTicket(make(), new Date('2026-09-12T05:00:00Z'))).toBe(false)
    expect(canTransferTicket(make({ transfer_token: null }), new Date('2026-09-05T10:00:00Z'))).toBe(false)
    expect(canTransferTicket(make({ checked_in: true }), new Date('2026-09-05T10:00:00Z'))).toBe(false)
  })
})

describe('isOwnTicket', () => {
  it('matches the account email case-insensitively', () => {
    expect(isOwnTicket(make({ email: 'Me@Example.com' }), 'me@example.com')).toBe(true)
  })

  it('flags a bib bought for someone else', () => {
    expect(isOwnTicket(make({ email: 'friend@example.com' }), 'me@example.com')).toBe(false)
  })

  it('treats a ticket without email as the holder’s', () => {
    expect(isOwnTicket(make({ email: null }), 'me@example.com')).toBe(true)
  })
})

describe('groupTicketsByEvent', () => {
  const now = new Date('2026-09-01T10:00:00Z')

  it('puts the holder first then orders the friends’ bibs by number', () => {
    const groups = groupTicketsByEvent(
      [
        make({ registration_id: 'a', email: 'f2@example.com', bib_number: 12 }),
        make({ registration_id: 'b', email: 'f1@example.com', bib_number: 7 }),
        make({ registration_id: 'c', email: 'me@example.com', bib_number: 30 }),
      ],
      now,
      'me@example.com',
    )
    expect(groups).toHaveLength(1)
    expect(groups[0]?.tickets.map((t) => t.registration_id)).toEqual(['c', 'b', 'a'])
  })

  it('orders upcoming soonest-first, then past most-recent-first', () => {
    const groups = groupTicketsByEvent(
      [
        make({ registration_id: '1', event_id: 'old', event_title: 'Old', event_date: '2025-05-01T08:00:00Z' }),
        make({ registration_id: '2', event_id: 'later', event_title: 'Later', event_date: '2026-12-01T08:00:00Z' }),
        make({ registration_id: '3', event_id: 'soon', event_title: 'Soon', event_date: '2026-09-05T08:00:00Z' }),
        make({ registration_id: '4', event_id: 'older', event_title: 'Older', event_date: '2024-05-01T08:00:00Z' }),
      ],
      now,
    )
    expect(groups.map((g) => g.eventId)).toEqual(['soon', 'later', 'old', 'older'])
  })

  it('returns nothing for no registration', () => {
    expect(groupTicketsByEvent([], now)).toEqual([])
  })
})

describe('pickFeaturedGroup', () => {
  it('returns the first group not over', () => {
    const now = new Date('2026-09-01T10:00:00Z')
    const groups = groupTicketsByEvent(
      [make({ event_id: 'old', event_date: '2025-05-01T08:00:00Z' }), make({ event_id: 'new' })],
      now,
    )
    expect(pickFeaturedGroup(groups)?.eventId).toBe('new')
  })

  it('returns null when every event is over', () => {
    const groups = groupTicketsByEvent([make({ event_date: '2025-05-01T08:00:00Z' })], new Date('2026-09-01T10:00:00Z'))
    expect(pickFeaturedGroup(groups)).toBeNull()
  })
})

describe('buildTransferUrl', () => {
  it('points to the claim page with an encoded token', () => {
    expect(buildTransferUrl('https://overbound-race.com', 'a b')).toBe(
      'https://overbound-race.com/account/tickets/claim?token=a%20b',
    )
  })
})

describe('getTransferState', () => {
  it('is available and locked until the fee is paid', () => {
    expect(getTransferState(make(), new Date('2026-09-05T10:00:00Z'))).toEqual({ available: true, unlocked: false, closedByDeadline: false })
    expect(getTransferState(make({ transfer_unlocked: true }), new Date('2026-09-05T10:00:00Z')).unlocked).toBe(true)
  })

  it('reports a closed window after the deadline, and nothing once the event is over or the bib used', () => {
    expect(getTransferState(make(), new Date('2026-09-12T05:00:00Z'))).toMatchObject({ available: false, closedByDeadline: true })
    expect(getTransferState(make(), new Date('2026-09-14T10:00:00Z')).closedByDeadline).toBe(false)
    expect(getTransferState(make({ checked_in: true }), new Date('2026-09-05T10:00:00Z')).available).toBe(false)
  })
})

describe('countdownDisplay', () => {
  it('words the remaining time for the event header', () => {
    expect(countdownDisplay(122)).toEqual({ caption: 'Dans', value: '122 jours' })
    expect(countdownDisplay(1)).toEqual({ caption: 'Départ', value: 'Demain' })
    expect(countdownDisplay(0)).toEqual({ caption: 'Départ', value: "Aujourd'hui" })
  })

  it('shows nothing once the event is over or the date unknown', () => {
    expect(countdownDisplay(-1)).toBeNull()
    expect(countdownDisplay(null)).toBeNull()
  })
})

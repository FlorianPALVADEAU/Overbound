import { describe, expect, it } from 'vitest'
import {
  companionConfigFromForm,
  companionFormFromConfig,
  emptyCompanionForm,
  validateOpenCompanionAssignment,
  type CompanionTicketRef,
} from './openCompanionAdmin'
import { parseOpenCompanionConfig } from './openCompanion'

const OPEN_ID = 'open-ticket'
const RANKED_ID = 'ranked-ticket'
const EVENT_ID = 'event-1'

const stored = { ticket_id: OPEN_ID, price_cents: 2900, ranked_max_duration_minutes: 230, min_gap_minutes: 20 }

const openTicket = (overrides: Partial<CompanionTicketRef> = {}): CompanionTicketRef => ({
  id: OPEN_ID,
  event_id: EVENT_ID,
  name: 'OPEN',
  operations_config: { departure_mode: 'wave', departure_change_policy: 'preserve' },
  ...overrides,
})

const rankedOwner = (config: Record<string, unknown> | null = { departure_mode: 'fixed', departure_change_policy: 'preserve', open_companion: stored }) => ({
  id: RANKED_ID,
  event_id: EVENT_ID,
  name: 'RANKED',
  operations_config: config,
})

describe('companion form mapping', () => {
  it('round-trips the stored config through the form', () => {
    const form = companionFormFromConfig({ open_companion: stored })
    expect(form).toEqual({ enabled: true, openTicketId: OPEN_ID, priceCents: '2900', rankedMaxDurationMinutes: '230', minGapMinutes: '20' })
    const result = companionConfigFromForm(form)
    expect(result).toEqual({ ok: true, config: stored })
    expect(parseOpenCompanionConfig({ open_companion: stored })).not.toBeNull()
  })

  it('reads a ticket without option, or with an incomplete one, as option off', () => {
    expect(companionFormFromConfig(null).enabled).toBe(false)
    expect(companionFormFromConfig({ open_companion: { ticket_id: OPEN_ID } }).enabled).toBe(false)
  })

  it('stores nothing when the option is off', () => {
    expect(companionConfigFromForm({ ...emptyCompanionForm(), openTicketId: OPEN_ID })).toEqual({ ok: true, config: null })
  })

  it.each([
    ['no OPEN ticket', { openTicketId: '' }],
    ['a zero price', { priceCents: '0' }],
    ['a decimal price', { priceCents: '29.5' }],
    ['no maximum duration', { rankedMaxDurationMinutes: '' }],
    ['a negative gap', { minGapMinutes: '-5' }],
  ])('refuses an enabled option with %s', (_label, patch) => {
    const result = companionConfigFromForm({ ...emptyCompanionForm(), enabled: true, openTicketId: OPEN_ID, ...patch })
    expect(result.ok).toBe(false)
  })

  it('accepts a zero gap', () => {
    const result = companionConfigFromForm({ ...emptyCompanionForm(), enabled: true, openTicketId: OPEN_ID, minGapMinutes: '0' })
    expect(result).toMatchObject({ ok: true, config: { min_gap_minutes: 0 } })
  })
})

describe('validateOpenCompanionAssignment', () => {
  it('accepts an option that points at a SAS ticket of the same event', () => {
    expect(validateOpenCompanionAssignment({ owner: rankedOwner(), eventTickets: [openTicket()] })).toBeNull()
  })

  it('ignores a ticket that carries no option', () => {
    expect(validateOpenCompanionAssignment({ owner: rankedOwner({ departure_mode: 'fixed' }), eventTickets: [] })).toBeNull()
  })

  it('refuses an incomplete option', () => {
    const owner = rankedOwner({ departure_mode: 'fixed', open_companion: { ticket_id: OPEN_ID } })
    expect(validateOpenCompanionAssignment({ owner, eventTickets: [openTicket()] })).toMatch(/incomplète/)
  })

  it('refuses an OPEN ticket that is not in the event', () => {
    expect(validateOpenCompanionAssignment({ owner: rankedOwner(), eventTickets: [] })).toMatch(/même événement/)
    expect(
      validateOpenCompanionAssignment({ owner: rankedOwner(), eventTickets: [openTicket({ event_id: 'other-event' })] }),
    ).toMatch(/même événement/)
  })

  it('refuses a ticket pointing at itself', () => {
    const owner = rankedOwner({ departure_mode: 'fixed', open_companion: { ...stored, ticket_id: RANKED_ID } })
    expect(validateOpenCompanionAssignment({ owner, eventTickets: [openTicket({ id: RANKED_ID })] })).toMatch(/propre billet/)
  })

  it('refuses a target that does not use SAS departures', () => {
    const target = openTicket({ operations_config: { departure_mode: 'fixed', departure_change_policy: 'preserve' } })
    expect(validateOpenCompanionAssignment({ owner: rankedOwner(), eventTickets: [target] })).toMatch(/départ par SAS/)
  })

  it('refuses a target that carries an option itself', () => {
    const target = openTicket({
      operations_config: { departure_mode: 'wave', departure_change_policy: 'preserve', open_companion: stored },
    })
    expect(validateOpenCompanionAssignment({ owner: rankedOwner(), eventTickets: [target] })).toMatch(/porter lui-même/)
  })

  it('refuses an option carried by a SAS ticket', () => {
    const owner = rankedOwner({ departure_mode: 'wave', departure_change_policy: 'preserve', open_companion: stored })
    expect(validateOpenCompanionAssignment({ owner, eventTickets: [openTicket()] })).toMatch(/billet RANKED/)
  })
})

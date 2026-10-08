import { describe, expect, it } from 'vitest'
import { EVENT_SELECTION_ANY, EVENT_SELECTION_CUSTOM, INITIAL_VOLUNTEER_VALUES, type VolunteerFormValues } from './formValues'
import { VolunteerApplicationValidator } from './VolunteerApplicationValidator'
import { VolunteerEventCatalog, type VolunteerEventOption } from './VolunteerEventCatalog'

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.parse('2026-10-07T10:00:00Z')

const event = (overrides: Partial<VolunteerEventOption> = {}): VolunteerEventOption => ({
  id: 'evt-1',
  title: 'Ultra Arena',
  date: new Date(NOW + 30 * DAY).toISOString(),
  location: 'Saint-Quentin',
  status: 'on_sale',
  ...overrides,
})

const validValues: VolunteerFormValues = {
  ...INITIAL_VOLUNTEER_VALUES,
  firstName: 'anaïs',
  lastName: 'dupont',
  email: 'anais@example.com',
  phone: '06 12 34 56 78',
  eventSelection: 'evt-1',
  gdprConsent: true,
}

const validatorFor = (events: VolunteerEventOption[] = [event()]) =>
  new VolunteerApplicationValidator(new VolunteerEventCatalog(events))

describe('VolunteerEventCatalog', () => {
  it('keeps upcoming open events sorted by date', () => {
    const catalog = VolunteerEventCatalog.fromApiPayload(
      [event({ id: 'b', date: new Date(NOW + 60 * DAY).toISOString() }), event({ id: 'a', date: new Date(NOW + 10 * DAY).toISOString() })],
      NOW,
    )
    expect(catalog.list().map((e) => e.id)).toEqual(['a', 'b'])
  })

  it('drops drafts, closed events and events ended for more than 3 days', () => {
    const catalog = VolunteerEventCatalog.fromApiPayload(
      [
        event({ id: 'draft', status: 'draft' }),
        event({ id: 'closed', status: 'closed' }),
        event({ id: 'old', date: new Date(NOW - 4 * DAY).toISOString() }),
        event({ id: 'recent', date: new Date(NOW - 2 * DAY).toISOString() }),
      ],
      NOW,
    )
    expect(catalog.list().map((e) => e.id)).toEqual(['recent'])
  })

  it('normalises ids, skips malformed entries and rejects a non-list payload', () => {
    const catalog = VolunteerEventCatalog.fromApiPayload([{ id: 12, title: null, status: 'on_sale' }, { nope: true }, null], NOW)
    expect(catalog.list()).toEqual([{ id: '12', title: 'Événement Overbound', date: null, location: null, status: 'on_sale' }])
    expect(() => VolunteerEventCatalog.fromApiPayload({ error: 'x' })).toThrow()
  })
})

describe('VolunteerApplicationValidator.validate', () => {
  it('builds a payload with a normalised first and last name', () => {
    const { errors, payload } = validatorFor().validate({ ...validValues, experience: '   ' })
    expect(errors).toEqual({})
    expect(payload).toMatchObject({
      firstName: 'Anaïs',
      lastName: 'DUPONT',
      eventId: 'evt-1',
      eventName: 'Ultra Arena',
      availability: 'Toute la journée',
      experience: undefined,
      gdprConsent: true,
    })
  })

  it('accepts "any event" and custom event names without an event id', () => {
    const any = validatorFor([]).validate({ ...validValues, eventSelection: EVENT_SELECTION_ANY })
    expect(any.payload?.eventId).toBeUndefined()
    expect(any.payload?.eventName).toBe('Disponible pour plusieurs événements')

    const custom = validatorFor([]).validate({ ...validValues, eventSelection: EVENT_SELECTION_CUSTOM, customEventName: 'Overbound Lyon' })
    expect(custom.payload?.eventName).toBe('Overbound Lyon')
  })

  it('reports every missing field and returns no payload', () => {
    const { errors, payload } = validatorFor([]).validate(INITIAL_VOLUNTEER_VALUES)
    expect(payload).toBeNull()
    expect(Object.keys(errors).sort()).toEqual(['email', 'eventSelection', 'firstName', 'gdprConsent', 'lastName', 'phone'])
  })

  it('rejects a one-letter or symbol-only first or last name', () => {
    const { errors } = validatorFor().validate({ ...validValues, firstName: 'A', lastName: '123' })
    expect(errors.firstName).toBeDefined()
    expect(errors.lastName).toBeDefined()
  })

  it('rejects a short phone, a bad email and a too-short custom event name', () => {
    const { errors } = validatorFor([]).validate({
      ...validValues,
      phone: '12-3',
      email: 'nope',
      eventSelection: EVENT_SELECTION_CUSTOM,
      customEventName: 'ab',
    })
    expect(errors.phone).toMatch(/6 chiffres/)
    expect(errors.email).toBeDefined()
    expect(errors.customEventName).toBeDefined()
  })
})

describe('VolunteerApplicationValidator.validateStep', () => {
  it('only reports errors belonging to the requested step', () => {
    const validator = validatorFor([])
    expect(Object.keys(validator.validateStep(0, INITIAL_VOLUNTEER_VALUES))).toEqual(['eventSelection'])
    expect(Object.keys(validator.validateStep(1, INITIAL_VOLUNTEER_VALUES)).sort()).toEqual(['email', 'firstName', 'lastName', 'phone'])
    expect(Object.keys(validator.validateStep(2, INITIAL_VOLUNTEER_VALUES))).toEqual(['gdprConsent'])
  })

  it('finds the first step that still has errors', () => {
    const validator = validatorFor()
    expect(validator.firstInvalidStep({ ...validValues, email: '' })).toBe(1)
    expect(validator.firstInvalidStep(validValues)).toBeNull()
  })
})

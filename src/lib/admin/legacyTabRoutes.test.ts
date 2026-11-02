import { describe, expect, it } from 'vitest'
import { resolveLegacyTabRoute } from './legacyTabRoutes'

const EVENT = '0d0272d2-647c-4b7b-8c68-3c9a3ecb99d9'
const route = (query: string) => resolveLegacyTabRoute(new URLSearchParams(query))

describe('resolveLegacyTabRoute', () => {
  it('sends a members link with an event to that event’s participants', () => {
    expect(route(`tab=members&event=${EVENT}`)).toBe(`/dashboard/events/${EVENT}/participants`)
  })

  it('sends a members link without an event to the participants picker', () => {
    expect(route('tab=members')).toBe('/dashboard/participants')
  })

  it('keeps the event context for a tab that uses it', () => {
    expect(route(`tab=checkin&event=${EVENT}`)).toBe(`/dashboard/checkin?event=${EVENT}`)
  })

  it('keeps the search term of an ambassador link', () => {
    expect(route('tab=ambassadors&search=ana%40example.com')).toBe('/dashboard/ambassadors?search=ana%40example.com')
  })

  it('drops an event id that is not a UUID', () => {
    expect(route('tab=checkin&event=<script>')).toBe('/dashboard/checkin')
  })

  it('ignores unknown tabs and links without a tab', () => {
    expect(route('tab=nope')).toBeNull()
    expect(route('')).toBeNull()
  })
})

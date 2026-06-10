import { describe, it, expect } from 'vitest'
import { filterUpcoming, filterPast, buildRegistrationCount } from './bootcampFilters'
import type { Bootcamp } from '@/types/Bootcamp'

const makeBootcamp = (id: string, starts_at: string): Bootcamp => ({
  id,
  title: `Bootcamp ${id}`,
  description: null,
  image_url: null,
  location_name: 'Lieu',
  location_address: null,
  lat: null,
  lng: null,
  starts_at,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
})

const NOW = new Date('2026-06-15T12:00:00Z')

const PAST_A   = makeBootcamp('past-a',   '2026-06-01T09:00:00Z')
const PAST_B   = makeBootcamp('past-b',   '2026-06-10T09:00:00Z')
const FUTURE_A = makeBootcamp('future-a', '2026-07-01T08:00:00Z')
const FUTURE_B = makeBootcamp('future-b', '2026-07-25T08:00:00Z')
const FUTURE_C = makeBootcamp('future-c', '2026-08-30T15:30:00Z')

describe('filterUpcoming', () => {
  it('retourne uniquement les bootcamps à venir', () => {
    const result = filterUpcoming([PAST_A, FUTURE_A, PAST_B], NOW)
    expect(result.map((b) => b.id)).toEqual(['future-a'])
  })

  it('trie par date croissante', () => {
    const result = filterUpcoming([FUTURE_C, FUTURE_A, FUTURE_B], NOW)
    expect(result.map((b) => b.id)).toEqual(['future-a', 'future-b', 'future-c'])
  })

  it('retourne un tableau vide si tout est passé', () => {
    const result = filterUpcoming([PAST_A, PAST_B], NOW)
    expect(result).toHaveLength(0)
  })

  it('inclut un bootcamp dont starts_at est exactement maintenant', () => {
    const exact = makeBootcamp('exact', NOW.toISOString())
    const result = filterUpcoming([exact], NOW)
    expect(result).toHaveLength(1)
  })
})

describe('filterPast', () => {
  it('retourne uniquement les bootcamps passés', () => {
    const result = filterPast([PAST_A, FUTURE_A, PAST_B], NOW)
    expect(result.map((b) => b.id)).toEqual(['past-b', 'past-a'])
  })

  it('trie par date décroissante (le plus récent en premier)', () => {
    const result = filterPast([PAST_A, PAST_B], NOW)
    expect(result[0].id).toBe('past-b')
    expect(result[1].id).toBe('past-a')
  })

  it('retourne un tableau vide si tout est à venir', () => {
    const result = filterPast([FUTURE_A, FUTURE_B], NOW)
    expect(result).toHaveLength(0)
  })

  it('exclut un bootcamp dont starts_at est exactement maintenant', () => {
    const exact = makeBootcamp('exact', NOW.toISOString())
    const result = filterPast([exact], NOW)
    expect(result).toHaveLength(0)
  })
})

describe('buildRegistrationCount', () => {
  it('extrait le count depuis bootcamp_registrations', () => {
    const data = [
      { bootcamp_registrations: [{ count: 5 }] },
      { bootcamp_registrations: [{ count: 0 }] },
      { bootcamp_registrations: [{ count: 12 }] },
    ]
    expect(buildRegistrationCount(data)).toEqual([5, 0, 12])
  })

  it('retourne 0 si bootcamp_registrations est vide', () => {
    const data = [{ bootcamp_registrations: [] }]
    expect(buildRegistrationCount(data)).toEqual([0])
  })
})

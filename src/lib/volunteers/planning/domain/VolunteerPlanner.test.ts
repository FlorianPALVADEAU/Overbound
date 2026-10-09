import { describe, expect, it } from 'vitest'
import type { Shift } from '../../shared/Shift'
import { assignment, candidate } from '../testing/builders'
import type { Assignment } from './Assignment'
import { VolunteerPlanner } from './VolunteerPlanner'
import { zoneCatalog } from './Zone'
import { ZoneOccupancy } from './ZoneOccupancy'

const planner = new VolunteerPlanner(zoneCatalog)
const zoneOf = (assignments: readonly Assignment[], id: string, shift: Shift) =>
  assignments.find((a) => a.concerns(id, shift))?.zoneKey

describe('VolunteerPlanner', () => {
  it('places a single-zone pod volunteer in that zone for each of their shifts', () => {
    const { assignments, unplaced } = planner.plan({
      candidates: [candidate('a', 'accueil'), candidate('b', 'ravito', ['afternoon'])],
      settings: [],
      existing: [],
    })
    expect(zoneOf(assignments, 'a', 'morning')).toBe('accueil')
    expect(zoneOf(assignments, 'a', 'afternoon')).toBe('accueil')
    expect(zoneOf(assignments, 'b', 'morning')).toBeUndefined()
    expect(zoneOf(assignments, 'b', 'afternoon')).toBe('ravito')
    expect(unplaced).toEqual([])
  })

  it('spreads obstacles volunteers over A-D, C and D getting twice the weight of A and B', () => {
    const candidates = Array.from({ length: 12 }, (_, i) => candidate(`v${String(i).padStart(2, '0')}`, 'obstacles', ['morning']))
    const { assignments } = planner.plan({ candidates, settings: [], existing: [] })
    const count = (zone: string) => assignments.filter((a) => a.zoneKey === zone).length
    expect([count('obstacles_a'), count('obstacles_b'), count('obstacles_c'), count('obstacles_d')]).toEqual([2, 2, 4, 4])
  })

  it('keeps a full-day volunteer in the same obstacles zone morning and afternoon', () => {
    const candidates = Array.from({ length: 6 }, (_, i) => candidate(`v${i}`, 'obstacles'))
    const { assignments } = planner.plan({ candidates, settings: [], existing: [] })
    for (const c of candidates) expect(zoneOf(assignments, c.id, 'afternoon')).toBe(zoneOf(assignments, c.id, 'morning'))
  })

  it('never exceeds a zone capacity and reports who could not be placed', () => {
    const { assignments, unplaced } = planner.plan({
      candidates: [candidate('a', 'accueil', ['morning']), candidate('b', 'accueil', ['morning']), candidate('c', 'accueil', ['morning'])],
      settings: [{ shift: 'morning', zoneKey: 'accueil', capacity: 2, weight: null }],
      existing: [],
    })
    expect(assignments.filter((a) => a.zoneKey === 'accueil')).toHaveLength(2)
    expect(unplaced).toEqual([{ applicationId: 'c', shift: 'morning', reason: 'zone_full' }])
  })

  it('counts hand-entered RESP and AIDE against the zone capacity', () => {
    const { assignments, unplaced } = planner.plan({
      candidates: [candidate('a', 'accueil', ['morning'])],
      settings: [{ shift: 'morning', zoneKey: 'accueil', capacity: 1, weight: null }],
      existing: [assignment(null, 'morning', 'accueil', { role: 'resp', locked: true, name: 'Cécile' })],
    })
    expect(assignments.some((a) => a.applicationId === 'a')).toBe(false)
    expect(unplaced).toHaveLength(1)
  })

  it('sends "let the team decide" volunteers to the zones that are short first', () => {
    const { assignments } = planner.plan({
      candidates: [candidate('a', null, ['morning'])],
      settings: [
        { shift: 'morning', zoneKey: 'sponsors', capacity: 3, weight: null },
        { shift: 'morning', zoneKey: 'ravito', capacity: 1, weight: null },
      ],
      existing: [],
    })
    expect(zoneOf(assignments, 'a', 'morning')).toBe('sponsors')
  })

  it('falls back to the obstacles zones for "let the team decide" when no zone is short', () => {
    const { assignments } = planner.plan({ candidates: [candidate('a', null, ['morning'])], settings: [], existing: [] })
    expect(zoneOf(assignments, 'a', 'morning')).toMatch(/^obstacles_/)
  })

  it('does not move volunteers that are already placed, and only places new ones', () => {
    const { assignments, added } = planner.plan({
      candidates: [candidate('a', 'obstacles', ['morning']), candidate('b', 'obstacles', ['morning'])],
      settings: [],
      existing: [assignment('a', 'morning', 'obstacles_d')],
    })
    expect(zoneOf(assignments, 'a', 'morning')).toBe('obstacles_d')
    expect(added.map((a) => a.applicationId)).toEqual(['b'])
  })

  it('never touches a locked assignment, even if the volunteer asked for another pod', () => {
    const { assignments, removed } = planner.plan({
      candidates: [candidate('a', 'ravito', ['morning'])],
      settings: [],
      existing: [assignment('a', 'morning', 'accueil', { locked: true })],
    })
    expect(zoneOf(assignments, 'a', 'morning')).toBe('accueil')
    expect(removed).toEqual([])
  })

  it('keeps a volunteer promoted to AIDE in place, and does not place them a second time', () => {
    const { assignments, added, removed } = planner.plan({
      candidates: [candidate('a', 'accueil', ['morning'])],
      settings: [],
      existing: [assignment('a', 'morning', 'ravito', { role: 'aide', locked: true })],
    })
    expect(zoneOf(assignments, 'a', 'morning')).toBe('ravito')
    expect(added).toEqual([])
    expect(removed).toEqual([])
  })

  it('drops automatic assignments of volunteers who left or are no longer available', () => {
    const { assignments, removed } = planner.plan({
      candidates: [candidate('a', 'accueil', ['afternoon'])],
      settings: [],
      existing: [assignment('a', 'morning', 'accueil'), assignment('gone', 'morning', 'accueil')],
    })
    expect(removed.map((r) => r.applicationId).sort()).toEqual(['a', 'gone'])
    expect(zoneOf(assignments, 'a', 'afternoon')).toBe('accueil')
  })

  it('is deterministic: the same input always gives the same result', () => {
    const input = { candidates: Array.from({ length: 9 }, (_, i) => candidate(`v${i}`, 'obstacles')), settings: [], existing: [] }
    expect(planner.plan(input).assignments.map((a) => a.toSnapshot())).toEqual(
      planner.plan(input).assignments.map((a) => a.toSnapshot()),
    )
  })
})

describe('ZoneOccupancy', () => {
  it('reports missing people, and flags a zone as full once its target is reached', () => {
    const settings = [{ shift: 'morning' as const, zoneKey: 'accueil', capacity: 2, weight: null }]
    const occupancy = new ZoneOccupancy(zoneCatalog, settings, [assignment('a', 'morning', 'accueil')])
    expect(occupancy.missing('morning', 'accueil')).toBe(1)
    expect(occupancy.isFull('morning', 'accueil')).toBe(false)

    occupancy.add(assignment('b', 'morning', 'accueil'))
    expect(occupancy.isFull('morning', 'accueil')).toBe(true)
    expect(occupancy.isFull('afternoon', 'accueil')).toBe(false)
    expect(occupancy.summary().find((row) => row.shift === 'morning' && row.zoneKey === 'accueil')).toMatchObject({
      count: 2,
      capacity: 2,
      missing: 0,
      full: true,
    })
  })

  it('never reports a zone without target as full', () => {
    const occupancy = new ZoneOccupancy(zoneCatalog, [], [assignment('a', 'morning', 'ravito')])
    expect(occupancy.isFull('morning', 'ravito')).toBe(false)
    expect(occupancy.capacityOf('morning', 'ravito')).toBeNull()
  })
})

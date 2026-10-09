import { describe, expect, it } from 'vitest'
import { zoneCatalog } from '../domain/Zone'
import { assignment, candidate } from '../testing/builders'
import { ZoneOccupancy } from '../domain/ZoneOccupancy'
import { PlanningBoard } from './PlanningBoard'
import type { PlanningView } from './GetPlanning'

const buildBoard = () => {
  const candidates = [candidate('a', 'accueil'), candidate('b', 'ravito', ['morning']), candidate('c', 'accueil', ['afternoon'])]
  const assignments = [
    assignment(null, 'morning', 'accueil', { role: 'resp', name: 'Cécile' }),
    assignment('a', 'morning', 'accueil', { name: 'Zoé' }),
  ]
  const settings = [{ shift: 'morning' as const, zoneKey: 'accueil', capacity: 2, weight: null }]
  const view: PlanningView = {
    candidates: candidates.map((c) => c.toSnapshot()),
    assignments: assignments.map((a) => a.toSnapshot()),
    settings,
    summary: new ZoneOccupancy(zoneCatalog, settings, assignments).summary(),
  }
  return new PlanningBoard(view, zoneCatalog)
}

describe('PlanningBoard', () => {
  it('lists leads before volunteers in a zone', () => {
    expect(buildBoard().people('morning', 'accueil').map((p) => p.displayName)).toEqual(['Cécile', 'Zoé'])
  })

  it('marks a zone as full once its target is reached, and only on that shift', () => {
    const board = buildBoard()
    expect(board.isFull('morning', 'accueil')).toBe(true)
    expect(board.isFull('afternoon', 'accueil')).toBe(false)
    expect(board.isFull('morning', 'ravito')).toBe(false)
  })

  it('lists who still needs a zone on a given shift', () => {
    const board = buildBoard()
    expect(board.unassigned('morning').map((c) => c.id)).toEqual(['b'])
    expect(board.unassigned('afternoon').map((c) => c.id)).toEqual(['a', 'c'])
  })

  it('counts the missing people over a shift', () => {
    expect(buildBoard().missingTotal('morning')).toBe(0)
  })
})

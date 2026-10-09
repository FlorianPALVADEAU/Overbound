import { describe, expect, it } from 'vitest'
import { PlanningError } from '../domain/errors'
import { PlanningSheet } from '../domain/PlanningSheet'
import { VolunteerPlanner } from '../domain/VolunteerPlanner'
import { zoneCatalog } from '../domain/Zone'
import { InMemoryPlanningRepository } from '../testing/InMemoryPlanningRepository'
import { assignment, candidate } from '../testing/builders'
import { AssignManually } from './AssignManually'
import { ConfigureZone } from './ConfigureZone'
import { ExportPlanning } from './ExportPlanning'
import { GetPlanning } from './GetPlanning'
import { RemoveAssignment } from './RemoveAssignment'
import { RunAutoAssignment } from './RunAutoAssignment'
import type { PlanningWorkbookWriter } from './ports'

describe('RunAutoAssignment', () => {
  it('stores the new placements and drops the ones that are no longer valid', async () => {
    const repository = new InMemoryPlanningRepository([candidate('a', 'accueil', ['morning'])])
    await repository.saveAssignment('evt', assignment('gone', 'morning', 'accueil'))

    const outcome = await new RunAutoAssignment(repository, new VolunteerPlanner(zoneCatalog)).execute('evt')

    expect(outcome).toMatchObject({ added: 1, removed: 1, unplaced: [] })
    expect(repository.assignments.map((a) => a.applicationId)).toEqual(['a'])
  })

  it('reports volunteers it could not place instead of failing', async () => {
    const repository = new InMemoryPlanningRepository([candidate('a', 'accueil', ['morning'])])
    repository.settings = [{ shift: 'morning', zoneKey: 'accueil', capacity: 0, weight: null }]

    const outcome = await new RunAutoAssignment(repository, new VolunteerPlanner(zoneCatalog)).execute('evt')

    expect(outcome.added).toBe(0)
    expect(outcome.unplaced).toEqual([{ applicationId: 'a', shift: 'morning', reason: 'zone_full' }])
  })
})

describe('AssignManually', () => {
  const command = { eventId: 'evt', applicationId: 'a', displayName: 'Anaïs DUPONT', shift: 'morning' as const, zoneKey: 'ravito', role: 'member' as const }

  it('locks the assignment and replaces the previous zone of the same volunteer', async () => {
    const repository = new InMemoryPlanningRepository()
    await repository.saveAssignment('evt', assignment('a', 'morning', 'accueil'))

    await new AssignManually(repository, zoneCatalog).execute(command)

    expect(repository.assignments).toHaveLength(1)
    expect(repository.assignments[0]).toMatchObject({ zoneKey: 'ravito', locked: true })
  })

  it('refuses an unknown zone and an empty name', async () => {
    const useCase = new AssignManually(new InMemoryPlanningRepository(), zoneCatalog)
    await expect(useCase.execute({ ...command, zoneKey: 'nope' })).rejects.toThrow(PlanningError)
    await expect(useCase.execute({ ...command, displayName: '  ' })).rejects.toThrow(PlanningError)
  })

  it('promotes a volunteer to AIDE or RESP while keeping the link with their application', async () => {
    const repository = new InMemoryPlanningRepository()
    await repository.saveAssignment('evt', assignment('a', 'morning', 'ravito'))
    const [placed] = repository.assignments
    const useCase = new AssignManually(repository, zoneCatalog)

    await useCase.execute({ ...command, assignmentId: placed.id, role: 'aide' })
    expect(repository.assignments).toHaveLength(1)
    expect(repository.assignments[0]).toMatchObject({ applicationId: 'a', role: 'aide', locked: true })

    await useCase.execute({ ...command, assignmentId: placed.id, role: 'resp' })
    expect(repository.assignments[0].role).toBe('resp')
  })

  it('moves an existing RESP by id instead of duplicating it', async () => {
    const repository = new InMemoryPlanningRepository()
    await repository.saveAssignment('evt', assignment(null, 'morning', 'accueil', { role: 'resp', name: 'Cécile' }))
    const [lead] = repository.assignments

    await new AssignManually(repository, zoneCatalog).execute({
      eventId: 'evt',
      assignmentId: lead.id,
      applicationId: null,
      displayName: 'Cécile',
      shift: 'morning',
      zoneKey: 'consignes',
      role: 'resp',
    })

    expect(repository.assignments).toHaveLength(1)
    expect(repository.assignments[0].zoneKey).toBe('consignes')
  })
})

describe('RemoveAssignment', () => {
  it('removes the assignment', async () => {
    const repository = new InMemoryPlanningRepository()
    await repository.saveAssignment('evt', assignment('a', 'morning', 'accueil'))
    await new RemoveAssignment(repository).execute('evt', repository.assignments[0].id as string)
    expect(repository.assignments).toEqual([])
  })
})

describe('ConfigureZone', () => {
  it('saves a target and replaces the previous one for the same zone and shift', async () => {
    const repository = new InMemoryPlanningRepository()
    const useCase = new ConfigureZone(repository, zoneCatalog)
    await useCase.execute('evt', { shift: 'morning', zoneKey: 'accueil', capacity: 4, weight: null })
    await useCase.execute('evt', { shift: 'morning', zoneKey: 'accueil', capacity: 6, weight: null })
    expect(repository.settings).toEqual([{ shift: 'morning', zoneKey: 'accueil', capacity: 6, weight: null }])
  })

  it('refuses an unknown zone, a negative target and a zero weight', async () => {
    const useCase = new ConfigureZone(new InMemoryPlanningRepository(), zoneCatalog)
    const base = { shift: 'morning' as const, zoneKey: 'accueil', capacity: 1, weight: null }
    await expect(useCase.execute('evt', { ...base, zoneKey: 'nope' })).rejects.toThrow(PlanningError)
    await expect(useCase.execute('evt', { ...base, capacity: -1 })).rejects.toThrow(PlanningError)
    await expect(useCase.execute('evt', { ...base, weight: 0 })).rejects.toThrow(PlanningError)
  })
})

describe('GetPlanning', () => {
  it('returns candidates, assignments and the zones that are short', async () => {
    const repository = new InMemoryPlanningRepository([candidate('a', 'accueil')])
    repository.settings = [{ shift: 'morning', zoneKey: 'accueil', capacity: 3, weight: null }]
    await repository.saveAssignment('evt', assignment('a', 'morning', 'accueil'))

    const view = await new GetPlanning(repository, zoneCatalog).execute('evt')

    expect(view.candidates.map((c) => c.id)).toEqual(['a'])
    expect(view.assignments).toHaveLength(1)
    expect(view.summary.find((row) => row.shift === 'morning' && row.zoneKey === 'accueil')).toMatchObject({ missing: 2, full: false })
  })
})

describe('ExportPlanning', () => {
  const writer: PlanningWorkbookWriter & { calls: string[] } = {
    calls: [],
    async write(title) {
      this.calls.push(title)
      return new Uint8Array([1, 2, 3])
    },
  }

  it('names the file and the title after the event year', async () => {
    const repository = new InMemoryPlanningRepository([], '2026-09-12T08:00:00Z')
    const file = await new ExportPlanning(repository, new PlanningSheet(zoneCatalog), writer).execute('evt')
    expect(file.filename).toBe('planning-benevoles-2026.xlsx')
    expect(writer.calls).toEqual(['Planning bénévoles Overbound 2026'])
    expect(file.content).toEqual(new Uint8Array([1, 2, 3]))
  })

  it('does not swallow a writer failure', async () => {
    const failing: PlanningWorkbookWriter = { write: async () => Promise.reject(new Error('disk full')) }
    await expect(
      new ExportPlanning(new InMemoryPlanningRepository(), new PlanningSheet(zoneCatalog), failing).execute('evt'),
    ).rejects.toThrow('disk full')
  })
})

'use client'

import type { PlanningBoard } from '@/lib/volunteers/planning/application/PlanningBoard'
import type { VolunteerCandidateSnapshot } from '@/lib/volunteers/planning/domain/VolunteerCandidate'
import { podCatalog } from '@/lib/volunteers/shared/Pod'
import type { Shift } from '@/lib/volunteers/shared/Shift'

interface UnassignedListProps {
  board: PlanningBoard
  shift: Shift
  onAssign: (candidate: VolunteerCandidateSnapshot, zoneKey: string) => void
}

export function UnassignedList({ board, shift, onAssign }: UnassignedListProps) {
  const candidates = board.unassigned(shift)

  return (
    <section className="space-y-3">
      <h3 className="text-lg font-semibold">À placer ({candidates.length})</h3>
      {candidates.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tous les bénévoles disponibles sur ce créneau ont une zone.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {candidates.map((candidate) => (
            <li key={candidate.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{candidate.fullName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  Préférence : {podCatalog.findByTitle(candidate.mission)?.title ?? candidate.mission} ·{' '}
                  {candidate.availability}
                  {candidate.multiEvent ? ' · événement non précisé' : ''}
                </p>
              </div>
              <select
                aria-label={`Placer ${candidate.fullName}`}
                defaultValue=""
                onChange={(event) => event.target.value && onAssign(candidate, event.target.value)}
                className="h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="">Choisir une zone…</option>
                {board.zones().map((zone) => {
                  const full = board.isFull(shift, zone.key)
                  return (
                    <option key={zone.key} value={zone.key} disabled={full}>
                      {zone.label}
                      {full ? ' (complet)' : ''}
                    </option>
                  )
                })}
              </select>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

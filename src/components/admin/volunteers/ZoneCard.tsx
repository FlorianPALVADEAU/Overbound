'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { PlanningBoard } from '@/lib/volunteers/planning/application/PlanningBoard'
import { ASSIGNMENT_ROLE_OPTIONS, type AssignmentRole, type AssignmentSnapshot } from '@/lib/volunteers/planning/domain/Assignment'
import type { Zone } from '@/lib/volunteers/planning/domain/Zone'
import type { Shift } from '@/lib/volunteers/shared/Shift'
import { cn } from '@/lib/utils'

interface ZoneCardProps {
  board: PlanningBoard
  zone: Zone
  shift: Shift
  onCapacityChange: (capacity: number | null) => void
  onMove: (assignment: AssignmentSnapshot, zoneKey: string) => void
  onChangeRole: (assignment: AssignmentSnapshot, role: AssignmentRole) => void
  onRemove: (assignment: AssignmentSnapshot) => void
  onAddPerson: (name: string, role: AssignmentRole) => void
}

export function ZoneCard({ board, zone, shift, onCapacityChange, onMove, onChangeRole, onRemove, onAddPerson }: ZoneCardProps) {
  const [personName, setPersonName] = useState('')
  const [personRole, setPersonRole] = useState<AssignmentRole>('member')
  const summary = board.summaryOf(shift, zone.key)
  const people = board.people(shift, zone.key)

  return (
    <Card className={cn(summary.full && 'bg-muted/60 opacity-70', summary.missing > 0 && 'border-destructive/50')}>
      <CardHeader className="space-y-2 pb-2">
        <CardTitle className="text-base">{zone.label}</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={summary.full ? 'outline' : summary.missing > 0 ? 'destructive' : 'secondary'}>
            {summary.count}
            {summary.capacity !== null ? ` / ${summary.capacity}` : ''}
          </Badge>
          {summary.full ? <span className="text-xs font-medium text-muted-foreground">Complet</span> : null}
          {summary.missing > 0 ? <span className="text-xs text-destructive">Il manque {summary.missing}</span> : null}
          <label className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            Cible
            <Input
              key={summary.capacity ?? 'none'}
              type="number"
              min={0}
              placeholder="–"
              defaultValue={summary.capacity ?? ''}
              className="h-8 w-16"
              onBlur={(event) => {
                const raw = event.target.value.trim()
                const next = raw === '' ? null : Math.max(0, Math.floor(Number(raw)))
                if (next !== summary.capacity && (next === null || Number.isFinite(next))) onCapacityChange(next)
              }}
            />
          </label>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-1.5">
          {people.map((person) => (
            <li key={person.id} className="flex items-center gap-2 text-sm">
              <select
                aria-label={`Rôle de ${person.displayName}`}
                value={person.role}
                onChange={(event) => onChangeRole(person, event.target.value as AssignmentRole)}
                className="h-8 shrink-0 rounded-md border bg-background px-1 text-xs font-medium"
              >
                {ASSIGNMENT_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="min-w-0 flex-1 truncate">{person.displayName}</span>
              <select
                aria-label={`Déplacer ${person.displayName}`}
                value={zone.key}
                onChange={(event) => onMove(person, event.target.value)}
                className="h-8 max-w-28 rounded-md border bg-background px-1 text-xs"
              >
                {board.zones().map((target) => (
                  <option key={target.key} value={target.key} disabled={target.key !== zone.key && board.isFull(shift, target.key)}>
                    {target.label}
                    {target.key !== zone.key && board.isFull(shift, target.key) ? ' (complet)' : ''}
                  </option>
                ))}
              </select>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Retirer ${person.displayName}`} onClick={() => onRemove(person)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
          {people.length === 0 ? <li className="text-sm text-muted-foreground">Personne pour l’instant.</li> : null}
        </ul>

        <form
          className="flex gap-1.5"
          onSubmit={(event) => {
            event.preventDefault()
            const name = personName.trim()
            if (!name) return
            onAddPerson(name, personRole)
            setPersonName('')
          }}
        >
          <select
            aria-label="Rôle"
            value={personRole}
            onChange={(event) => setPersonRole(event.target.value as AssignmentRole)}
            className="h-8 rounded-md border bg-background px-1 text-xs"
          >
            {ASSIGNMENT_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Input value={personName} onChange={(event) => setPersonName(event.target.value)} placeholder="Nom" className="h-8 min-w-0 flex-1" />
          <Button type="submit" size="sm" variant="outline" disabled={!personName.trim()}>
            Ajouter
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

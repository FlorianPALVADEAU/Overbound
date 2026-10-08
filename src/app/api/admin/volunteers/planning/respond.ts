import { NextResponse } from 'next/server'
import { PlanningError } from '@/lib/volunteers/planning/domain/errors'

// Règle métier non respectée → 422 avec le message ; tout le reste → 500 sans détail.
export const respondToPlanningError = (error: unknown, context: string): NextResponse => {
  if (error instanceof PlanningError) return NextResponse.json({ error: error.message }, { status: 422 })
  console.error(`[admin volunteer planning] ${context}`, error)
  return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
}

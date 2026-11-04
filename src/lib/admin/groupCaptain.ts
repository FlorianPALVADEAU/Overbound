import { NextResponse } from 'next/server'

/** Erreurs levées par admin_set_group_captain (migration 20261106100000), traduites en réponse HTTP. */
export function captainChangeErrorResponse(error: { code?: string; message: string }, logLabel: string) {
  if (error.code === 'P0002') {
    return NextResponse.json({ error: 'Groupe introuvable' }, { status: 404 })
  }
  if (error.code === '23514') {
    return NextResponse.json({ error: 'Le capitaine doit être membre du groupe' }, { status: 400 })
  }
  console.error(`[${logLabel}] rpc error`, error)
  return NextResponse.json({ error: 'Erreur délégation' }, { status: 500 })
}

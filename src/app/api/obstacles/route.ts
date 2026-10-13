import { NextResponse } from 'next/server'
import { loadPublicObstacles } from '@/lib/obstacles/loadPublicObstacles'

export async function GET() {
  try {
    return NextResponse.json(await loadPublicObstacles())
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur serveur' }, { status: 500 })
  }
}

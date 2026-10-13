'use server'

import { NextResponse } from 'next/server'
import { loadActivePromotions } from '@/lib/promotions/loadActivePromotions'

export async function GET() {
  try {
    const promotions = await loadActivePromotions()
    return NextResponse.json({ promotions })
  } catch (error) {
    console.error('Erreur GET promotions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

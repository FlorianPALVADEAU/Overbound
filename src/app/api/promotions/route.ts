'use server'

import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const nowIso = new Date().toISOString()

    const { data: promotions, error } = await supabase
      .from('site_promotions')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', nowIso)
      .gte('ends_at', nowIso)
      .order('starts_at', { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json({ promotions: promotions ?? [] })
  } catch (error) {
    console.error('Erreur GET promotions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

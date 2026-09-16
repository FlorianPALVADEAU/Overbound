import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const admin = supabaseAdmin()
    const { data: codes, error } = await admin
      .from('promotional_codes')
      .select('id, code, name, is_active')
      .order('code', { ascending: true })

    if (error) {
      console.error('[admin groups] promo codes fetch error', error)
      return NextResponse.json({ error: 'Erreur chargement codes promo' }, { status: 500 })
    }

    return NextResponse.json({ codes: codes ?? [] })
  } catch (error) {
    console.error('[admin groups] promo codes unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

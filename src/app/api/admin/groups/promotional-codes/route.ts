import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
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

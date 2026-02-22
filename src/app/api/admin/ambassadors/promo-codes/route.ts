import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

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
    const { data: promotionalCodes, error: codesError } = await admin
      .from('promotional_codes')
      .select('id, code, name, is_active')
      .eq('is_active', true)
      .order('code', { ascending: true })

    if (codesError) {
      console.error('[admin ambassadors] promo codes error', codesError)
      return NextResponse.json({ error: 'Erreur codes promo' }, { status: 500 })
    }

    const { data: ambassadors, error: ambassadorsError } = await admin
      .from('ambassadors')
      .select('profile_id, promotional_code_id')

    if (ambassadorsError) {
      console.error('[admin ambassadors] ambassadors error', ambassadorsError)
      return NextResponse.json({ error: 'Erreur ambassadeurs' }, { status: 500 })
    }

    const assignedMap = new Map<string, string>()
    ambassadors?.forEach((row: any) => {
      if (row.promotional_code_id) {
        assignedMap.set(row.promotional_code_id, row.profile_id)
      }
    })

    const codes = (promotionalCodes || []).map((code: any) => ({
      id: code.id,
      code: code.code,
      name: code.name ?? null,
      is_active: code.is_active ?? true,
      assigned_profile_id: assignedMap.get(code.id) ?? null,
    }))

    return NextResponse.json({ codes })
  } catch (error) {
    console.error('[admin ambassadors] promo codes error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

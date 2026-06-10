import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export const runtime = 'nodejs'

async function ensureAdmin(request: NextRequest) {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) }
  }

  return { user }
}

export async function GET(request: NextRequest) {
  try {
    const { error } = await ensureAdmin(request)
    if (error) return error

    const admin = supabaseAdmin()

    const { data: ambassadors, error: ambassadorsError } = await admin
      .from('ambassadors')
      .select('id, profile_id, is_active, promo:promotional_codes(code)')
      .order('created_at', { ascending: false })

    if (ambassadorsError) {
      console.error('[admin ambassadors points] ambassadors error', ambassadorsError)
      return NextResponse.json({ error: 'Erreur ambassadeurs' }, { status: 500 })
    }

    const ambassadorRows = (ambassadors || []) as Array<{
      id: string
      profile_id: string
      is_active: boolean
      promo: { code?: string | null } | Array<{ code?: string | null }> | null
    }>

    const profileIds = ambassadorRows.map((row) => row.profile_id)
    const ambassadorIds = ambassadorRows.map((row) => row.id)

    const [{ data: profiles }, { data: points }] = await Promise.all([
      profileIds.length > 0
        ? admin.from('profiles').select('id, full_name').in('id', profileIds)
        : Promise.resolve({ data: [] }),
      ambassadorIds.length > 0
        ? admin.from('ambassador_points').select('ambassador_id, total_points, recruits_open, recruits_ranked').in('ambassador_id', ambassadorIds)
        : Promise.resolve({ data: [] }),
    ])

    const profileMap = new Map((profiles || []).map((row: any) => [row.id, row.full_name ?? null]))
    const pointsMap = new Map((points || []).map((row: any) => [row.ambassador_id, row]))

    const response = ambassadorRows.map((row) => {
      const promoValue = Array.isArray(row.promo) ? row.promo?.[0] : row.promo
      const pointRow = pointsMap.get(row.id)
      return {
        ambassador_id: row.id,
        profile_id: row.profile_id,
        ambassador_name: profileMap.get(row.profile_id) ?? 'Ambassadeur',
        ambassador_code: promoValue?.code ?? null,
        is_active: row.is_active,
        total_points: pointRow?.total_points ?? 0,
        recruits_open: pointRow?.recruits_open ?? 0,
        recruits_ranked: pointRow?.recruits_ranked ?? 0,
      }
    })

    return NextResponse.json({ ambassadors: response })
  } catch (error) {
    console.error('[admin ambassadors points] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { hasAmbassadorAccess } from '@/lib/ambassadors/access'
import { loadCurrentSeason } from '@/lib/ambassadors/season'
import { loadAmbassadorDashboard, loadEmptyAmbassadorDashboard } from '@/lib/ambassadors/dashboard/loadAmbassadorDashboard'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const viewAs = searchParams.get('view_as')

    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle()
    if (profileError) {
      console.error('[ambassador dashboard] profile error', profileError)
      return NextResponse.json({ error: 'Erreur profil' }, { status: 500 })
    }

    const role = profile?.role ?? null
    // view_as is admin-only.
    if (viewAs && role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }
    if (!viewAs && !hasAmbassadorAccess({ role, email: user.email ?? null })) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const admin = supabaseAdmin()
    const ambassadors = admin.from('ambassadors').select('id, promotional_code_id').eq('is_active', true)
    const { data: ambassador, error: ambassadorError } = await (viewAs
      ? ambassadors.eq('id', viewAs)
      : ambassadors.eq('profile_id', user.id)
    ).maybeSingle()
    if (ambassadorError) {
      console.error('[ambassador dashboard] ambassador error', ambassadorError)
      return NextResponse.json({ error: 'Erreur ambassadeur' }, { status: 500 })
    }

    const season = await loadCurrentSeason(admin)
    const dashboard = ambassador
      ? await loadAmbassadorDashboard(admin, ambassador, season)
      : await loadEmptyAmbassadorDashboard(admin, season)
    return NextResponse.json(dashboard)
  } catch (error) {
    console.error('[ambassador dashboard] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

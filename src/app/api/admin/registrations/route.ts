import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')
    const approvalFilter = searchParams.get('approval_filter')
    const searchTerm = searchParams.get('search_term')
    const limitCount = parseInt(searchParams.get('limit') || '50')
    const offsetCount = parseInt(searchParams.get('offset') || '0')

    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier le rôle admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

  const { data, error } = await supabase.rpc('get_registrations_with_filters', {
    args: {
      approval: approvalFilter === 'all' ? null : approvalFilter,
      event_id: eventId || null,
      search: searchTerm || null,
      limit: Number.isFinite(limitCount) ? limitCount : 50,
      offset: Number.isFinite(offsetCount) ? offsetCount : 0,
    },
  });

  if (error) throw error;

  const rows = data ?? [];
  const totalCount = rows[0]?.total_count ?? 0;

  return NextResponse.json({
    registrations: rows,
    totalCount,
  });


  } catch (error) {
    console.error('Erreur GET registrations:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
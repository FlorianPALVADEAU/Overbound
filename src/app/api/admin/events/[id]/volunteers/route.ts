import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'

const handleGetVolunteers = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> => {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { id } = await params

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
    const { data: volunteers, error } = await admin
      .from('volunteer_applications')
      .select(
        'id, full_name, email, phone, availability, preferred_mission, experience, motivations, event_id, event_snapshot, submitted_at',
      )
      .or(`event_id.eq.${id},event_snapshot->>id.eq.${id}`)
      .order('submitted_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      volunteers: volunteers ?? [],
    })
  } catch (error) {
    console.error('[admin event volunteers] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const GET = withRequestLogging(handleGetVolunteers, {
  actionType: 'Consultation bénévoles événement admin',
})

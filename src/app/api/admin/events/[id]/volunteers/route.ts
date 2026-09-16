import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'

const handleGetVolunteers = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> => {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }
    const { id } = await params

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

import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: registration, error } = await supabase
      .from('registrations')
      .select(
        `*,
        ticket:tickets (
          id,
          name,
          description,
          requires_document,
          document_types,
          race:races!tickets_race_id_fkey (
            id,
            name,
            type,
            difficulty,
            distance_km
          )
        ),
        event:events (
          id,
          title,
          subtitle,
          date,
          location
        )
      `,
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !registration) {
      return NextResponse.json({ error: 'Inscription introuvable' }, { status: 404 })
    }

    return NextResponse.json({ registration })
  } catch (err) {
    console.error('[document-data] unexpected error', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

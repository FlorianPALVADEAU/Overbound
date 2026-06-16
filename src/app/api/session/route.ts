import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { resolveRequestUser } from '@/lib/auth/resolveRequestUser'

export async function GET(request: Request) {
  try {
    const user = await resolveRequestUser(request)

    if (!user) {
      return NextResponse.json(
        {
          error: 'Non authentifié',
          code: 'UNAUTHENTICATED',
          user: null,
          profile: null,
        },
        { status: 401 },
      )
    }

    const admin = supabaseAdmin()

    const { data: profileData } = await admin
      .from('profiles')
      .select('full_name, phone, date_of_birth, marketing_opt_in, role')
      .eq('id', user.id)
      .single()
    const profile =
      profileData !== null
        ? {
            ...profileData,
            avatar_url: (user.user_metadata as Record<string, any> | undefined)?.avatar_url ?? null,
          }
        : null

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        user_metadata: user.user_metadata,
      },
      profile: profile ?? null,
      alerts: {
        needs_document_action: false,
      },
    })
  } catch (error) {
    console.error('[session] fetch error', error)
    return NextResponse.json({ error: 'Erreur récupération session' }, { status: 500 })
  }
}

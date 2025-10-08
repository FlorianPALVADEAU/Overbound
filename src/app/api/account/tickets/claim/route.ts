import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const token = typeof body?.token === 'string' ? body.token.trim() : ''

    if (!token) {
      return NextResponse.json({ error: 'Lien invalide.' }, { status: 400 })
    }

    const admin = supabaseAdmin()

    const { data: registration, error: fetchError } = await admin
      .from('registrations')
      .select(
        `
          id,
          user_id,
          transfer_token,
          claim_status,
          is_affiliated,
          event_id,
          ticket_id
        `,
      )
      .eq('transfer_token', token)
      .maybeSingle()

    if (fetchError) {
      console.error('[claim] lookup error', fetchError)
      return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
    }

    if (!registration) {
      return NextResponse.json({ error: 'Ce billet n’existe plus ou a été réclamé.' }, { status: 404 })
    }

    if (!registration.transfer_token || registration.transfer_token !== token) {
      return NextResponse.json({ error: 'Ce lien a déjà été utilisé.' }, { status: 409 })
    }

    if (registration.user_id === user.id) {
      return NextResponse.json({ error: 'Ce billet est déjà associé à votre compte.' }, { status: 409 })
    }

    const { error: updateError } = await admin
      .from('registrations')
      .update({
        user_id: user.id,
        email: user.email,
        transfer_token: null,
        claim_status: 'claimed',
        is_affiliated: true,
        guarantor_user_id: registration.user_id,
      })
      .eq('id', registration.id)

    if (updateError) {
      console.error('[claim] update error', updateError)
      return NextResponse.json({ error: 'Impossible de transférer ce billet.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, registrationId: registration.id })
  } catch (error) {
    console.error('[claim] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ user: null, profile: null })
    }

    const { data: profileData } = await supabase
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

    let needsDocumentAction = false
    try {
      const admin = supabaseAdmin()
      const { data: registrationMeta } = await admin
        .from('registrations')
        .select(
          `
          id,
          approval_status,
          document_url,
          ticket:tickets(
            requires_document,
            events (
              date
            )
          )
        `,
        )
        .eq('user_id', user.id)

      type RegistrationAlertRow = {
        approval_status: 'pending' | 'approved' | 'rejected' | null
        document_url: string | null
        ticket:
          | {
              requires_document: boolean | null
              events?: Array<{ date: string | null }> | null
            }
          | null
      }

      const now = new Date()
      needsDocumentAction = ((registrationMeta as RegistrationAlertRow[] | null) ?? []).some(
        ({ ticket, approval_status, document_url }) => {
          const requiresDocument = Boolean(ticket?.requires_document)
          if (!requiresDocument) {
            return false
          }

          const eventDateRaw = ticket?.events?.[0]?.date ?? null
          const eventDate = eventDateRaw ? new Date(eventDateRaw) : null
          const isUpcoming = eventDate ? eventDate >= now : false
          if (!isUpcoming) {
            return false
          }

          if (!document_url) {
            return true
          }

          return approval_status !== 'approved'
        },
      )
    } catch (sessionAlertError) {
      console.warn('[session] unable to compute document alerts', sessionAlertError)
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        user_metadata: user.user_metadata,
      },
      profile: profile ?? null,
      alerts: {
        needs_document_action: needsDocumentAction,
      },
    })
  } catch (error) {
    console.error('[session] fetch error', error)
    return NextResponse.json({ error: 'Erreur récupération session' }, { status: 500 })
  }
}

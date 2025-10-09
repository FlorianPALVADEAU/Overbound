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

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

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
          ticket:tickets(requires_document)
        `,
        )
        .eq('user_id', user.id)

      type RegistrationAlertRow = {
        approval_status: 'pending' | 'approved' | 'rejected' | null
        document_url: string | null
        ticket: { requires_document: boolean | null } | null
      }

      needsDocumentAction = ((registrationMeta as RegistrationAlertRow[] | null) ?? []).some(
        ({ ticket, approval_status, document_url }) => {
          const requiresDocument = Boolean(ticket?.requires_document)
          if (!requiresDocument) {
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

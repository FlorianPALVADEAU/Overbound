import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { processAccountEngagementEmails } from '@/lib/email/engagement'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
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

    const { data: registrations, error } = await supabase
      .from('my_registrations')
      .select('*')
      .eq('user_id', user.id)
      .order('registration_id', { ascending: false })

    if (error) {
      console.error('[account api] registrations error', error)
    }

    const registrationIds = (registrations ?? []).map((registration) => registration.registration_id)
    const admin = supabaseAdmin()
    type RegistrationMetaRow = {
      id: string
      transfer_token: string | null
      approval_status: 'pending' | 'approved' | 'rejected' | null
      document_url: string | null
      ticket: { requires_document: boolean | null } | null
    }

    const registrationMetaMap = new Map<
      string,
      {
        transfer_token: string | null
        approval_status: 'pending' | 'approved' | 'rejected'
        document_url: string | null
        requires_document: boolean
      }
    >()

    if (registrationIds.length > 0) {
      const { data: metaRows, error: metaError } = await admin
        .from('registrations')
        .select(
          `
          id,
          transfer_token,
          approval_status,
          document_url,
          ticket:tickets(requires_document)
        `,
        )
        .in('id', registrationIds)

      if (metaError) {
        console.error('[account api] registration meta error', metaError)
      } else if (metaRows) {
        for (const row of metaRows as any[]) {
          const requiresDocument = Boolean(row.ticket?.requires_document)
          registrationMetaMap.set(row.id, {
            transfer_token: row.transfer_token ?? null,
            approval_status: (row.approval_status ?? 'pending') as 'pending' | 'approved' | 'rejected',
            document_url: row.document_url ?? null,
            requires_document: requiresDocument,
          })
        }
      }
    }

    const registrationsWithQr = await Promise.all(
      (registrations ?? []).map(async (registration) => {
        const meta = registrationMetaMap.get(registration.registration_id) ?? {
          transfer_token: null,
          approval_status: 'pending' as const,
          document_url: null,
          requires_document: false,
        }

        const qrCodeDataUrl =
          registration.qr_code_token && registration.qr_code_token.length > 0
            ? await QRCode.toDataURL(registration.qr_code_token)
            : null

        const documentRequiresAttention =
          meta.requires_document && (meta.approval_status !== 'approved' || !meta.document_url)

        return {
          ...registration,
          transfer_token: meta.transfer_token,
          approval_status: meta.approval_status,
          document_url: meta.document_url,
          requires_document: meta.requires_document,
          document_requires_attention: documentRequiresAttention,
          qr_code_data_url: qrCodeDataUrl,
        }
      }),
    )

    const now = new Date()
    const totalEvents = registrationsWithQr.length
    const checkedInEvents = registrationsWithQr.filter((entry) => entry.checked_in).length
    const upcomingEvents = registrationsWithQr.filter((entry) => {
      if (!entry.event_date) return false
      const eventDate = new Date(entry.event_date)
      return eventDate > now
    }).length

    await processAccountEngagementEmails({
      userId: user.id,
      email: user.email ?? '',
      fullName: profile?.full_name ?? user.user_metadata?.full_name ?? null,
      userCreatedAt: user.created_at ?? null,
      profile,
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        created_at: user.created_at,
      },
      profile,
      stats: {
        totalEvents,
        checkedInEvents,
        upcomingEvents,
      },
      registrations: registrationsWithQr,
    })
  } catch (err) {
    console.error('[account api] unexpected error', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

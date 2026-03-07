import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { resolveRequestUser } from '@/lib/auth/resolveRequestUser'

export async function GET(request: Request) {
  try {
    const user = await resolveRequestUser(request)

    if (!user) {
      return NextResponse.json({ user: null, profile: null })
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

    let needsDocumentAction = false
    try {
      const { data: registrationMeta } = await admin
        .from('registrations')
        .select(
          `
          id,
          approval_status,
          document_url,
          ticket:tickets(
            requires_document,
            document_types,
            event:events (
              date
            )
          )
        `,
        )
        .eq('user_id', user.id)

      type RegistrationAlertRow = {
        id: string
        approval_status: 'pending' | 'approved' | 'rejected' | null
        document_url: string | null
        ticket:
          | {
              requires_document: boolean | null
              document_types?: string[] | null
              event?: { date: string | null } | null
            }
          | null
      }

      const now = new Date()
      const registrationRows = (registrationMeta as RegistrationAlertRow[] | null) ?? []
      const registrationIds = registrationRows.map((row) => row.id)

      const documentTypeMap = new Map<string, Set<string>>()
      if (registrationIds.length > 0) {
        const { data: documentRows, error: documentError } = await admin
          .from('registration_documents')
          .select('registration_id, document_type')
          .in('registration_id', registrationIds)

        if (documentError) {
          console.warn('[session] registration documents error', documentError)
        } else if (documentRows) {
          for (const row of documentRows as any[]) {
            if (!documentTypeMap.has(row.registration_id)) {
              documentTypeMap.set(row.registration_id, new Set())
            }
            if (row.document_type) {
              documentTypeMap.get(row.registration_id)!.add(row.document_type)
            }
          }
        }
      }

      const isPpsType = (value: string) => value.toLowerCase().includes('pps')

      needsDocumentAction = registrationRows.some(
        ({ id, ticket, approval_status, document_url }) => {
          const requiresDocument = Boolean(ticket?.requires_document)
          if (!requiresDocument) {
            return false
          }

          const eventDateRaw = ticket?.event?.date ?? null
          const eventDate = eventDateRaw ? new Date(eventDateRaw) : null
          const isUpcoming = eventDate ? eventDate >= now : false
          if (!isUpcoming) {
            return false
          }

          const uploadedCount = documentTypeMap.get(id)?.size ?? (document_url ? 1 : 0)
          const requiredCount =
            ticket?.document_types && ticket.document_types.length > 0
              ? ticket.document_types.length
              : 1

          const requiredTypes = Array.isArray(ticket?.document_types) ? ticket!.document_types! : []
          const uploadedTypes = documentTypeMap.get(id)
            ? Array.from(documentTypeMap.get(id)!)
            : []
          const missingTypes = requiredTypes.length > 0
            ? requiredTypes.filter((type) => !uploadedTypes.includes(type))
            : []

          if (eventDate && missingTypes.length > 0 && missingTypes.every((type) => isPpsType(type))) {
            const earliestAllowed = new Date(eventDate)
            earliestAllowed.setMonth(earliestAllowed.getMonth() - 3)
            if (Date.now() < earliestAllowed.getTime()) {
              return false
            }
          }

          if (uploadedCount < requiredCount) {
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

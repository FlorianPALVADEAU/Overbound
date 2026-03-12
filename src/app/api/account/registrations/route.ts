import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { supabaseAdmin } from '@/lib/supabase/server'
import { resolveRequestUser } from '@/lib/auth/resolveRequestUser'
import { processAccountEngagementEmails } from '@/lib/email/engagement'
import { computeDocumentAction } from '@/lib/documents/documentAction'

export const runtime = 'nodejs'

const normalizeViewRegistration = (row: any) => ({
  ...row,
  registration_id: row.registration_id ?? row.id,
  registration_created_at: row.registration_created_at ?? row.created_at ?? null,
})

const firstRelation = <T,>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

const normalizeDirectRegistration = (row: any) => {
  const ticket = firstRelation(row.ticket)
  const event = firstRelation(row.event)
  const order = firstRelation(row.order)

  return {
    registration_id: row.id,
    user_id: row.user_id ?? null,
    checked_in: Boolean(row.checked_in),
    claim_status: row.claim_status ?? 'pending',
    qr_code_token: row.qr_code_token ?? null,
    created_at: row.created_at ?? null,
    registration_created_at: row.created_at ?? null,
    ticket_id: row.ticket_id ?? null,
    ticket_name: ticket?.name ?? null,
    difficulty_level: row.difficulty_level ?? null,
    event_id: row.event_id ?? null,
    event_title: event?.title ?? null,
    event_date: event?.date ?? null,
    event_location: event?.location ?? null,
    amount_total: order?.amount_total ?? null,
    currency: order?.currency ?? null,
    order_status: order?.status ?? null,
    invoice_url: order?.invoice_url ?? null,
    order_created_at: order?.created_at ?? null,
    email: row.email ?? null,
  }
}

export async function GET(request: Request) {
  try {
    const user = await resolveRequestUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
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

    const byUserIdPromise = admin
      .from('my_registrations')
      .select('*')
      .eq('user_id', user.id)

    const byEmailPromise = user.email
      ? admin
          .from('my_registrations')
          .select('*')
          .eq('email', user.email)
      : Promise.resolve({ data: [], error: null } as { data: any[]; error: any })

    const [
      { data: registrationsByUserId, error: byUserIdError },
      { data: registrationsByEmail, error: byEmailError },
    ] = await Promise.all([byUserIdPromise, byEmailPromise])

    if (byUserIdError) {
      console.error('[account api] registrations by user id error', byUserIdError)
    }
    if (byEmailError) {
      console.error('[account api] registrations by email error', byEmailError)
    }

    const directByUserIdPromise = admin
      .from('registrations')
      .select(
        `
          id,
          user_id,
          email,
          checked_in,
          claim_status,
          qr_code_token,
          created_at,
          ticket_id,
          event_id,
          difficulty_level,
          ticket:tickets(name),
          event:events(title, date, location),
          order:orders(status, amount_total, currency, invoice_url, created_at)
        `,
      )
      .eq('user_id', user.id)

    const directByEmailPromise = user.email
      ? admin
          .from('registrations')
          .select(
            `
              id,
              user_id,
              email,
              checked_in,
              claim_status,
              qr_code_token,
              created_at,
              ticket_id,
              event_id,
              difficulty_level,
              ticket:tickets(name),
              event:events(title, date, location),
              order:orders(status, amount_total, currency, invoice_url, created_at)
            `,
          )
          .eq('email', user.email)
      : Promise.resolve({ data: [], error: null } as { data: any[]; error: any })

    const [
      { data: directByUserId, error: directByUserIdError },
      { data: directByEmail, error: directByEmailError },
    ] = await Promise.all([directByUserIdPromise, directByEmailPromise])

    if (directByUserIdError) {
      console.error('[account api] direct registrations by user id error', directByUserIdError)
    }
    if (directByEmailError) {
      console.error('[account api] direct registrations by email error', directByEmailError)
    }

    const registrations = Array.from(
      new Map(
        [
          ...(registrationsByUserId ?? []).map(normalizeViewRegistration),
          ...(registrationsByEmail ?? []).map(normalizeViewRegistration),
          ...(directByUserId ?? []).map(normalizeDirectRegistration),
          ...(directByEmail ?? []).map(normalizeDirectRegistration),
        ].map((registration) => [registration.registration_id, registration]),
      ).values(),
    ).sort(
      (a, b) =>
        new Date(b.registration_created_at ?? b.created_at ?? 0).getTime() -
        new Date(a.registration_created_at ?? a.created_at ?? 0).getTime(),
    )

    const registrationIds = (registrations ?? []).map((registration) => registration.registration_id)
    type RegistrationMetaRow = {
      id: string
      transfer_token: string | null
      approval_status: 'pending' | 'approved' | 'rejected' | null
      document_url: string | null
      start_time: string | null
      wave_index: number | null
      wave_capacity: number | null
      wave_position: number | null
      auto_assigned: boolean | null
      distance_ideal_km: number | null
      distance_min_km: number | null
      assignment_constraint_breached: boolean | null
      ticket: { requires_document: boolean | null; document_types?: string[] | null } | null
    }

    const registrationMetaMap = new Map<
      string,
      {
        transfer_token: string | null
        approval_status: 'pending' | 'approved' | 'rejected'
        document_url: string | null
        start_time: string | null
        wave_index: number | null
        wave_capacity: number | null
        wave_position: number | null
        auto_assigned: boolean | null
        distance_ideal_km: number | null
        distance_min_km: number | null
        assignment_constraint_breached: boolean | null
        requires_document: boolean
        document_types: string[]
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
          start_time,
          wave_index,
          wave_capacity,
          wave_position,
          auto_assigned,
          distance_ideal_km,
          distance_min_km,
          assignment_constraint_breached,
          ticket:tickets(requires_document, document_types)
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
            start_time: row.start_time ?? null,
            wave_index: typeof row.wave_index === 'number' ? row.wave_index : null,
            wave_capacity: typeof row.wave_capacity === 'number' ? row.wave_capacity : null,
            wave_position: typeof row.wave_position === 'number' ? row.wave_position : null,
            auto_assigned: typeof row.auto_assigned === 'boolean' ? row.auto_assigned : null,
            distance_ideal_km: typeof row.distance_ideal_km === 'number' ? row.distance_ideal_km : null,
            distance_min_km: typeof row.distance_min_km === 'number' ? row.distance_min_km : null,
            assignment_constraint_breached: typeof row.assignment_constraint_breached === 'boolean'
              ? row.assignment_constraint_breached
              : null,
            requires_document: requiresDocument,
            document_types: Array.isArray(row.ticket?.document_types) ? row.ticket.document_types : [],
          })
        }
      }
    }

    const documentTypeMap = new Map<string, Set<string>>()
    if (registrationIds.length > 0) {
      const { data: documentRows, error: documentError } = await admin
        .from('registration_documents')
        .select('registration_id, document_type')
        .in('registration_id', registrationIds)

      if (documentError) {
        console.error('[account api] registration documents error', documentError)
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

    const now = new Date()

    const registrationsWithQr = await Promise.all(
      (registrations ?? []).map(async (registration) => {
        const meta = registrationMetaMap.get(registration.registration_id) ?? {
          transfer_token: null,
          approval_status: 'pending' as const,
          document_url: null,
          start_time: null,
          wave_index: null,
          wave_capacity: null,
          wave_position: null,
          auto_assigned: null,
          distance_ideal_km: null,
          distance_min_km: null,
          assignment_constraint_breached: null,
          requires_document: false,
          document_types: [],
        }

        const qrCodeDataUrl =
          registration.qr_code_token && registration.qr_code_token.length > 0
            ? await QRCode.toDataURL(registration.qr_code_token)
            : null

        const uploadedTypes = documentTypeMap.get(registration.registration_id)
        const uploadedCount = uploadedTypes?.size ?? (meta.document_url ? 1 : 0)
        const requiredCount = meta.requires_document
          ? (meta.document_types.length > 0 ? meta.document_types.length : 1)
          : 0
        const documentsComplete = requiredCount === 0 ? true : uploadedCount >= requiredCount

        const { requiresAttention: documentRequiresAttention } = computeDocumentAction({
          requiresDocument: meta.requires_document,
          eventDate: registration.event_date,
          approvalStatus: meta.approval_status,
          requiredTypes: meta.document_types,
          uploadedTypes: Array.from(uploadedTypes ?? []),
          uploadedCount,
          requiredCount,
          hasLegacyDocumentUrl: Boolean(meta.document_url),
          now,
        })

        return {
          ...registration,
          transfer_token: meta.transfer_token,
          approval_status: meta.approval_status,
          document_url: meta.document_url,
          start_time: meta.start_time,
          wave_index: meta.wave_index,
          wave_capacity: meta.wave_capacity,
          wave_position: meta.wave_position,
          auto_assigned: meta.auto_assigned,
          distance_ideal_km: meta.distance_ideal_km,
          distance_min_km: meta.distance_min_km,
          assignment_constraint_breached: meta.assignment_constraint_breached,
          requires_document: meta.requires_document,
          required_document_types: meta.document_types,
          uploaded_document_types: Array.from(uploadedTypes ?? []),
          documents_count: uploadedCount,
          required_documents_count: requiredCount,
          documents_complete: documentsComplete,
          document_requires_attention: documentRequiresAttention,
          qr_code_data_url: qrCodeDataUrl,
        }
      }),
    )

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

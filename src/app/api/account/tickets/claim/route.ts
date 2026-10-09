import { randomUUID } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { isTicketTransferAllowed } from '@/lib/tickets/transferPolicy'
import { consumeTransfer, isTransferUnlocked } from '@/lib/tickets/ticketTransfers'
import { parseTransferToken } from '@/lib/tickets/transferToken'
import { notifyTransferParties, redactFormerHolderWaiver } from '@/lib/tickets/transferAftermath'
import { fingerprintWaiver } from '@/lib/legal/waiverDocument'
import {
  buildHandOverUpdate,
  buildTransferSignatureRecord,
  claimSubmissionSchema,
  isAdultAt,
} from '@/lib/tickets/transferClaim'

export const runtime = 'nodejs'

const firstRelation = <T,>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const token = parseTransferToken(request.nextUrl.searchParams.get('token'))
    if (!token) {
      return NextResponse.json({ error: 'Lien invalide.' }, { status: 400 })
    }

    const admin = supabaseAdmin()
    const { data: registration, error } = await admin
      .from('registrations')
      .select(
        `
          id,
          user_id,
          transfer_token,
          claim_status,
          qr_code_token,
          ticket:tickets(id, name),
          event:events(id, title, date, location)
        `,
      )
      .eq('transfer_token', token)
      .maybeSingle()

    if (error) {
      console.error('[claim] lookup detail error', error)
      return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
    }

    if (!registration) {
      return NextResponse.json({ error: 'Ce billet n’existe plus ou a été réclamé.' }, { status: 404 })
    }

    const event = firstRelation(registration.event)
    const ticket = firstRelation(registration.ticket)

    if (!isTicketTransferAllowed(event?.date)) {
      return NextResponse.json(
        { error: 'Le délai de transfert de ce billet est dépassé.' },
        { status: 410 },
      )
    }

    if (!(await isTransferUnlocked(admin, registration.id))) {
      return NextResponse.json(
        { error: 'Ce lien n’est pas encore actif : le titulaire doit d’abord régler le transfert.' },
        { status: 403 },
      )
    }

    return NextResponse.json({ registration: { ...registration, event, ticket } })
  } catch (error) {
    console.error('[claim] detail unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

const handlePost = async (request: NextRequest) => {
  try {
    const supabase = await createSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const parsed = claimSubmissionSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Informations ou signature incomplètes.' }, { status: 400 })
    }
    const submission = parsed.data
    const token = parseTransferToken(submission.token)
    if (!token) {
      return NextResponse.json({ error: 'Lien invalide.' }, { status: 400 })
    }
    if (!isAdultAt(submission.participant.birthDate, new Date())) {
      return NextResponse.json({ error: 'Le participant doit être majeur (18 ans révolus).' }, { status: 422 })
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
          email,
          qr_code_token,
          is_affiliated,
          guarantor_user_id,
          event_id,
          ticket_id,
          event:events(title, date)
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

    const event = firstRelation(registration.event)

    if (!isTicketTransferAllowed(event?.date)) {
      return NextResponse.json(
        { error: 'Le délai de transfert de ce billet est dépassé.' },
        { status: 410 },
      )
    }

    if (!(await isTransferUnlocked(admin, registration.id))) {
      return NextResponse.json(
        { error: 'Ce lien n’est pas encore actif : le titulaire doit d’abord régler le transfert.' },
        { status: 403 },
      )
    }

    // Matching on the token makes the hand-over atomic: only one concurrent claimant can win.
    const { data: transferred, error: updateError } = await admin
      .from('registrations')
      .update(
        buildHandOverUpdate({
          newHolderId: user.id,
          newHolderEmail: user.email,
          previousHolderId: registration.user_id,
          newQrToken: randomUUID(),
        }),
      )
      .eq('id', registration.id)
      .eq('transfer_token', token)
      .select('id')

    if (updateError) {
      console.error('[claim] update error', updateError)
      return NextResponse.json({ error: 'Impossible de transférer ce billet.' }, { status: 500 })
    }
    if (!transferred || transferred.length === 0) {
      return NextResponse.json({ error: 'Ce lien a déjà été utilisé.' }, { status: 409 })
    }

    // The buyer's waiver does not cover the new holder: store a fresh one. If that fails, give the bib back.
    const now = new Date()
    const document = fingerprintWaiver()
    const { error: signatureError } = await admin.from('registration_signatures').insert(
      buildTransferSignatureRecord(submission, {
        registrationId: registration.id,
        signerUserId: user.id,
        signerEmail: user.email,
        previousHolderId: registration.user_id,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
        userAgent: request.headers.get('user-agent'),
        now,
        document,
      }),
    )
    if (signatureError) {
      console.error('[claim] signature insert error', signatureError)
      await admin
        .from('registrations')
        .update({
          user_id: registration.user_id,
          email: registration.email,
          qr_code_token: registration.qr_code_token,
          transfer_token: token,
          claim_status: registration.claim_status,
          is_affiliated: registration.is_affiliated,
          guarantor_user_id: registration.guarantor_user_id,
        })
        .eq('id', registration.id)
      return NextResponse.json({ error: 'Impossible d’enregistrer ta signature. Réessaie.' }, { status: 500 })
    }

    await consumeTransfer(admin, registration.id, user.id).catch((consumeError) => {
      console.error('[claim] could not mark transfer as claimed', consumeError)
    })

    await redactFormerHolderWaiver(admin, registration.id, now).catch((redactError) => {
      console.error('[claim] could not redact the former holder safety data', redactError)
    })

    await notifyTransferParties({
      admin,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin,
      event: { title: event?.title ?? null, date: event?.date ?? null },
      newHolder: { email: user.email, firstName: submission.participant.firstName, lastName: submission.participant.lastName },
      formerHolder: { userId: registration.user_id, fallbackEmail: registration.email },
      document,
      now,
    }).catch((notifyError) => {
      console.error('[claim] could not notify the transfer parties', notifyError)
    })

    return NextResponse.json({ success: true, registrationId: registration.id })
  } catch (error) {
    console.error('[claim] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Transfert billet',
})

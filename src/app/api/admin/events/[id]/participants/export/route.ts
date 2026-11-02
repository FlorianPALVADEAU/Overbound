import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import {
  PARTICIPANT_COLUMNS,
  applyParticipantFilters,
  enrichParticipants,
  findUserIdsByName,
  participantFiltersSchema,
  type ParticipantRegistrationRow,
} from '@/lib/admin/participantsQuery'
import { toParticipantsCsv } from '@/lib/admin/participantsCsv'

export const runtime = 'nodejs'

const routeParamsSchema = z.object({ id: z.string().uuid() })
const UTF8_BOM = String.fromCharCode(0xfeff)
const PAGE = 1000
/** Hard stop so a runaway export cannot exhaust the function; far above any event size. */
const MAX_ROWS = 50_000

/** Every registration matching the list filters, as CSV. Not paginated: the file is the whole answer. */
const handleGet = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const parsedParams = routeParamsSchema.safeParse(await params)
  if (!parsedParams.success) return NextResponse.json({ error: 'Identifiant événement invalide' }, { status: 400 })
  const parsedFilters = participantFiltersSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()))
  if (!parsedFilters.success) return NextResponse.json({ error: 'Filtres invalides' }, { status: 400 })

  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const eventId = parsedParams.data.id
    const filters = parsedFilters.data
    const admin = supabaseAdmin()
    const nameMatches = await findUserIdsByName(admin, filters.query)

    const rows: ParticipantRegistrationRow[] = []
    for (let from = 0; from < MAX_ROWS; from += PAGE) {
      const { data, error } = await applyParticipantFilters(
        admin.from('registrations').select(PARTICIPANT_COLUMNS).eq('event_id', eventId),
        filters,
        nameMatches,
      )
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .range(from, from + PAGE - 1)
      if (error) throw error
      const page = (data ?? []) as unknown as ParticipantRegistrationRow[]
      rows.push(...page)
      if (page.length < PAGE) break
    }

    const participants = []
    for (let index = 0; index < rows.length; index += PAGE) {
      participants.push(...(await enrichParticipants(admin, rows.slice(index, index + PAGE))))
    }

    const csv = toParticipantsCsv(
      participants.map((participant) => ({
        id: participant.id,
        name: participant.participant.name,
        email: participant.participant.email,
        ticketName: participant.ticket.name,
        waveIndex: participant.departure.waveIndex,
        startTime: participant.departure.startTime,
        group: participant.group,
        checkedIn: participant.registration.checkedIn,
        cancelledAt: participant.registration.cancelledAt,
        paymentStatus: participant.payment?.status ?? null,
        amountCents: participant.payment?.amountCents ?? null,
        currency: participant.payment?.currency ?? null,
        createdAt: participant.registration.createdAt,
      })),
    )

    // BOM so Excel reads the accents as UTF-8.
    return new NextResponse(UTF8_BOM + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="participants-${eventId}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[admin participants export] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const GET = withRequestLogging(handleGet, { actionType: 'Export participants', methods: ['GET'] })

import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAdminOrganization } from '@/lib/auth/requireAdminOrganization'
import { loadTshirtWinnerIds } from '@/lib/tshirtOfferServer'
import { countBySize, toTshirtCsv, type TshirtExportRow } from '@/lib/admin/tshirtExport'

export const runtime = 'nodejs'

interface WinnerRow {
  email: string
  bib_number: number | null
  tshirt_size: string | null
  ticket: { name: string | null } | { name: string | null }[] | null
}

/** Free T-shirt winners of an event with their sizes. `?format=csv` downloads the packing list. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminOrganization(request)
  if (!auth.ok) return auth.response
  const { id } = await params

  const admin = supabaseAdmin()
  const { data: event, error: eventError } = await admin
    .from('events')
    .select('id, tshirt_offer_quota')
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .maybeSingle()
  if (eventError) return NextResponse.json({ error: 'Impossible de lire l’événement' }, { status: 500 })
  if (!event) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })

  try {
    const winnerIds = [...(await loadTshirtWinnerIds(admin, event))]
    const { data, error } = winnerIds.length
      ? await admin
          .from('registrations')
          .select('email, bib_number, tshirt_size, ticket:tickets(name)')
          .in('id', winnerIds)
          .order('created_at', { ascending: true })
      : { data: [], error: null }
    if (error) throw error

    const rows: TshirtExportRow[] = ((data ?? []) as WinnerRow[]).map((row) => {
      const ticket = Array.isArray(row.ticket) ? row.ticket[0] : row.ticket
      return { email: row.email, bibNumber: row.bib_number, ticketName: ticket?.name ?? null, size: row.tshirt_size }
    })

    if (new URL(request.url).searchParams.get('format') === 'csv') {
      return new NextResponse(toTshirtCsv(rows), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="tshirts-${id}.csv"`,
        },
      })
    }
    return NextResponse.json({ quota: event.tshirt_offer_quota, winners: rows, sizes: countBySize(rows) })
  } catch (error) {
    console.error('[admin/tshirts] export failed', error)
    return NextResponse.json({ error: 'Export impossible' }, { status: 500 })
  }
}

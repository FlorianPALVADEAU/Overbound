import { supabaseAdmin } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdminOrganization } from '@/lib/auth/requireAdminOrganization'
import { operationsConfigOf, ticketUpdateSchema } from '@/lib/admin/ticketInput'
import { checkTicketCompanion, findTicketsUsingAsCompanion } from '../companionGuard'

const handlePut = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  try {
    const auth = await requireAdminOrganization(request)
    if (!auth.ok) {
      return auth.response
    }
    const { id } = await params

    const body: unknown = await request.json().catch(() => null)
    const parsed = ticketUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Requête invalide' }, { status: 400 })
    }
    const { event_id, race_id, name, description, price, currency, max_participants } = parsed.data
    const operations_config = operationsConfigOf(parsed.data)

    // Utiliser supabaseAdmin pour modifier
    const admin = supabaseAdmin()
    const { data: scopedEvent } = await admin
      .from('events')
      .select('id')
      .eq('id', event_id)
      .eq('organization_id', auth.organizationId)
      .maybeSingle()
    if (!scopedEvent) return NextResponse.json({ error: 'Événement inaccessible' }, { status: 404 })

    const companionError = await checkTicketCompanion(admin, auth.organizationId, { id, event_id, name, operations_config })
    if (companionError) return NextResponse.json({ error: companionError }, { status: 400 })

    const { data: ticket, error } = await admin
      .from('tickets')
      .update({
        event_id,
        race_id,
        name,
        description: description || null,
        final_price_cents: price,
        currency: currency || 'eur',
        max_participants: max_participants ?? 0,
        requires_document: false,
        document_types: [],
        updated_at: new Date().toISOString(),
        operations_config: operations_config || null,
      })
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .select(`
        *,
        event:events(id, title, date, status),
        race:races!tickets_race_id_fkey(id, name, type, difficulty, target_public, distance_km)
      `)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ ticket })

  } catch (error) {
    console.error('Erreur PUT ticket:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const handleDelete = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  try {
    const auth = await requireAdminOrganization(request)
    if (!auth.ok) {
      return auth.response
    }
    const { id } = await params

    // Un billet OPEN vendu comme option d'un billet RANKED ne se supprime pas : l'option casserait au paiement.
    const admin = supabaseAdmin()
    const owners = await findTicketsUsingAsCompanion(admin, auth.organizationId, id)
    if (owners.length > 0) {
      return NextResponse.json(
        { error: `Ce billet est le billet OPEN de l’option de : ${owners.join(', ')}. Retire d’abord l’option.` },
        { status: 409 },
      )
    }

    // A ticket with registrations is never deleted: the former force branch deleted those (paid) registrations
    // first, outside any transaction. Cancel them, then delete the ticket.
    const { count } = await admin
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('ticket_id', id)
      .eq('organization_id', auth.organizationId)

    if (count && count > 0) {
      return NextResponse.json(
        {
          error: `Ce billet a ${count} inscription(s) : il ne peut pas être supprimé. Annule d’abord ces inscriptions.`,
          registrationCount: count,
          requiresDetach: true,
        },
        { status: 409 },
      )
    }

    // Supprimer le ticket
    const { error } = await admin
      .from('tickets')
      .delete()
      .eq('id', id)
      .eq('organization_id', auth.organizationId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, deletedRegistrations: 0 })

  } catch (error) {
    console.error('Erreur DELETE ticket:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const PUT = withRequestLogging(handlePut, {
  actionType: 'Mise à jour ticket admin',
})

export const DELETE = withRequestLogging(handleDelete, {
  actionType: 'Suppression ticket admin',
})

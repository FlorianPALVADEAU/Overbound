import { createSupabaseServer } from '@/lib/supabase/server'
import MultiStepEventRegistration from '@/components/MultiStepEventRegistration'
import { notFound, redirect } from 'next/navigation'

interface EventRegisterPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ticket?: string | string[] }>
}

export default async function EventRegisterPage({ params, searchParams }: EventRegisterPageProps) {
  const { id } = await params
  const { ticket } = await searchParams
  const supabase = await createSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const ticketQueryParam = typeof ticket === 'string' ? ticket : Array.isArray(ticket) ? ticket[0] : null

  if (!user) {
    const nextUrl = `/events/${id}/register${ticketQueryParam ? `?ticket=${ticketQueryParam}` : ''}`
    redirect(`/auth/login?next=${encodeURIComponent(nextUrl)}`)
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select(`
      *,
      tickets (
        id,
        name,
        description,
        base_price_cents,
        currency,
        max_participants,
        requires_document,
        document_types,
        race:races!tickets_race_id_fkey (
          id,
          name,
          type,
          difficulty,
          target_public,
          distance_km,
          description
        )
      )
    `)
    .eq('id', id)
    .single()

  if (eventError || !event) {
    notFound()
  }

  const { count: totalRegistrations } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id)

  const availableSpots = Math.max(event.capacity - (totalRegistrations || 0), 0)

  const { data: upsellsData } = await supabase
    .from('upsells')
    .select('*')
    .eq('event_id', event.id)
    .eq('is_active', true)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-7xl px-4 pb-12 pt-8">
        <MultiStepEventRegistration
          event={event}
          tickets={event.tickets || []}
          upsells={upsellsData || []}
          user={{
            id: user.id,
            email: user.email ?? '',
            fullName: user.user_metadata?.full_name || null,
          }}
          availableSpots={availableSpots}
          initialTicketId={ticketQueryParam}
        />
      </div>
    </div>
  )
}

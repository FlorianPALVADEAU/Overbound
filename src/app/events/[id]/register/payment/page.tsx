import { createSupabaseServer } from '@/lib/supabase/server'
import PaymentClient from './PaymentClient'
import { notFound, redirect } from 'next/navigation'

interface PaymentPageProps {
  params: Promise<{ id: string }>
}

export default async function EventPaymentPage({ params }: PaymentPageProps) {
  const { id } = await params
  const supabase = await createSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(`/events/${id}/register/payment`)}`)
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
          distance_km
        )
      )
    `)
    .eq('id', id)
    .single()

  if (eventError || !event) {
    notFound()
  }

  const { data: upsellsData } = await supabase
    .from('upsells')
    .select('*')
    .eq('event_id', event.id)
    .eq('is_active', true)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-5xl px-4 pb-12 pt-8 space-y-6">
        <h1 className="text-2xl font-semibold">Finaliser mon inscription</h1>
        <p className="text-sm text-muted-foreground">
          Vérifiez vos informations et procédez au paiement sécurisé.
        </p>
        <PaymentClient
          event={event}
          tickets={event.tickets || []}
          upsells={upsellsData || []}
          userEmail={user.email ?? ''}
        />
      </div>
    </div>
  )
}

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CalendarIcon, MapPinIcon } from 'lucide-react'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClaimTicketButton } from '@/components/account/ClaimTicketButton'

interface ClaimTicketsPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function ClaimTicketPage({ searchParams }: ClaimTicketsPageProps) {
  const { token } = await searchParams

  if (!token || typeof token !== 'string') {
    redirect('/account/tickets')
  }

  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(`/account/tickets/claim?token=${token}`)}`)
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
    console.error('[claim] fetch error', error)
  }

  if (!registration) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-2xl px-6 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Billet introuvable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                Ce lien de transfert n&apos;est plus valide ou le billet a déjà été récupéré. Demande
                au titulaire du billet de vérifier le lien ou de t&apos;en envoyer un nouveau.
              </p>
              <div className="flex gap-2">
                <Link href="/account/tickets">
                  <Button variant="outline">Retour à mes billets</Button>
                </Link>
                <Link href="/events">
                  <Button>Découvrir les événements</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const eventDate = registration.event?.date ? new Date(registration.event.date) : null
  const formattedEventDate = eventDate
    ? eventDate.toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })
    : null

  const alreadyClaimed = registration.user_id === user.id
  const isTokenAvailable = registration.transfer_token === token

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-2xl px-6 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Récupérer un billet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border bg-card p-4">
              <h2 className="text-lg font-semibold">{registration.event?.title ?? 'Événement'}</h2>
              <p className="text-sm text-muted-foreground">{registration.ticket?.name}</p>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                {formattedEventDate ? (
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{formattedEventDate}</span>
                  </div>
                ) : null}
                {registration.event?.location ? (
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4" />
                    <span>{registration.event.location}</span>
                  </div>
                ) : null}
              </div>
            </div>

            {alreadyClaimed ? (
              <div className="rounded-lg border border-emerald-400/40 bg-emerald-100/40 p-4 text-sm text-emerald-900">
                Ce billet est déjà associé à ton compte.
              </div>
            ) : !isTokenAvailable ? (
              <div className="rounded-lg border border-amber-400/50 bg-amber-100/50 p-4 text-sm text-amber-900">
                Ce lien a déjà été utilisé. Demande au titulaire du billet de t&apos;en envoyer un
                nouveau.
              </div>
            ) : (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  En récupérant ce billet, il sera associé à ton compte Overbound et apparaîtra dans
                  ta liste de billets. Le titulaire actuel recevra une notification de transfert.
                </p>
                <ClaimTicketButton token={token} />
              </div>
            )}

            <div className="flex gap-2">
              <Link href="/account/tickets">
                <Button variant="outline">Retour à mes billets</Button>
              </Link>
              <Link href="/events">
                <Button variant="ghost">Parcourir les événements</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

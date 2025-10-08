import { redirect } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'qrcode'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AccountRegistrationsList } from '@/components/account/AccountRegistrationsList'

export default async function AccountTicketsPage() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/account/tickets')
  }

  const { data: registrations, error } = await supabase
    .from('my_registrations')
    .select('*')
    .eq('user_id', user.id)
    .order('event_date', { ascending: true })

  if (error) {
    console.error('[account/tickets] registrations fetch error', error)
  }

  const registrationIds = (registrations ?? []).map((registration) => registration.registration_id)
  const admin = supabaseAdmin()
  let transferTokensMap = new Map<string, string | null>()

  if (registrationIds.length > 0) {
    const { data: tokenRows, error: tokenError } = await admin
      .from('registrations')
      .select('id, transfer_token')
      .in('id', registrationIds)

    if (tokenError) {
      console.error('[account/tickets] transfer token fetch error', tokenError)
    } else if (tokenRows) {
      transferTokensMap = new Map(tokenRows.map((row) => [row.id as string, row.transfer_token]))
    }
  }

  const registrationsWithQr = await Promise.all(
    (registrations ?? []).map(async (registration) => ({
      ...registration,
      transfer_token: transferTokensMap.get(registration.registration_id) ?? null,
      qr_code_data_url:
        registration.qr_code_token && registration.qr_code_token.length > 0
          ? await QRCode.toDataURL(registration.qr_code_token)
          : null,
    })),
  )

  const upcomingRegistrations = registrationsWithQr.filter((registration) => {
    if (!registration.event_date) return false
    return new Date(registration.event_date) >= new Date()
  })

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-5xl space-y-6 px-6 py-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold">Mes billets</h1>
            <p className="text-muted-foreground">
              Retrouvez les billets associés à vos inscriptions. Ouvrez un billet pour afficher son QR code en plein écran.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/account">
              <Button variant="outline">Retour au compte</Button>
            </Link>
            <Link href="/events">
              <Button>Explorer de nouveaux événements</Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Billets disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingRegistrations.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                Aucun billet disponible pour le moment. Consultez vos inscriptions passées dans votre espace compte ou inscrivez-vous à un nouvel événement.
              </div>
            ) : (
              <AccountRegistrationsList registrations={upcomingRegistrations} />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

/* eslint-disable react/no-unescaped-entities */
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TicketIcon, UserIcon, LogOutIcon } from 'lucide-react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { AccountRegistrationsList } from '@/components/account/AccountRegistrationsList'

export default async function AccountPage() {
  const supabase = await createSupabaseServer()
  
  // Récupérer l'utilisateur connecté
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="text-center p-8">
            <UserIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Connexion requise</h2>
            <p className="text-muted-foreground mb-4">Connecte-toi pour voir tes inscriptions et gérer ton compte.</p>
            <Link href="/auth/login">
              <Button>Se connecter</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  // Récupérer le profil utilisateur
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, role')
    .eq('id', user.id)
    .single()

  // Récupérer les inscriptions avec toutes les informations nécessaires
  const { data: registrations, error } = await supabase
    .from('my_registrations')
    .select('*')
    .eq('user_id', user.id)
    .order('registration_id', { ascending: false })

  if (error) {
    console.error('[account] registrations fetch error', error)
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
      console.error('[account] transfer token fetch error', tokenError)
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

  const now = new Date()
  const totalEvents = registrationsWithQr.length
  const checkedInEvents = registrationsWithQr.filter((entry) => entry.checked_in).length
  const upcomingEvents = registrationsWithQr.filter((entry) => {
    if (!entry.event_date) return false
    const eventDate = new Date(entry.event_date)
    return eventDate > now
  }).length

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header avec profil */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || user.email} />
                    <AvatarFallback className="text-lg">
                        {profile?.full_name 
                        ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                        : user.email?.[0].toUpperCase()
                        }
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl font-bold">
                      {profile?.full_name || 'Athlète'}
                    </h1>
                    <p className="text-muted-foreground">{user.email}</p>
                    {profile?.role === 'admin' && (
                      <Badge variant="secondary" className="mt-1">
                        Administrateur
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link href="/account/tickets">
                    <Button variant="outline" size="sm">
                      Mes billets
                    </Button>
                  </Link>
                  {profile?.role === 'admin' && (
                    <Link href="/admin">
                      <Button variant="outline" size="sm">
                        Administration
                      </Button>
                    </Link>
                  )}
                  <Link href="/logout">
                    <Button variant="outline" size="sm">
                      <LogOutIcon className="mr-2 h-4 w-4" />
                      Déconnexion
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total événements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEvents}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Événements à venir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{upcomingEvents}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Participations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{checkedInEvents}</div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des inscriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TicketIcon className="h-5 w-5" />
              Mes inscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {registrationsWithQr.length === 0 ? (
              <div className="py-12 text-center">
                <TicketIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucune inscription</h3>
                <p className="text-muted-foreground mb-4">
                  Tu n'as pas encore d'inscription à un événement.
                </p>
                <Link href="/events">
                  <Button>Découvrir les événements</Button>
                </Link>
              </div>
            ) : (
              <AccountRegistrationsList registrations={registrationsWithQr} />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

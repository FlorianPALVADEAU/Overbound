import { createSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CalendarIcon, MapPinIcon, TicketIcon, QrCodeIcon, UserIcon, LogOutIcon, DownloadIcon } from 'lucide-react'
import Link from 'next/link'

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
  const { data: registrations } = await supabase
    .from('registrations')
    .select(`
      id,
      checked_in,
      qr_code_token,
      transfer_token,
      created_at,
      tickets (
        id,
        name,
        price,
        currency,
        events (
          id,
          title,
          description,
          date,
          location,
          image_url,
          status
        )
      ),
      orders (
        id,
        amount_total,
        currency,
        payment_status,
        stripe_session_id,
        invoice_url,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Récupérer les statistiques utilisateur
  const { data: stats } = await supabase
    .from('registrations')
    .select('checked_in')
    .eq('user_id', user.id)

  const totalEvents = registrations?.length || 0
  const checkedInEvents = stats?.filter(s => s.checked_in).length || 0
  const upcomingEvents = registrations?.filter(r => 
    r.tickets?.[0]?.events?.[0]?.date && new Date(r.tickets[0].events[0].date) > new Date()
  ).length || 0

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
                <div className="flex gap-2">
                  {profile?.role === 'admin' && (
                    <Link href="/admin">
                      <Button variant="outline" size="sm">
                        Administration
                      </Button>
                    </Link>
                  )}
                  <Link href="/logout">
                    <Button variant="outline" size="sm">
                      <LogOutIcon className="h-4 w-4 mr-2" />
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
            {!registrations || registrations.length === 0 ? (
              <div className="text-center py-12">
                <TicketIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucune inscription</h3>
                <p className="text-muted-foreground mb-4">
                  Tu n'as pas encore d'inscription à un événement.
                </p>
                <Link href="/">
                  <Button>Découvrir les événements</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {registrations.map((registration, index) => {
                  const event = registration.tickets?.[0]?.events?.[0]
                  const ticket = registration.tickets?.[0]
                  const order = registration.orders
                  const isUpcoming = event && new Date(event.date) > new Date()
                  const isPast = event && new Date(event.date) < new Date()

                  return (
                    <div key={registration.id}>
                      <div className="flex flex-col lg:flex-row gap-6 p-6 rounded-lg border bg-card">
                        {/* Image de l'événement */}
                        <div className="flex-shrink-0">
                          <div className="w-full lg:w-48 h-32 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center overflow-hidden">
                            {event?.image_url ? (
                              <img 
                                src={event.image_url} 
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <CalendarIcon className="h-12 w-12 text-primary/40" />
                            )}
                          </div>
                        </div>

                        {/* Informations de l'événement */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-xl font-semibold mb-1">
                                {event?.title || 'Événement'}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {ticket?.name}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {registration.checked_in ? (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  ✓ Présent
                                </Badge>
                              ) : isUpcoming ? (
                                <Badge variant="secondary">À venir</Badge>
                              ) : isPast ? (
                                <Badge variant="outline">Terminé</Badge>
                              ) : null}
                              {event?.status && (
                                <Badge variant="outline">
                                  {event.status}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {event?.date && (
                              <div className="flex items-center gap-2 text-sm">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {new Date(event.date).toLocaleString('fr-FR', {
                                    dateStyle: 'full',
                                    timeStyle: 'short'
                                  })}
                                </span>
                              </div>
                            )}
                            
                            {event?.location && (
                              <div className="flex items-center gap-2 text-sm">
                                <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>

                          {event?.description && (
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {event.description}
                            </p>
                          )}

                          {/* Informations de commande */}
                          {order && order.length > 0 && (
                            <div className="bg-muted/30 rounded-lg p-3 mb-4">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-4">
                                  <span>
                                    <strong>Prix:</strong> {(order[0].amount_total / 100).toFixed(2)} {order[0].currency?.toUpperCase()}
                                  </span>
                                  <span>
                                    <strong>Statut:</strong> 
                                    <Badge 
                                      variant={order[0].payment_status === 'paid' ? 'default' : 'secondary'}
                                      className="ml-1"
                                    >
                                      {order[0].payment_status === 'paid' ? 'Payé' : order[0].payment_status}
                                    </Badge>
                                  </span>
                                  <span className="text-muted-foreground">
                                    {new Date(order[0].created_at).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                                {order[0].invoice_url && (
                                  <Link href={order[0].invoice_url} target="_blank">
                                    <Button variant="outline" size="sm">
                                      <DownloadIcon className="h-4 w-4 mr-1" />
                                      Facture
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 flex-wrap">
                            <Link href={`/account/ticket/${registration.id}`}>
                              <Button variant="default" size="sm">
                                <QrCodeIcon className="h-4 w-4 mr-2" />
                                Voir le billet
                              </Button>
                            </Link>
                            
                            {isUpcoming && (
                              <Link href={`/events/${event?.id}`}>
                                <Button variant="outline" size="sm">
                                  Détails de l'événement
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {index < registrations.length - 1 && (
                        <Separator className="my-6" />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
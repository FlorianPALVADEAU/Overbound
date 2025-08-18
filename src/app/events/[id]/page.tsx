import { createSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Trophy,
  Clock,
  Search,
  Filter,
  Eye
} from 'lucide-react'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  subtitle?: string
  date: string
  location: string
  capacity: number
  status: 'draft' | 'on_sale' | 'sold_out' | 'closed'
  image_url?: string
  registrations_count?: number
  tickets?: {
    id: string
    name: string
    base_price_cents: number
    currency: string
    race?: {
      name: string
      distance_km: number
      difficulty: number
    }
  }[]
}

export default async function EventsPage() {
  const supabase = await createSupabaseServer()

  // Récupérer tous les événements avec leurs tickets
  const { data: events, error } = await supabase
    .from('events')
    .select(`
      *,
      tickets (
        id,
        name,
        base_price_cents,
        currency,
        race:races!tickets_race_id_fkey (
          name,
          distance_km,
          difficulty
        )
      )
    `)
    .in('status', ['on_sale', 'sold_out'])
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true })

  if (error) {
    console.error('Erreur lors de la récupération des événements:', error)
  }

  // Compter les inscriptions pour chaque événement
  const eventsWithCount = await Promise.all(
    (events || []).map(async (event: Event) => {
      const { count } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id)

      return {
        ...event,
        registrations_count: count || 0
      }
    })
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_sale': return 'default'
      case 'sold_out': return 'destructive'
      case 'closed': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'on_sale': return 'Inscriptions ouvertes'
      case 'sold_out': return 'Complet'
      case 'closed': return 'Inscriptions fermées'
      case 'draft': return 'Bientôt disponible'
      default: return status
    }
  }

  const getMinPrice = (tickets: Event['tickets']) => {
    if (!tickets || tickets.length === 0) return null
    const minPrice = Math.min(...tickets.map(t => t.base_price_cents))
    const currency = tickets[0].currency
    return {
      price: minPrice,
      currency,
      formatted: (minPrice / 100).toLocaleString('fr-FR', {
        style: 'currency',
        currency: currency.toUpperCase()
      })
    }
  }

  const upcomingEvents = eventsWithCount.filter(event => 
    new Date(event.date) > new Date()
  )

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Calendar className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Événements OverBound</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Découvrez nos prochains événements sportifs et relevez de nouveaux défis ! 
            Des courses accessibles aux défis extrêmes, trouvez l'événement qui vous correspond.
          </p>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{upcomingEvents.length}</div>
              <p className="text-sm text-muted-foreground">Événements à venir</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {upcomingEvents.reduce((sum, event) => sum + (event.registrations_count || 0), 0)}
              </div>
              <p className="text-sm text-muted-foreground">Participants inscrits</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {upcomingEvents.reduce((sum, event) => sum + (event.capacity || 0), 0)}
              </div>
              <p className="text-sm text-muted-foreground">Places disponibles</p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des événements */}
        {upcomingEvents.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun événement à venir</h3>
              <p className="text-muted-foreground mb-4">
                Tous nos événements sont actuellement complets ou fermés.
              </p>
              <Link href="/races">
                <Button>Découvrir nos courses</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingEvents.map((event) => {
              const availableSpots = event.capacity - (event.registrations_count || 0)
              const isSoldOut = event.status === 'sold_out' || availableSpots <= 0
              const minPrice = getMinPrice(event.tickets)
              const isUpcoming = new Date(event.date) > new Date()
              const isToday = new Date(event.date).toDateString() === new Date().toDateString()
              const daysUntil = Math.ceil((new Date(event.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

              return (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Image de l'événement */}
                  <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/20">
                    {event.image_url ? (
                      <img 
                        src={event.image_url} 
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Trophy className="h-16 w-16 text-primary/40" />
                      </div>
                    )}
                    
                    {/* Badge de statut */}
                    <div className="absolute top-4 right-4">
                      <Badge variant={getStatusColor(event.status)}>
                        {getStatusLabel(event.status)}
                      </Badge>
                    </div>

                    {/* Badge "Aujourd'hui" ou jours restants */}
                    {isToday && (
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-red-500 text-white">
                          Aujourd'hui !
                        </Badge>
                      </div>
                    )}
                    {!isToday && daysUntil <= 7 && daysUntil > 0 && (
                      <div className="absolute top-4 left-4">
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          {daysUntil} jour{daysUntil > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardHeader>
                    <CardTitle className="text-xl">{event.title}</CardTitle>
                    {event.subtitle && (
                      <p className="text-muted-foreground">{event.subtitle}</p>
                    )}
                  </CardHeader>

                  <CardContent>
                    {/* Informations principales */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {new Date(event.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {new Date(event.date).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{availableSpots} places disponibles</span>
                      </div>
                    </div>

                    {/* Courses disponibles */}
                    {event.tickets && event.tickets.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <h4 className="text-sm font-medium">Formats disponibles :</h4>
                        <div className="flex flex-wrap gap-1">
                          {event.tickets.slice(0, 2).map((ticket) => (
                            <Badge key={ticket.id} variant="outline" className="text-xs">
                              {ticket.race ? `${ticket.race.name} (${ticket.race.distance_km}km)` : ticket.name}
                            </Badge>
                          ))}
                          {event.tickets.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{event.tickets.length - 2} autres
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Prix et inscription */}
                    <div className="space-y-3">
                      {minPrice && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">À partir de :</span>
                          <span className="font-bold text-primary">{minPrice.formatted}</span>
                        </div>
                      )}

                      {/* Barre de progression */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Inscriptions</span>
                          <span>{event.registrations_count} / {event.capacity}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div 
                            className={`rounded-full h-1.5 transition-all ${
                              isSoldOut ? 'bg-red-500' : 'bg-primary'
                            }`}
                            style={{ 
                              width: `${Math.min(100, ((event.registrations_count || 0) / event.capacity) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Link href={`/events/${event.id}`} className="flex-1">
                          <Button 
                            className="w-full" 
                            disabled={!isUpcoming}
                            variant={isSoldOut ? "outline" : "default"}
                          >
                            {!isUpcoming ? (
                              <>
                                <Clock className="h-4 w-4 mr-2" />
                                Terminé
                              </>
                            ) : isSoldOut ? (
                              <>
                                <Users className="h-4 w-4 mr-2" />
                                Complet
                              </>
                            ) : (
                              <>
                                <Trophy className="h-4 w-4 mr-2" />
                                S'inscrire
                              </>
                            )}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Section d'informations */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Événements réguliers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Retrouvez nos événements tout au long de l'année, 
                avec de nouveaux défis chaque mois.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Communauté active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Rejoignez une communauté passionnée et partagez 
                l'expérience avec d'autres sportifs.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Tous niveaux
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Des parcours adaptés à tous les niveaux, 
                du débutant au sportif confirmé.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
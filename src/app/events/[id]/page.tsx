/* eslint-disable react/no-unescaped-entities */
import { createSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Clock,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import EventTicketListWithRegistration from '@/components/events/EventTicketListWithRegistration'
import { Button } from '@/components/ui/button'

interface EventDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const supabase = await createSupabaseServer()
  
  // Await the params Promise
  const { id } = await params

  // Récupérer l'utilisateur connecté
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Récupérer l'événement avec ses tickets et courses
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
          description,
          obstacles:race_obstacles!race_obstacles_race_id_fkey(
            order_position,
            is_mandatory,
            obstacle:obstacles!race_obstacles_obstacle_id_fkey(*)
          )
        )
      )
    `)
    .eq('id', id)
    .single()

  if (eventError || !event) {
    notFound()
  }

  // Compter les inscriptions totales
  const { count: totalRegistrations } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id)

  const availableSpots = event.capacity - (totalRegistrations || 0)

  // Vérifier si l'utilisateur est déjà inscrit
  let existingRegistration = null
  if (user) {
    const { data } = await supabase
      .from('registrations')
      .select(`
        id, 
        checked_in,
        tickets (
          name
        )
      `)
      .eq('user_id', user.id)
      .eq('event_id', event.id)
      .single()
    
    existingRegistration = data
  }

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

  const isUpcoming = new Date(event.date) > new Date()
  const isToday = new Date(event.date).toDateString() === new Date().toDateString()
  const daysUntil = Math.ceil((new Date(event.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/events">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux événements
            </Button>
          </Link>
        </div>

        {/* Header de l'événement */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Image de l'événement */}
                <div className="flex-shrink-0">
                  <div className="w-full lg:w-64 h-48 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center overflow-hidden relative">
                    {event.image_url ? (
                      <img 
                        src={event.image_url} 
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Calendar className="h-24 w-24 text-primary/40" />
                    )}
                    
                    {/* Badge de statut */}
                    <div className="absolute top-4 right-4">
                      <Badge variant={getStatusColor(event.status)}>
                        {getStatusLabel(event.status)}
                      </Badge>
                    </div>

                    {/* Badge urgence */}
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
                </div>

                {/* Informations de l'événement */}
                <div className="flex-1">
                  <div className="mb-4">
                    <h1 className="text-3xl lg:text-4xl font-bold mb-2">{event.title}</h1>
                    {event.subtitle && (
                      <p className="text-xl text-muted-foreground">{event.subtitle}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Date et heure</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.date).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Lieu</p>
                        <p className="text-sm text-muted-foreground">{event.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Disponibilité</p>
                        <p className="text-sm text-muted-foreground">
                          {availableSpots} places disponibles sur {event.capacity}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Formats</p>
                        <p className="text-sm text-muted-foreground">
                          {event.tickets?.length} format{event.tickets?.length > 1 ? 's' : ''} disponible{event.tickets?.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Inscriptions</span>
                      <span>{totalRegistrations || 0} / {event.capacity}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`rounded-full h-2 transition-all ${
                          availableSpots <= 0 ? 'bg-red-500' : 'bg-primary'
                        }`}
                        style={{ 
                          width: `${Math.min(100, ((totalRegistrations || 0) / event.capacity) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerte si déjà inscrit */}
        {existingRegistration && (
          <Alert className="mb-8">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Déjà inscrit !</strong> Vous êtes inscrit à cet événement avec le ticket "{existingRegistration.tickets?.[0]?.name}".
              {existingRegistration.checked_in ? " Vous avez été enregistré comme présent." : " N'oubliez pas de vous présenter le jour J !"}
              {" "}
              <Link href="/account" className="underline">Gérer mes inscriptions</Link>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale - Formats disponibles */}
          <div className="lg:col-span-2 space-y-8">
            <EventTicketListWithRegistration
              event={event}
              tickets={event.tickets || []}
              availableSpots={availableSpots}
              user={user}
            />

            {/* Informations importantes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Informations importantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Horaires</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Ouverture de l'accueil : 30 minutes avant le départ</li>
                      <li>• Échauffement collectif : 15 minutes avant le départ</li>
                      <li>• Heure de départ : {new Date(event.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</li>
                      <li>• Remise des prix : après l'arrivée du dernier participant</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Équipement recommandé</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Tenue de sport adaptée à la météo</li>
                      <li>• Chaussures de trail ou running avec bonne adhérence</li>
                      <li>• Gourde d'eau (ravitaillements sur le parcours)</li>
                      <li>• Serviette pour après l'effort</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Services sur place</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Vestiaires et douches disponibles</li>
                      <li>• Stand de ravitaillement</li>
                      <li>• Service médical présent</li>
                      <li>• Photographe officiel</li>
                      <li>• Parking gratuit</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonne latérale - Inscription */}
          <div className="lg:col-span-1">
            {/* Météo et conseils */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Conseils pour le jour J
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Arrivez 30 minutes avant votre créneau</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Apportez votre QR code (sur téléphone ou imprimé)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Munissez-vous d'une pièce d'identité</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Consultez la météo et adaptez votre équipement</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>Hydratez-vous bien avant et pendant l'épreuve</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Besoin d'aide ?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Email :</strong>{' '}
                    <a href="mailto:support@overbound.com" className="text-primary hover:underline">
                      support@overbound.com
                    </a>
                  </p>
                  <p>
                    <strong>Téléphone :</strong>{' '}
                    <a href="tel:+33123456789" className="text-primary hover:underline">
                      01 23 45 67 89
                    </a>
                  </p>
                  <p className="text-muted-foreground">
                    Notre équipe est disponible du lundi au vendredi de 9h à 18h.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Conditions d'annulation */}
        <Alert className="mt-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Conditions d'annulation :</strong> Annulation gratuite jusqu'à 48h avant l'événement. 
            Passé ce délai, aucun remboursement ne sera possible sauf cas de force majeure.
            {" "}
            <Link href="/cgu" className="underline">Voir les conditions complètes</Link>
          </AlertDescription>
        </Alert>
      </div>
    </main>
  )
}

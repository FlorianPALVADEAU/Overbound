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
  Star,
  Target,
  Mountain,
  Zap,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import EventRegistration from '@/components/events/EventRegistration'
import { Button } from '@/components/ui/button'

interface EventDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const supabase = await createSupabaseServer()

  // Récupérer l'utilisateur connecté
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { id } = await params;

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
      .select('id, ticket:tickets(name), checked_in')
      .eq('user_id', user.id)
      .eq('event_id', event.id)
      .single()
    
    // Explicitly type ticket as any for safety
    existingRegistration = data as { id: string; ticket: any; checked_in: boolean } | null
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return 'bg-green-100 text-green-800'
    if (difficulty <= 6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'trail': return 'bg-blue-100 text-blue-800'
      case 'obstacle': return 'bg-orange-100 text-orange-800'
      case 'urbain': return 'bg-purple-100 text-purple-800'
      case 'nature': return 'bg-green-100 text-green-800'
      case 'extreme': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPublicColor = (targetPublic: string) => {
    switch (targetPublic) {
      case 'débutant': return 'bg-emerald-100 text-emerald-800'
      case 'intermédiaire': return 'bg-amber-100 text-amber-800'
      case 'expert': return 'bg-red-100 text-red-800'
      case 'famille': return 'bg-pink-100 text-pink-800'
      case 'pro': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
              <strong>Déjà inscrit !</strong> Vous disposez d'une inscription avec le ticket "{Array.isArray(existingRegistration.ticket) ? existingRegistration.ticket[0]?.name : existingRegistration.ticket?.name}".
              {existingRegistration.checked_in ? " Vous avez été enregistré comme présent." : " N'oubliez pas de vous présenter le jour J !"}
              Vous pouvez toutefois enregistrer d'autres personnes ou reprendre un nouveau billet si besoin.
              {' '}
              <Link href="/account" className="underline">Gérer mes inscriptions</Link>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale - Formats disponibles */}
          <div className="lg:col-span-2 space-y-8">
            {/* Formats de course disponibles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Formats disponibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!event.tickets || event.tickets.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Aucun format de ticket disponible pour cet événement.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {event.tickets.map((ticket: any) => (
                      <div key={ticket.id} className="border rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-semibold">{ticket.name}</h3>
                              {ticket.requires_document && (
                                <Badge variant="secondary">
                                  Document requis
                                </Badge>
                              )}
                            </div>
                            
                            {ticket.description && (
                              <p className="text-muted-foreground mb-4">{ticket.description}</p>
                            )}

                            {/* Informations sur la course associée */}
                            {ticket.race && (
                              <div className="space-y-3 mb-4">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline" className={getTypeColor(ticket.race.type)}>
                                    {ticket.race.type === 'trail' ? 'Trail' :
                                     ticket.race.type === 'obstacle' ? 'Course d\'obstacles' :
                                     ticket.race.type === 'urbain' ? 'Course urbaine' :
                                     ticket.race.type === 'nature' ? 'Course nature' :
                                     ticket.race.type === 'extreme' ? 'Course extrême' : ticket.race.type}
                                  </Badge>
                                  <Badge variant="outline" className={getDifficultyColor(ticket.race.difficulty)}>
                                    <Star className="h-3 w-3 mr-1" />
                                    Difficulté {ticket.race.difficulty}/10
                                  </Badge>
                                  <Badge variant="outline" className={getPublicColor(ticket.race.target_public)}>
                                    <Target className="h-3 w-3 mr-1" />
                                    {ticket.race.target_public === 'débutant' ? 'Débutant' :
                                     ticket.race.target_public === 'intermédiaire' ? 'Intermédiaire' :
                                     ticket.race.target_public === 'expert' ? 'Expert' :
                                     ticket.race.target_public === 'famille' ? 'Famille' :
                                     ticket.race.target_public === 'pro' ? 'Professionnel' : ticket.race.target_public}
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="flex items-center gap-2">
                                    <Mountain className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Distance: {ticket.race.distance_km} km</span>
                                  </div>
                                  
                                  {ticket.race.obstacles && ticket.race.obstacles.length > 0 && (
                                    <div className="flex items-center gap-2">
                                      <Zap className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm">{ticket.race.obstacles.length} obstacles</span>
                                    </div>
                                  )}
                                </div>

                                {ticket.race.description && (
                                  <p className="text-sm text-muted-foreground italic">
                                    {ticket.race.description}
                                  </p>
                                )}

                                {/* Aperçu des obstacles */}
                                {ticket.race.obstacles && ticket.race.obstacles.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-sm font-medium mb-2">Obstacles inclus :</p>
                                    <div className="flex flex-wrap gap-1">
                                    {ticket.race.obstacles
                                        .sort((a: any, b: any) => a.order_position - b.order_position)
                                        .slice(0, 5)
                                        .map((obstacle: any) => (
                                            <Badge key={obstacle.id} variant="secondary" className="text-xs">
                                                {obstacle.name}
                                            </Badge>
                                        ))}
                                      {ticket.race.obstacles.length > 5 && (
                                        <Badge variant="outline" className="text-xs">
                                          +{ticket.race.obstacles.length - 5} autres
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Documents requis */}
                            {ticket.requires_document && ticket.document_types && ticket.document_types.length > 0 && (
                              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                <p className="text-sm font-medium text-orange-800 mb-1">Documents requis :</p>
                                <ul className="text-sm text-orange-700 space-y-1">
                                  {ticket.document_types.map((type: any) => (
                                    <li key={type}>
                                      • {type === 'medical_certificate' ? 'Certificat médical' :
                                          type === 'sports_license' ? 'Licence sportive' :
                                          type === 'insurance' ? 'Attestation d\'assurance' :
                                          type === 'id_document' ? 'Pièce d\'identité' :
                                          type === 'parental_authorization' ? 'Autorisation parentale' : type}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Prix */}
                          <div className="text-right ml-6">
                            <div className="text-2xl font-bold text-primary">
                              {(ticket.base_price_cents / 100).toLocaleString('fr-FR', {
                                style: 'currency',
                                currency: ticket.currency.toUpperCase()
                              })}
                            </div>
                            {ticket.max_participants > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Max {ticket.max_participants} participants
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

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
            {!existingRegistration && (
              <EventRegistration 
                event={event}
                tickets={event.tickets || []}
                user={user}
                availableSpots={availableSpots}
              />
            )}

            {/* Météo et conseils */}
            <Card className="mt-6">
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

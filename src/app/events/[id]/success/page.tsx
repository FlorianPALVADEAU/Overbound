// src/app/events/[id]/success/page.tsx
import { createSupabaseServer } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Mail,
  Download,
  Trophy,
  QrCode
} from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import Stripe from 'stripe'

interface SuccessPageProps {
  params: { id: string }
  searchParams: { session_id?: string }
}

export default async function EventSuccessPage({ params, searchParams }: SuccessPageProps) {
  const { session_id } = searchParams

  if (!session_id) {
    redirect(`/events/${params.id}`)
  }

  const supabase = await createSupabaseServer()
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-07-30.basil',
  })

  // Récupérer les détails de la session Stripe
  let session: Stripe.Checkout.Session | null = null
  try {
    session = await stripe.checkout.sessions.retrieve(session_id)
  } catch (error) {
    console.error('Erreur récupération session Stripe:', error)
    redirect(`/events/${params.id}`)
  }

  if (!session || session.payment_status !== 'paid') {
    redirect(`/events/${params.id}`)
  }

  // Récupérer l'inscription créée
  const { data: registration, error: registrationError } = await supabase
    .from('registrations')
    .select(`
      *,
      ticket:tickets (
        id,
        name,
        description,
        base_price_cents,
        currency,
        requires_document,
        race:races!tickets_race_id_fkey (
          id,
          name,
          type,
          difficulty,
          distance_km
        )
      ),
      event:events (
        id,
        title,
        subtitle,
        date,
        location
      ),
      order:orders (
        id,
        amount_total,
        currency,
        stripe_session_id
      )
    `)
    .eq('order.stripe_session_id', session_id)
    .single()

  if (registrationError || !registration) {
    console.error('Inscription non trouvée pour la session:', session_id)
    notFound()
  }

  const formatPrice = (priceInCents: number, currency: string) => {
    return (priceInCents / 100).toLocaleString('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase()
    })
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return 'bg-green-100 text-green-800'
    if (difficulty <= 6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Hero Success */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-100 rounded-full">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            Inscription confirmée ! 🎉
          </h1>
          <p className="text-xl text-muted-foreground">
            Votre paiement a été traité avec succès. Vous êtes maintenant inscrit à l'événement.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Détails de l'inscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Détails de votre inscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Événement */}
              <div>
                <h3 className="font-semibold text-lg mb-2">{registration.event.title}</h3>
                {registration.event.subtitle && (
                  <p className="text-muted-foreground mb-3">{registration.event.subtitle}</p>
                )}
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>
                      {new Date(registration.event.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })} à {new Date(registration.event.date).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{registration.event.location}</span>
                  </div>
                </div>
              </div>

              {/* Ticket et Course */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Votre format</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Ticket :</span>
                    <span className="font-medium">{registration.ticket.name}</span>
                  </div>
                  
                  {registration.ticket.race && (
                    <>
                      <div className="flex items-center justify-between">
                        <span>Course :</span>
                        <Badge variant="outline" className={getDifficultyColor(registration.ticket.race.difficulty)}>
                          {registration.ticket.race.name}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Distance :</span>
                        <span>{registration.ticket.race.distance_km} km</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Difficulté :</span>
                        <span>{registration.ticket.race.difficulty}/10</span>
                      </div>
                    </>
                  )}
                  
                  <div className="flex items-center justify-between font-medium text-lg border-t pt-2">
                    <span>Total payé :</span>
                    <span className="text-primary">
                      {formatPrice(registration.order.amount_total, registration.order.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Document requis */}
              {registration.ticket.requires_document && (
                <div className="border-t pt-4">
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="font-medium text-orange-800 mb-2">⚠️ Document requis</h4>
                    <p className="text-sm text-orange-700">
                      Votre inscription nécessite un document justificatif. 
                      Vous devrez le télécharger dans votre espace personnel pour valider votre participation.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Prochaines étapes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Email de confirmation</h4>
                    <p className="text-sm text-blue-700">
                      Un email de confirmation avec votre QR code a été envoyé à {registration.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link href={`/account/ticket/${registration.id}`}>
                    <Button className="w-full">
                      <QrCode className="h-4 w-4 mr-2" />
                      Voir mon billet et QR code
                    </Button>
                  </Link>

                  <Link href="/account">
                    <Button variant="outline" className="w-full">
                      <Trophy className="h-4 w-4 mr-2" />
                      Mes inscriptions
                    </Button>
                  </Link>

                  {registration.ticket.requires_document && (
                    <Link href={`/account/registration/${registration.id}/document`}>
                      <Button variant="outline" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger mon document
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Informations importantes */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Informations importantes</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Présentez votre QR code le jour de l'événement</p>
                  <p>• Arrivez 30 minutes avant le début</p>
                  <p>• Apportez une pièce d'identité</p>
                  <p>• Annulation possible jusqu'à 48h avant</p>
                </div>
              </div>

              {/* Contact */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Besoin d'aide ?</h4>
                <p className="text-sm text-muted-foreground">
                  Contactez-nous à{' '}
                  <a href="mailto:support@overbound.com" className="text-primary hover:underline">
                    support@overbound.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informations sur l'événement */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Préparez-vous pour l'événement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-2">Équipement recommandé</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Tenue de sport adaptée à la météo</li>
                  <li>• Chaussures de trail ou running</li>
                  <li>• Gourde d'eau</li>
                  <li>• Serviette</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Horaires</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Ouverture accueil : 30 min avant</li>
                  <li>• Échauffement collectif : 15 min avant</li>
                  <li>• Début de course : heure précise</li>
                  <li>• Remise des prix : après la course</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Services sur place</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Vestiaires et douches</li>
                  <li>• Stand de ravitaillement</li>
                  <li>• Service médical</li>
                  <li>• Photographe officiel</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bouton de retour */}
        <div className="text-center mt-8">
          <Link href="/events">
            <Button variant="outline">
              Découvrir d'autres événements
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
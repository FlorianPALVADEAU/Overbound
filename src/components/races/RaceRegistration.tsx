import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Calendar, 
  MapPin, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Trophy,
  CreditCard,
  FileText
} from 'lucide-react'

// Interfaces pour typer les données
interface Ticket {
  id: string
  name: string
  description?: string
  base_price_cents: number
  currency: string
  max_participants: number
  requires_document: boolean
  document_types?: string[]
  race?: {
    id: string
    name: string
    type: string
    difficulty: number
    target_public: string
    distance_km: number
    description?: string
  }
}

interface Event {
  id: string
  title: string
  subtitle?: string
  date: string
  location: string
  capacity: number
  status: string
}

interface User {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
  }
}

interface RaceRegistrationProps {
  event: Event
  tickets: Ticket[]
  user: User | null
  availableSpots: number
}

export default function RaceRegistration({ 
  event, 
  tickets, 
  user, 
  availableSpots 
}: RaceRegistrationProps) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleTicketSelect = (ticket: Ticket) => {
    if (!user) {
      // Rediriger vers la connexion si non connecté
      window.location.href = `/auth/login?next=/events/${event.id}`
      return
    }
    
    setSelectedTicket(ticket)
    setIsDialogOpen(true)
    setMessage(null)
  }

  const handleConfirmRegistration = async () => {
    if (!selectedTicket || !user) return

    setIsLoading(true)
    setMessage(null)

    try {
      // Créer la session de paiement Stripe
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          eventId: event.id,
          userId: user.id,
          userEmail: user.email,
          participantName: user.user_metadata?.full_name || user.email,
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création de la session de paiement')
      }

      const { url } = await response.json()
      
      if (!url) {
        throw new Error('URL de paiement manquante')
      }

      // Rediriger vers Stripe Checkout
      window.location.assign(url)

    } catch (error) {
      console.error('Erreur inscription:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erreur lors de l\'inscription'
      })
      setIsLoading(false)
    }
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

  const canRegister = availableSpots > 0 && event.status === 'on_sale'

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Inscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Veuillez vous connecter pour vous inscrire à cet événement.
            </AlertDescription>
          </Alert>
          <Button 
            className="w-full mt-4"
            onClick={() => window.location.href = `/auth/login?next=/events/${event.id}`}
          >
            Se connecter pour s'inscrire
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            S'inscrire à l'événement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canRegister && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {availableSpots <= 0 
                  ? 'Événement complet - plus de places disponibles'
                  : 'Les inscriptions ne sont pas ouvertes pour cet événement'
                }
              </AlertDescription>
            </Alert>
          )}

          {canRegister && (
            <>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-3">
                  Choisissez votre format de participation :
                </p>
                
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer hover:bg-accent/5"
                    onClick={() => handleTicketSelect(ticket)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{ticket.name}</h4>
                          {ticket.requires_document && (
                            <Badge variant="secondary" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              Document requis
                            </Badge>
                          )}
                        </div>
                        
                        {ticket.race && (
                          <div className="space-y-2 mb-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className={getDifficultyColor(ticket.race.difficulty)}>
                                {ticket.race.name}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {ticket.race.distance_km} km • Difficulté {ticket.race.difficulty}/10
                              </span>
                            </div>
                            {ticket.race.description && (
                              <p className="text-sm text-muted-foreground">
                                {ticket.race.description}
                              </p>
                            )}
                          </div>
                        )}
                        
                        {ticket.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {ticket.description}
                          </p>
                        )}
                        
                        {ticket.requires_document && ticket.document_types && ticket.document_types.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Documents requis : {ticket.document_types.join(', ')}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className="font-bold text-lg text-primary">
                          {formatPrice(ticket.base_price_cents, ticket.currency)}
                        </div>
                        <Button size="sm" className="mt-2">
                          Sélectionner
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Paiement sécurisé par Stripe
                  </p>
                  <p className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Confirmation instantanée par email
                  </p>
                  <p className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    QR code d'accès inclus
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmation */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer votre inscription</DialogTitle>
            <DialogDescription>
              Vérifiez les détails avant de procéder au paiement
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              {/* Résumé de l'événement */}
              <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                <h4 className="font-semibold">{event.title}</h4>
                
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(event.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>

              {/* Détails du ticket */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Format sélectionné</span>
                  <span>{selectedTicket.name}</span>
                </div>

                {selectedTicket.race && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Course</span>
                    <Badge variant="outline" className={getDifficultyColor(selectedTicket.race.difficulty)}>
                      {selectedTicket.race.name} - {selectedTicket.race.distance_km}km
                    </Badge>
                  </div>
                )}

                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total à payer</span>
                    <span className="text-primary">
                      {formatPrice(selectedTicket.base_price_cents, selectedTicket.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Avertissements */}
              {selectedTicket.requires_document && (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Document requis :</strong> Vous devrez télécharger un document 
                    justificatif après votre inscription pour valider votre participation.
                  </AlertDescription>
                </Alert>
              )}

              {/* Messages d'erreur */}
              {message && message.type === 'error' && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Paiement sécurisé via Stripe</p>
                <p>• Annulation gratuite jusqu'à 48h avant l'événement</p>
                <p>• QR code envoyé par email après paiement</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleConfirmRegistration}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Redirection...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Payer {selectedTicket && formatPrice(selectedTicket.base_price_cents, selectedTicket.currency)}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
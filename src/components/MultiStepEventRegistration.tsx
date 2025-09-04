import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Calendar, 
  MapPin, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  Trophy,
  CreditCard,
  FileText,
  Upload,
  Shirt,
  Camera,
  ChevronRight,
  ChevronLeft,
  X,
  Loader2
} from 'lucide-react'
import EmbeddedStripeCheckout from './EmbeddedStripeCheckout'

// Mock data - replace with your actual interfaces
const mockEvent = {
  id: 'event-1',
  title: 'Trail des Collines 2024',
  date: '2024-12-15T09:00:00Z',
  location: 'Fontainebleau, France',
  capacity: 200,
  status: 'on_sale'
}

const mockTickets = [
  {
    id: 'ticket-1',
    name: 'Trail 10km',
    description: 'Course trail de 10km en forêt',
    base_price_cents: 2500,
    currency: 'eur',
    requires_document: true,
    race: {
      id: 'race-1',
      name: 'Trail Nature',
      distance_km: 10,
      difficulty: 4
    }
  },
  {
    id: 'ticket-2',
    name: 'Trail 21km',
    description: 'Course trail de 21km avec obstacles',
    base_price_cents: 3500,
    currency: 'eur',
    requires_document: true,
    race: {
      id: 'race-2',
      name: 'Trail Expert',
      distance_km: 21,
      difficulty: 7
    }
  }
]

const mockUpsells = [
  {
    id: 'upsell-1',
    name: 'T-shirt Technique',
    description: 'T-shirt technique officiel de l\'événement',
    price_cents: 2000,
    currency: 'eur',
    image: '👕',
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  {
    id: 'upsell-2',
    name: 'Pack Photo',
    description: 'Toutes vos photos de course en haute définition',
    price_cents: 1500,
    currency: 'eur',
    image: '📸',
    digital: true
  },
  {
    id: 'upsell-3',
    name: 'Ravitaillement Premium',
    description: 'Ravitaillement renforcé avec produits bio',
    price_cents: 800,
    currency: 'eur',
    image: '🥤'
  }
]

type User = {
  id: string;
  email: string;
};

interface MultiStepEventRegistrationProps {
  user?: User;
  availableSpots?: number;
}

export default function MultiStepEventRegistration({ user, availableSpots = 50 }: MultiStepEventRegistrationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [selectedUpsells, setSelectedUpsells] = useState<any[]>([])
  const [documentFile, setDocumentFile] = useState<any>(null)
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [clientSecret, setClientSecret] = useState(null)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  
  // Mock user for demo
  const mockUser = user || { id: 'user-1', email: 'demo@example.com' }

  const formatPrice = (priceInCents: number, currency: string): string => {
    return (priceInCents / 100).toLocaleString('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase()
    })
  }

  const getTotalPrice = () => {
    let total = selectedTicket ? selectedTicket.base_price_cents : 0
    selectedUpsells.forEach(upsell => {
      total += upsell.price_cents
    })
    return total
  }

  const handleTicketSelect = (ticket: any) => {
    setSelectedTicket(ticket)
  }

  const handleUpsellToggle = (upsell: any, options = {}) => {
    setSelectedUpsells((prev: any) => {
      const existing = prev.find((item: any) => item.id === upsell.id)
      if (existing) {
        return prev.filter((item: any) => item.id !== upsell.id)
      } else {
        return [...prev, { ...upsell, options }]
      }
    })
  }

  const handleNext = async () => {
    if (currentStep === 2) {
      // Moving to payment step - create PaymentIntent
      await createPaymentIntent()
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const createPaymentIntent = async () => {
    setLoading(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          eventId: mockEvent.id,
          userId: mockUser.id,
          userEmail: mockUser.email,
          upsells: selectedUpsells,
          amount: getTotalPrice(),
          currency: selectedTicket.currency
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création du paiement')
      }

      const { clientSecret } = await response.json()
      setClientSecret(clientSecret)
    } catch (error: any) {
      console.error('Erreur création PaymentIntent:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Erreur lors de la préparation du paiement'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0]
    if (file) {
      setDocumentFile(file)
    }
  }

  const handlePaymentSuccess = async (paymentIntent: any) => {
    setPaymentProcessing(true)
    
    try {
      // Create registration after successful payment
      const response = await fetch('/api/registrations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          ticketId: selectedTicket.id,
          eventId: mockEvent.id,
          userId: mockUser.id,
          upsells: selectedUpsells,
          documentFile: documentFile ? documentFile.name : null
        })
      })

      if (response.ok) {
        setMessage({
          type: 'success',
          text: '🎉 Inscription réussie ! Un email de confirmation vous a été envoyé.'
        })
        
        // Close dialog after success
        setTimeout(() => {
          setIsOpen(false)
          // Optionally redirect to success page
          window.location.href = `/events/${mockEvent.id}/success`
        }, 2000)
      }
    } catch (error) {
      console.error('Erreur création inscription:', error)
      setMessage({
        type: 'error',
        text: 'Paiement réussi mais erreur lors de la création de l\'inscription. Contactez le support.'
      })
    } finally {
      setPaymentProcessing(false)
    }
  }

  const handlePaymentError = (error: any) => {
    setMessage({
      type: 'error',
      text: error.message || 'Erreur lors du paiement'
    })
  }

  const canProceedFromStep1 = selectedTicket !== null
  const canProceedFromStep2 = true // Always can proceed from upsells
  const canProceedFromStep3 = (!selectedTicket?.requires_document || documentFile) && disclaimerAccepted

  const stepProgress = (currentStep / 3) * 100

  // Step 1: Ticket Selection
  const renderTicketSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Choisissez votre format</h3>
        <p className="text-muted-foreground">Sélectionnez le type de course qui vous convient</p>
      </div>
      
      <div className="space-y-4">
        {mockTickets.map((ticket) => (
          <div
            key={ticket.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedTicket?.id === ticket.id 
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => handleTicketSelect(ticket)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold">{ticket.name}</h4>
                  {ticket.requires_document && (
                    <Badge variant="secondary" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      Document requis
                    </Badge>
                  )}
                  {selectedTicket?.id === ticket.id && (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{ticket.description}</p>
                {ticket.race && (
                  <div className="text-xs text-muted-foreground">
                    {ticket.race.distance_km} km • Difficulté {ticket.race.difficulty}/10
                  </div>
                )}
              </div>
              <div className="text-right ml-4">
                <div className="text-lg font-bold text-primary">
                  {formatPrice(ticket.base_price_cents, ticket.currency)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // Step 2: Upsells Selection
  const renderUpsellSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Améliorez votre expérience</h3>
        <p className="text-muted-foreground">Ajoutez des options pour enrichir votre participation</p>
      </div>
      
      <div className="space-y-4">
        {mockUpsells.map((upsell) => {
          const isSelected = selectedUpsells.some(item => item.id === upsell.id)
          
          return (
            <div
              key={upsell.id}
              className={`border rounded-lg p-4 transition-all ${
                isSelected 
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                  : 'border-border'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl">{upsell.image}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{upsell.name}</h4>
                    {upsell.digital && <Badge variant="outline">Digital</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{upsell.description}</p>
                  
                  {upsell.sizes && (
                    <div className="space-y-2 mb-3">
                      <Label className="text-xs">Taille :</Label>
                      <div className="flex gap-2">
                        {upsell.sizes.map(size => (
                          <Button
                            key={size}
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            {size}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-primary">
                      {formatPrice(upsell.price_cents, upsell.currency)}
                    </div>
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleUpsellToggle(upsell)}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Ajouté
                        </>
                      ) : (
                        'Ajouter'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selectedUpsells.length === 0 && (
        <div className="text-center p-6 border-2 border-dashed border-muted rounded-lg">
          <p className="text-muted-foreground">Aucun extra sélectionné - vous pouvez continuer sans options supplémentaires</p>
        </div>
      )}
    </div>
  )

  // Step 3: Document Upload + Disclaimer + Payment
  const renderFinalStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Finaliser votre inscription</h3>
        <p className="text-muted-foreground">Dernières étapes avant le paiement</p>
      </div>

      {/* Document Upload */}
      {selectedTicket?.requires_document && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              Document justificatif requis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Veuillez télécharger un certificat médical ou une attestation d'assurance.
              </p>
              
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {documentFile ? (
                  <div className="space-y-2">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                    <p className="font-medium">{documentFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(documentFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDocumentFile(null)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-sm font-medium">Télécharger un document</p>
                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG • Max 10MB</p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="document-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        const input = document.getElementById('document-upload');
                        if (input) input.click();
                      }}
                    >
                      Choisir un fichier
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4" />
            Décharge de responsabilité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg text-sm max-h-32 overflow-y-auto">
              <p className="mb-2 font-medium">Conditions de participation :</p>
              <p className="mb-2">
                Je déclare participer à cet événement en pleine connaissance des risques encourus 
                et dégage les organisateurs de toute responsabilité en cas d'accident.
              </p>
              <p className="mb-2">
                Je certifie être en parfaite condition physique et apte à participer à cette épreuve sportive.
              </p>
              <p>
                Je m'engage à respecter le règlement de l'épreuve et les consignes de sécurité.
              </p>
            </div>
            
            <div className="flex items-start space-x-2">
              <Checkbox
                id="disclaimer"
                checked={disclaimerAccepted}
                onCheckedChange={checked => setDisclaimerAccepted(checked === true)}
              />
              <Label htmlFor="disclaimer" className="text-sm leading-relaxed">
                Je déclare avoir lu et accepter les conditions de participation et la décharge de responsabilité
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Récapitulatif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {selectedTicket && (
              <div className="flex justify-between">
                <span>{selectedTicket.name}</span>
                <span>{formatPrice(selectedTicket.base_price_cents, selectedTicket.currency)}</span>
              </div>
            )}
            
            {selectedUpsells.map(upsell => (
              <div key={upsell.id} className="flex justify-between text-sm">
                <span>{upsell.name}</span>
                <span>{formatPrice(upsell.price_cents, upsell.currency)}</span>
              </div>
            ))}
            
            <div className="border-t pt-3">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">
                  {formatPrice(getTotalPrice(), selectedTicket?.currency || 'eur')}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Embedded Stripe Checkout */}
      <Card>
        <CardHeader>
          <CardTitle>Paiement sécurisé</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentProcessing ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="font-medium">Finalisation de votre inscription...</p>
              <p className="text-sm text-muted-foreground">Veuillez patienter, ne fermez pas cette fenêtre</p>
            </div>
          ) : (
            <EmbeddedStripeCheckout
              clientSecret={clientSecret ?? ''}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              totalAmount={getTotalPrice()}
              currency={selectedTicket?.currency || 'eur'}
              loading={loading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            S'inscrire à l'événement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={() => setIsOpen(true)}
              className="w-full"
              disabled={availableSpots <= 0}
            >
              {availableSpots <= 0 ? 'Événement complet' : 'Commencer l\'inscription'}
            </Button>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Processus en 3 étapes</p>
              <p>• Paiement sécurisé intégré</p>
              <p>• Confirmation immédiate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Multi-step Registration Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inscription - {mockEvent.title}</DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                {new Date(mockEvent.date).toLocaleDateString('fr-FR')} à {mockEvent.location}
              </div>
            </DialogDescription>
          </DialogHeader>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Étape {currentStep} sur 3</span>
              <span>{Math.round(stepProgress)}%</span>
            </div>
            <Progress value={stepProgress} className="h-2" />
          </div>

          {/* Step Content */}
          <div className="py-4">
            {currentStep === 1 && renderTicketSelection()}
            {currentStep === 2 && renderUpsellSelection()}
            {currentStep === 3 && renderFinalStep()}
          </div>

          {/* Navigation - Hidden during payment processing */}
          {!paymentProcessing && (
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={currentStep === 1 ? () => setIsOpen(false) : handleBack}
                disabled={loading}
              >
                {currentStep === 1 ? 'Annuler' : (
                  <>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Précédent
                  </>
                )}
              </Button>

              {currentStep < 3 ? (
                <Button
                  onClick={handleNext}
                  disabled={
                    loading ||
                    (currentStep === 1 && !canProceedFromStep1) ||
                    (currentStep === 2 && !canProceedFromStep2)
                  }
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Préparation...
                    </>
                  ) : (
                    <>
                      Suivant
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          )}

          {/* Error/Success Messages */}
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              {message.type === 'error' ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
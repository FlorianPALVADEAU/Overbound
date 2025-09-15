'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Clock, 
  Calendar, 
  MapPin, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { VolunteerCheckin } from './VolunteerCheckin'

interface Event {
  id: string
  title: string
  date: string
  location: string
  status: string
}

interface VolunteerAccessControlProps {
  onEventSelect?: (eventId: string) => void
}

export function VolunteerAccessControl({ onEventSelect }: VolunteerAccessControlProps) {
  const [availableEvents, setAvailableEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les événements accessibles pour le bénévole
  useEffect(() => {
    const loadAccessibleEvents = async () => {
      try {
        const response = await fetch('/api/volunteers/accessible-events')
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des événements')
        }

        const data = await response.json()
        setAvailableEvents(data.events)
        
        // Sélectionner automatiquement le premier événement accessible
        if (data.events.length > 0) {
          setSelectedEvent(data.events[0])
          onEventSelect?.(data.events[0].id)
        }
        
      } catch (error) {
        console.error('Erreur:', error)
        setError('Impossible de charger les événements accessibles')
      } finally {
        setLoading(false)
      }
    }

    loadAccessibleEvents()
  }, [onEventSelect])

  if (loading) {
    return (
      <div className="text-center py-12">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
        <p className="text-muted-foreground">Vérification des accès...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (availableEvents.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun événement accessible</h3>
          <p className="text-muted-foreground mb-4">
            Tu peux accéder au check-in uniquement 24h avant et après un événement.
          </p>
          <div className="text-sm text-muted-foreground">
            <p>Les événements seront disponibles automatiquement dans la fenêtre d'accès.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sélection d'événement */}
      {availableEvents.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Sélectionner un événement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {availableEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => {
                    setSelectedEvent(event)
                    onEventSelect?.(event.id)
                  }}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedEvent?.id === event.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{event.title}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(event.date).toLocaleString('fr-FR', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </div>
                      </div>
                    </div>
                    {selectedEvent?.id === event.id && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations sur l'événement sélectionné */}
      {selectedEvent && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Événement actif :</strong> {selectedEvent.title} - {' '}
            {new Date(selectedEvent.date).toLocaleString('fr-FR', {
              dateStyle: 'full',
              timeStyle: 'short'
            })}
          </AlertDescription>
        </Alert>
      )}

      {/* Interface de check-in */}
      {selectedEvent && (
        <VolunteerCheckin />
      )}
    </div>
  )
}
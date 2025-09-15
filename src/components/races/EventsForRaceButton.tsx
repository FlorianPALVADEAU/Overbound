'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Calendar, 
  MapPin, 
  Users,
  Trophy,
  Clock,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  date: string
  location: string
  status: string
  capacity: number
  registrations_count?: number
}

interface EventsForRaceButtonProps {
  raceId: string
}

export default function EventsForRaceButton({ raceId }: EventsForRaceButtonProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const loadEvents = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/races/${raceId}/events`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadEvents()
    }
  }, [isOpen, raceId])

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
      case 'on_sale': return 'Ouvert'
      case 'sold_out': return 'Complet'
      case 'closed': return 'Fermé'
      case 'draft': return 'Bientôt'
      default: return status
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Trophy className="h-4 w-4 mr-2" />
          S'inscrire
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Événements disponibles</DialogTitle>
          <DialogDescription>
            Choisissez un événement pour vous inscrire à cette course
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-8 w-8 text-muted-foreground mb-2 animate-spin" />
              <p className="text-muted-foreground">Chargement des événements...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun événement disponible</h3>
              <p className="text-muted-foreground">
                Cette course n'est actuellement programmée dans aucun événement.
              </p>
            </div>
          ) : (
            events.map((event) => {
              const isUpcoming = new Date(event.date) > new Date()
              const availableSpots = event.capacity - (event.registrations_count || 0)
              const canRegister = event.status === 'on_sale' && availableSpots > 0 && isUpcoming

              return (
                <div
                  key={event.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    canRegister ? 'hover:border-primary/50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{event.title}</h4>
                        <Badge variant={getStatusColor(event.status)}>
                          {getStatusLabel(event.status)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(event.date).toLocaleDateString('fr-FR', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{event.location}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{availableSpots} places disponibles</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(event.date).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Barre de progression */}
                      <div className="space-y-1 mb-3">
                        <div className="flex justify-between text-xs">
                          <span>Inscriptions</span>
                          <span>{event.registrations_count || 0} / {event.capacity}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div 
                            className={`rounded-full h-1.5 transition-all ${
                              availableSpots <= 0 ? 'bg-red-500' : 'bg-primary'
                            }`}
                            style={{ 
                              width: `${Math.min(100, ((event.registrations_count || 0) / event.capacity) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4">
                      {canRegister ? (
                        <Link href={`/events/${event.id}`}>
                          <Button size="sm" onClick={() => setIsOpen(false)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            S'inscrire
                          </Button>
                        </Link>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          {!isUpcoming ? 'Terminé' : 
                           availableSpots <= 0 ? 'Complet' : 'Fermé'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react'

interface Event {
  id: string
  slug: string
  title: string
  subtitle?: string
  date: string
  location: string
  capacity: number
  status: 'draft' | 'on_sale' | 'sold_out' | 'closed'
  external_provider?: string
  external_event_id?: string
  external_url?: string
  created_at: string
  updated_at: string
}

interface EventFormData {
  slug: string
  title: string
  subtitle: string
  date: string
  location: string
  capacity: string
  status: string
  external_provider: string
  external_event_id: string
  external_url: string
}

export function AdminEventsCrud() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [formData, setFormData] = useState<EventFormData>({
    slug: '',
    title: '',
    subtitle: '',
    date: '',
    location: '',
    capacity: '0',
    status: 'draft',
    external_provider: '',
    external_event_id: '',
    external_url: ''
  })

  // Charger les événements
  const loadEvents = async () => {
    try {
      const response = await fetch('/api/admin/events')
      if (!response.ok) throw new Error('Erreur de chargement')
      
      const data = await response.json()
      setEvents(data.events || [])
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors du chargement des événements' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      slug: '',
      title: '',
      subtitle: '',
      date: '',
      location: '',
      capacity: '0',
      status: 'draft',
      external_provider: '',
      external_event_id: '',
      external_url: ''
    })
    setSelectedEvent(null)
    setIsCreateMode(false)
  }

  // Ouvrir le dialogue pour créer
  const handleCreate = () => {
    resetForm()
    setIsCreateMode(true)
    setIsDialogOpen(true)
  }

  // Ouvrir le dialogue pour éditer
  const handleEdit = (event: Event) => {
    setSelectedEvent(event)
    setFormData({
      slug: event.slug,
      title: event.title,
      subtitle: event.subtitle || '',
      date: new Date(event.date).toISOString().slice(0, 16),
      location: event.location,
      capacity: event.capacity.toString(),
      status: event.status,
      external_provider: event.external_provider || '',
      external_event_id: event.external_event_id || '',
      external_url: event.external_url || ''
    })
    setIsCreateMode(false)
    setIsDialogOpen(true)
  }

  // Génération automatique du slug
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-')
  }

  // Gérer les changements du formulaire
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Auto-génération du slug si on modifie le titre
      ...(field === 'title' && { slug: generateSlug(value) })
    }))
  }

  // Sauvegarder l'événement
  const handleSave = async () => {
    if (!formData.title || !formData.date || !formData.location) {
      setMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const method = isCreateMode ? 'POST' : 'PUT'
      const url = isCreateMode ? '/api/admin/events' : `/api/admin/events/${selectedEvent?.id}`
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          capacity: parseInt(formData.capacity) || 0,
          date: new Date(formData.date).toISOString()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur de sauvegarde')
      }

      const result = await response.json()
      
      if (isCreateMode) {
        setEvents(prev => [result.event, ...prev])
        setMessage({ type: 'success', text: 'Événement créé avec succès' })
      } else {
        setEvents(prev => prev.map(e => e.id === selectedEvent?.id ? result.event : e))
        setMessage({ type: 'success', text: 'Événement mis à jour avec succès' })
      }

      setIsDialogOpen(false)
      resetForm()
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde' 
      })
    } finally {
      setSaving(false)
    }
  }

  // Supprimer un événement
  const handleDelete = async (event: Event) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${event.title}" ?`)) {
      return
    }

    setDeleteLoading(event.id)
    try {
      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      setEvents(prev => prev.filter(e => e.id !== event.id))
      setMessage({ type: 'success', text: 'Événement supprimé avec succès' })
      
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' })
    } finally {
      setDeleteLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary'
      case 'on_sale': return 'default'
      case 'sold_out': return 'destructive'
      case 'closed': return 'outline'
      default: return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Brouillon'
      case 'on_sale': return 'En vente'
      case 'sold_out': return 'Complet'
      case 'closed': return 'Fermé'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
        <p className="text-muted-foreground">Chargement des événements...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton créer */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des événements</h2>
          <p className="text-muted-foreground">
            Créer, modifier et gérer vos événements sportifs
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel événement
        </Button>
      </div>

      {/* Messages */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'error' ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Liste des événements */}
      <div className="grid gap-4">
        {events.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun événement</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par créer votre premier événement
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un événement
              </Button>
            </CardContent>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold truncate">{event.title}</h3>
                      <Badge variant={getStatusColor(event.status)}>
                        {getStatusLabel(event.status)}
                      </Badge>
                    </div>
                    
                    {event.subtitle && (
                      <p className="text-sm text-muted-foreground mb-3">{event.subtitle}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {new Date(event.date).toLocaleString('fr-FR', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{event.capacity} places</span>
                      </div>
                    </div>

                    {event.external_provider && (
                      <div className="mt-3 text-sm text-muted-foreground">
                        <span className="font-medium">Prestataire externe:</span> {event.external_provider}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(event)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(event)}
                      disabled={deleteLoading === event.id}
                    >
                      {deleteLoading === event.id ? (
                        <Clock className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog pour créer/éditer */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreateMode ? 'Créer un événement' : 'Modifier l\'événement'}
            </DialogTitle>
            <DialogDescription>
              {isCreateMode 
                ? 'Créez un nouvel événement sportif avec tous les détails nécessaires'
                : 'Modifiez les informations de cet événement'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Titre */}
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                placeholder="Ex: Trail des Collines 2024"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug URL *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleFormChange('slug', e.target.value)}
                placeholder="trail-des-collines-2024"
              />
              <p className="text-xs text-muted-foreground">
                Généré automatiquement depuis le titre. Utilisé dans l'URL.
              </p>
            </div>

            {/* Sous-titre */}
            <div className="space-y-2">
              <Label htmlFor="subtitle">Sous-titre</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => handleFormChange('subtitle', e.target.value)}
                placeholder="Course nature en forêt"
              />
            </div>

            {/* Date et heure */}
            <div className="space-y-2">
              <Label htmlFor="date">Date et heure *</Label>
              <Input
                id="date"
                type="datetime-local"
                value={formData.date}
                onChange={(e) => handleFormChange('date', e.target.value)}
              />
            </div>

            {/* Lieu */}
            <div className="space-y-2">
              <Label htmlFor="location">Lieu *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleFormChange('location', e.target.value)}
                placeholder="Forêt de Fontainebleau, 77300 Fontainebleau"
              />
            </div>

            {/* Capacité et statut */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacité *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="0"
                  value={formData.capacity}
                  onChange={(e) => handleFormChange('capacity', e.target.value)}
                  placeholder="200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: string) => handleFormChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="on_sale">En vente</SelectItem>
                    <SelectItem value="sold_out">Complet</SelectItem>
                    <SelectItem value="closed">Fermé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Section prestataire externe */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium">Prestataire externe (optionnel)</h4>
              
              <div className="space-y-2">
                <Label htmlFor="external_provider">Prestataire</Label>
                <Select 
                  value={formData.external_provider} 
                  onValueChange={(value: string) => handleFormChange('external_provider', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Aucun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun</SelectItem>
                    <SelectItem value="billetweb">Billetweb</SelectItem>
                    <SelectItem value="adeorun">Adeorun</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.external_provider && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="external_event_id">ID événement externe</Label>
                    <Input
                      id="external_event_id"
                      value={formData.external_event_id}
                      onChange={(e) => handleFormChange('external_event_id', e.target.value)}
                      placeholder="ID de l'événement chez le prestataire"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="external_url">URL externe</Label>
                    <Input
                      id="external_url"
                      type="url"
                      value={formData.external_url}
                      onChange={(e) => handleFormChange('external_url', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  {isCreateMode ? 'Création...' : 'Mise à jour...'}
                </>
              ) : (
                isCreateMode ? 'Créer' : 'Mettre à jour'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
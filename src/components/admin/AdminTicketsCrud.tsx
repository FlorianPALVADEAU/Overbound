/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
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
} from '@/components/ui/dialog'
import { 
  Ticket, 
  Plus, 
  Edit, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  FileText,
  Search
} from 'lucide-react'
import { Textarea } from '../ui/textarea'

interface Race {
  id: string
  name: string
  type: string
  difficulty: number
  target_public: string
  distance_km: number
  description: string
}

interface Event {
  id: string
  title: string
  date: string
  status: string
}

interface TicketType {
  id: string
  event_id: string
  race_id?: string
  name: string
  description?: string
  base_price_cents: number  // Changé de 'price' à 'base_price_cents'
  currency: string
  max_participants: number
  requires_document: boolean
  document_types?: string[]
  created_at: string
  event?: Event
  race?: Race
}

interface TicketFormData {
  event_id: string
  race_id: string
  name: string
  description: string
  price: string
  currency: string
  max_participants: string
  requires_document: boolean
  document_types: string[]
}

const CURRENCY_OPTIONS = [
  { value: 'eur', label: 'EUR (€)' },
  { value: 'usd', label: 'USD ($)' }
]

const DOCUMENT_TYPES = [
  { value: 'medical_certificate', label: 'Certificat médical' },
  { value: 'sports_license', label: 'Licence sportive' },
  { value: 'insurance', label: 'Attestation d\'assurance' },
  { value: 'id_document', label: 'Pièce d\'identité' },
  { value: 'parental_authorization', label: 'Autorisation parentale' }
]

export function AdminTicketsCrud() {
  const [tickets, setTickets] = useState<TicketType[]>([])
  const [filteredTickets, setFilteredTickets] = useState<TicketType[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null)
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Filtres
  const [eventFilter, setEventFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  const [formData, setFormData] = useState<TicketFormData>({
    event_id: '',
    race_id: 'none',
    name: '',
    description: '',
    price: '0',
    currency: 'eur',
    max_participants: '0',
    requires_document: false,
    document_types: []
  })

  // Charger les données
  const loadData = async () => {
    try {
      const [ticketsRes, eventsRes, racesRes] = await Promise.all([
        fetch('/api/admin/tickets'),
        fetch('/api/admin/events'),
        fetch('/api/admin/races')
      ])
      
      if (!ticketsRes.ok || !eventsRes.ok || !racesRes.ok) {
        throw new Error('Erreur de chargement')
      }
      
      const [ticketsData, eventsData, racesData] = await Promise.all([
        ticketsRes.json(),
        eventsRes.json(), 
        racesRes.json()
      ])
      
      setTickets(ticketsData.tickets || [])
      setFilteredTickets(ticketsData.tickets || [])
      setEvents(eventsData.events || [])
      setRaces(racesData.races || [])
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors du chargement des données' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtrer les tickets
  useEffect(() => {
    let filtered = tickets

    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.event?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.race?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (eventFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.event_id === eventFilter)
    }

    setFilteredTickets(filtered)
  }, [tickets, searchTerm, eventFilter])

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      event_id: '',
      race_id: 'none',
      name: '',
      description: '',
      price: '0',
      currency: 'eur',
      max_participants: '0',
      requires_document: false,
      document_types: []
    })
    setSelectedTicket(null)
    setIsCreateMode(false)
  }

  // Ouvrir le dialogue pour créer
  const handleCreate = () => {
    resetForm()
    setIsCreateMode(true)
    setIsDialogOpen(true)
  }

  // Ouvrir le dialogue pour éditer
  const handleEdit = (ticket: TicketType) => {
    setSelectedTicket(ticket)
    setFormData({
      event_id: ticket.event_id,
      race_id: ticket.race_id || 'none',
      name: ticket.name,
      description: ticket.description || '',
      price: (ticket.base_price_cents / 100).toString(),  // Changé
      currency: ticket.currency,
      max_participants: ticket.max_participants.toString(),
      requires_document: ticket.requires_document,
      document_types: ticket.document_types || []
    })
    setIsCreateMode(false)
    setIsDialogOpen(true)
  }

  // Gérer les changements du formulaire
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Gérer les types de documents
  const handleDocumentTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      document_types: prev.document_types.includes(type)
        ? prev.document_types.filter(t => t !== type)
        : [...prev.document_types, type]
    }))
  }

  // Sauvegarder le ticket
  const handleSave = async () => {
    if (!formData.name || !formData.event_id) {
      setMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const method = isCreateMode ? 'POST' : 'PUT'
      const url = isCreateMode ? '/api/admin/tickets' : `/api/admin/tickets/${selectedTicket?.id}`
      
      const dataToSend = {
        ...formData,
        price: Math.round(parseFloat(formData.price) * 100), // Convertir en centimes
        max_participants: parseInt(formData.max_participants) || 0,
        race_id: formData.race_id === 'none' || formData.race_id === '' ? null : formData.race_id,
        document_types: formData.requires_document ? formData.document_types : []
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur de sauvegarde')
      }

      const result = await response.json()
      
      if (isCreateMode) {
        setTickets(prev => [result.ticket, ...prev])
        setMessage({ type: 'success', text: 'Ticket créé avec succès' })
      } else {
        setTickets(prev => prev.map(t => t.id === selectedTicket?.id ? result.ticket : t))
        setMessage({ type: 'success', text: 'Ticket mis à jour avec succès' })
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

  // Supprimer un ticket
  const handleDelete = async (ticket: TicketType) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${ticket.name}" ?`)) {
      return
    }

    setDeleteLoading(ticket.id)
    try {
      const response = await fetch(`/api/admin/tickets/${ticket.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      setTickets(prev => prev.filter(t => t.id !== ticket.id))
      setMessage({ type: 'success', text: 'Ticket supprimé avec succès' })

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la suppression' })
    } finally {
      setDeleteLoading(null)
    }
  }

  const formatPrice = (priceInCents: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(priceInCents / 100)
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return 'bg-green-100 text-green-800'
    if (difficulty <= 6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
        <p className="text-muted-foreground">Chargement des tickets...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton créer */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des tickets</h2>
          <p className="text-muted-foreground">
            Créer et gérer les types de billets pour vos événements
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau ticket
        </Button>
      </div>

      {/* Filtres - SECTION AJOUTÉE */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            {/* Recherche */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un ticket, événement ou course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtre par événement */}
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les événements</SelectItem>
                {events.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title} - {new Date(event.date).toLocaleDateString('fr-FR')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Compteur de résultats */}
          {(searchTerm || eventFilter !== 'all') && (
            <div className="mt-3 text-sm text-muted-foreground">
              {filteredTickets.length} ticket(s) trouvé(s) sur {tickets.length}
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Liste des tickets */}
      <div className="grid gap-4">
        {filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Ticket className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {tickets.length === 0 ? 'Aucun ticket' : 'Aucun résultat'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {tickets.length === 0 
                  ? 'Commencez par créer votre premier type de ticket'
                  : 'Aucun ticket ne correspond à vos critères de recherche'
                }
              </p>
              {tickets.length === 0 && (
                <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un ticket
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold truncate">{ticket.name}</h3>
                      <Badge variant="outline">
                        {formatPrice(ticket.base_price_cents, ticket.currency)}
                      </Badge>
                      {ticket.requires_document && (
                        <Badge variant="secondary">
                          <FileText className="h-3 w-3 mr-1" />
                          Document requis
                        </Badge>
                      )}
                    </div>
                    
                    {ticket.description && (
                      <p className="text-sm text-muted-foreground mb-3">{ticket.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>Max: {ticket.max_participants || 'Illimité'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Événement:</span>
                        <span className="truncate">{ticket.event?.title}</span>
                      </div>
                      
                      {ticket.race && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Course:</span>
                          <span className="truncate">{ticket.race.name}</span>
                          <Badge 
                            variant="outline" 
                            className={getDifficultyColor(ticket.race.difficulty)}
                          >
                            Diff. {ticket.race.difficulty}/10
                          </Badge>
                        </div>
                      )}
                    </div>

                    {ticket.document_types && ticket.document_types.length > 0 && (
                      <div className="mt-3">
                        <span className="text-sm text-muted-foreground">Documents acceptés: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ticket.document_types.map(type => {
                            const docType = DOCUMENT_TYPES.find(dt => dt.value === type)
                            return (
                              <Badge key={type} variant="outline" className="text-xs">
                                {docType?.label || type}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(ticket)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(ticket)}
                      disabled={deleteLoading === ticket.id}
                    >
                      {deleteLoading === ticket.id ? (
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
              {isCreateMode ? 'Créer un ticket' : 'Modifier le ticket'}
            </DialogTitle>
            <DialogDescription>
              {isCreateMode 
                ? 'Créez un nouveau type de billet pour un événement'
                : 'Modifiez les informations de ce ticket'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Événement */}
            <div className="space-y-2">
              <Label htmlFor="event_id">Événement *</Label>
              <Select 
                value={formData.event_id} 
                onValueChange={(value: string) => handleFormChange('event_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un événement" />
                </SelectTrigger>
                <SelectContent>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title} - {new Date(event.date).toLocaleDateString('fr-FR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Course (optionnel) */}
            <div className="space-y-2">
              <Label htmlFor="race_id">Course (optionnel)</Label>
              <Select 
                value={formData.race_id} 
                onValueChange={(value: string) => handleFormChange('race_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucune course spécifique" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune course</SelectItem>
                  {races.map(race => (
                    <SelectItem key={race.id} value={race.id}>
                      {race.name} - {race.distance_km}km (Diff. {race.difficulty}/10)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="name">Nom du ticket *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="Ex: Billet Standard, VIP, Étudiant..."
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Description du ticket, ce qui est inclus..."
                rows={3}
              />
            </div>

            {/* Prix et devise */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Prix *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleFormChange('price', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value: string) => handleFormChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Participants maximum */}
            <div className="space-y-2">
              <Label htmlFor="max_participants">Nombre maximum de participants</Label>
              <Input
                id="max_participants"
                type="number"
                min="0"
                value={formData.max_participants}
                onChange={(e) => handleFormChange('max_participants', e.target.value)}
                placeholder="0 = illimité"
              />
              <p className="text-xs text-muted-foreground">
                Laissez 0 pour un nombre illimité de participants
              </p>
            </div>

            {/* Documents requis */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="requires_document"
                  checked={formData.requires_document}
                  onCheckedChange={(checked) => handleFormChange('requires_document', checked)}
                />
                <Label htmlFor="requires_document">Requiert un document justificatif</Label>
              </div>

              {formData.requires_document && (
                <div className="space-y-2 pl-6 border-l-2 border-muted">
                  <Label>Types de documents acceptés</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {DOCUMENT_TYPES.map(docType => (
                      <div key={docType.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={docType.value}
                          checked={formData.document_types.includes(docType.value)}
                          onChange={() => handleDocumentTypeToggle(docType.value)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={docType.value} className="text-sm">
                          {docType.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {formData.document_types.length === 0 && (
                    <p className="text-xs text-orange-600">
                      Veuillez sélectionner au moins un type de document
                    </p>
                  )}
                </div>
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
            <Button 
              onClick={handleSave} 
              disabled={saving || (formData.requires_document && formData.document_types.length === 0)}
            >
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
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
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
  Users, 
  Search, 
  Filter,
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  Download,
  Eye,
  AlertTriangle,
  Calendar,
  MapPin,
  Ticket,
  DollarSign
} from 'lucide-react'

interface Registration {
  id: string
  email: string
  checked_in: boolean
  approval_status: 'pending' | 'approved' | 'rejected'
  document_url?: string
  document_filename?: string
  document_size?: number
  rejection_reason?: string
  created_at: string
  approved_at?: string
  event: {
    id: string
    title: string
    date: string
    location: string
  }
  ticket: {
    id: string
    name: string
    distance_km?: number
  }
  order: {
    id: string
    amount_total: number
    currency: string
    status: string
  }
  approved_by_profile?: {
    id: string
    full_name: string
  }
}

interface MembersManagementProps {
  eventId?: string
}

export function AdminMembersManagement({ eventId }: MembersManagementProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    checked_in: 0
  })

  // Charger les inscriptions
  const loadRegistrations = async () => {
    try {
      const params = new URLSearchParams()
      if (eventId) params.append('event_id', eventId)
      if (statusFilter !== 'all') params.append('approval_filter', statusFilter)
      if (searchTerm) params.append('search_term', searchTerm)

      const response = await fetch(`/api/admin/registrations?${params}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement')
      }

      const data = await response.json()
      setRegistrations(data.registrations)
      setFilteredRegistrations(data.registrations)
      
      // Calculer les stats
      const total = data.registrations.length
      const approved = data.registrations.filter((r: Registration) => r.approval_status === 'approved').length
      const pending = data.registrations.filter((r: Registration) => r.approval_status === 'pending').length
      const rejected = data.registrations.filter((r: Registration) => r.approval_status === 'rejected').length
      const checked_in = data.registrations.filter((r: Registration) => r.checked_in).length
      
      setStats({ total, approved, pending, rejected, checked_in })
      
    } catch (error) {
      console.error('Erreur:', error)
      setMessage({ type: 'error', text: 'Impossible de charger les inscriptions' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRegistrations()
  }, [eventId, statusFilter, searchTerm])

  // Approuver une inscription
  const handleApproval = async (registrationId: string, status: 'approved' | 'rejected', reason?: string) => {
    setActionLoading(registrationId)
    
    try {
      const response = await fetch('/api/admin/registrations/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: registrationId,
          status,
          reason
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      const result = await response.json()
      
      // Mettre à jour localement
      setRegistrations(prev => 
        prev.map(r => 
          r.id === registrationId 
            ? { ...r, approval_status: status, rejection_reason: reason, approved_at: new Date().toISOString() }
            : r
        )
      )

      setMessage({ 
        type: 'success', 
        text: `Inscription ${status === 'approved' ? 'approuvée' : 'rejetée'} avec succès` 
      })
      
      setIsApprovalDialogOpen(false)
      setSelectedRegistration(null)
      setRejectionReason('')
      
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du statut' })
    } finally {
      setActionLoading(null)
    }
  }

  // Ouvrir le document
  const handleViewDocument = (registration: Registration) => {
    setSelectedRegistration(registration)
    setIsDocumentDialogOpen(true)
  }

  // Ouvrir le dialogue d'approbation
  const handleOpenApprovalDialog = (registration: Registration) => {
    setSelectedRegistration(registration)
    setIsApprovalDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default'
      case 'pending': return 'secondary'
      case 'rejected': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Approuvé'
      case 'pending': return 'En attente'
      case 'rejected': return 'Rejeté'
      default: return status
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
        <p className="text-muted-foreground">Chargement des inscriptions...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Gestion des membres</h2>
        <p className="text-muted-foreground">
          Consulter les inscriptions et approuver les documents
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Approuvés</p>
                <p className="text-xl font-bold text-green-600">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-xl font-bold text-orange-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Rejetés</p>
                <p className="text-xl font-bold text-red-600">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Présents</p>
                <p className="text-xl font-bold text-blue-600">{stats.checked_in}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher par email, événement..."
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvés</SelectItem>
                <SelectItem value="rejected">Rejetés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
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

      {/* Liste des inscriptions */}
      <div className="space-y-4">
        {registrations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune inscription</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucun résultat pour ces filtres' 
                  : 'Aucune inscription trouvée'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          registrations.map((registration) => (
            <Card key={registration.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold truncate">{registration.email}</h3>
                      <Badge variant={getStatusColor(registration.approval_status)}>
                        {getStatusLabel(registration.approval_status)}
                      </Badge>
                      {registration.checked_in && (
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          Présent
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{registration.event.title}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                        <span>{registration.ticket.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {(registration.order.amount_total / 100).toFixed(2)} {registration.order.currency.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {new Date(registration.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>

                    {/* Document */}
                    {registration.document_url && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <FileText className="h-4 w-4" />
                        <span>{registration.document_filename}</span>
                        <span>({formatFileSize(registration.document_size)})</span>
                      </div>
                    )}

                    {/* Raison de rejet */}
                    {registration.approval_status === 'rejected' && registration.rejection_reason && (
                      <Alert variant="destructive" className="mt-3">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Raison du rejet :</strong> {registration.rejection_reason}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Informations d'approbation */}
                    {registration.approved_at && registration.approved_by_profile && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {registration.approval_status === 'approved' ? 'Approuvé' : 'Rejeté'} par {registration.approved_by_profile.full_name} le {' '}
                        {new Date(registration.approved_at).toLocaleString('fr-FR')}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {registration.document_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocument(registration)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}

                    {registration.approval_status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenApprovalDialog(registration)}
                        disabled={actionLoading === registration.id}
                      >
                        {actionLoading === registration.id ? (
                          <Clock className="h-4 w-4 animate-spin" />
                        ) : (
                          <Filter className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog pour voir le document */}
      <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Document de {selectedRegistration?.email}</DialogTitle>
            <DialogDescription>
              {selectedRegistration?.document_filename} - {formatFileSize(selectedRegistration?.document_size)}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {selectedRegistration?.document_url && (
              <iframe
                src={selectedRegistration.document_url}
                className="w-full h-[600px] border rounded"
                title="Document de l'inscription"
              />
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDocumentDialogOpen(false)}
            >
              Fermer
            </Button>
            {selectedRegistration?.document_url && (
              <Button asChild>
                <a 
                  href={selectedRegistration.document_url} 
                  download={selectedRegistration.document_filename}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour approuver/rejeter */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approuver l'inscription</DialogTitle>
            <DialogDescription>
              Décidez du statut de l'inscription de {selectedRegistration?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm">
              <p><strong>Email :</strong> {selectedRegistration?.email}</p>
              <p><strong>Événement :</strong> {selectedRegistration?.event.title}</p>
              <p><strong>Ticket :</strong> {selectedRegistration?.ticket.name}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Raison du rejet (optionnelle)</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Expliquez pourquoi cette inscription est rejetée..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApprovalDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRegistration && handleApproval(selectedRegistration.id, 'rejected', rejectionReason)}
              disabled={actionLoading === selectedRegistration?.id}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rejeter
            </Button>
            <Button
              onClick={() => selectedRegistration && handleApproval(selectedRegistration.id, 'approved')}
              disabled={actionLoading === selectedRegistration?.id}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approuver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ScanIcon, 
  QrCode, 
  UserCheck, 
  Users, 
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

interface Registration {
  id: string
  email: string
  checked_in: boolean
  qr_code_token: string
  created_at: string
  tickets: {
    name: string
    events: {
      title: string
      date: string
      location: string
    }[]
  }[]
}

interface Stats {
  total: number
  checkedIn: number
  pending: number
}

export function VolunteerCheckin() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [scanToken, setScanToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [scanLoading, setScanLoading] = useState(false)
  const [refreshLoading, setRefreshLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [stats, setStats] = useState<Stats>({
    total: 0,
    checkedIn: 0,
    pending: 0
  })

  // Charger les inscriptions
  const loadRegistrations = async () => {
    try {
      const response = await fetch('/api/checkin')
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement')
      }

      const data = await response.json()
      
      setRegistrations(data.registrations)
      setFilteredRegistrations(data.registrations)
      setStats(data.stats)
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      setMessage({ 
        type: 'error', 
        text: 'Impossible de charger les inscriptions' 
      })
    } finally {
      setLoading(false)
      setRefreshLoading(false)
    }
  }

  // Charger au montage du composant
  useEffect(() => {
    loadRegistrations()
  }, [])

  // Actualiser les données
  const handleRefresh = () => {
    setRefreshLoading(true)
    loadRegistrations()
  }

  // Filtrer les inscriptions selon le terme de recherche
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRegistrations(registrations)
    } else {
      const filtered = registrations.filter(reg =>
        reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.tickets[0]?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.tickets[0]?.events[0]?.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredRegistrations(filtered)
    }
  }, [searchTerm, registrations])

  // Scanner un QR code
  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!scanToken.trim()) {
      setMessage({ type: 'error', text: 'Veuillez saisir ou scanner un token QR' })
      return
    }

    setScanLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: scanToken.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Erreur lors du check-in' })
        setScanLoading(false)
        return
      }

      // Mettre à jour l'état local
      const updatedRegistrations = registrations.map(r =>
        r.id === data.registration.id ? { ...r, checked_in: true } : r
      )
      
      setRegistrations(updatedRegistrations)
      setFilteredRegistrations(prev => 
        prev.map(r => r.id === data.registration.id ? { ...r, checked_in: true } : r)
      )
      
      // Mettre à jour les stats
      setStats(prev => ({
        ...prev,
        checkedIn: prev.checkedIn + 1,
        pending: prev.pending - 1
      }))

      setMessage({ type: 'success', text: data.message })
      setScanToken('')
      
    } catch (error) {
      console.error('Erreur scan:', error)
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' })
    } finally {
      setScanLoading(false)
    }
  }

  // Check-in manuel (utilise la même API)
  const handleManualCheckin = async (registration: Registration) => {
    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: registration.qr_code_token
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Erreur lors du check-in manuel' })
        return
      }

      // Mettre à jour l'état local
      const updatedRegistrations = registrations.map(r =>
        r.id === registration.id ? { ...r, checked_in: true } : r
      )
      
      setRegistrations(updatedRegistrations)
      setFilteredRegistrations(prev => 
        prev.map(r => r.id === registration.id ? { ...r, checked_in: true } : r)
      )
      
      setStats(prev => ({
        ...prev,
        checkedIn: prev.checkedIn + 1,
        pending: prev.pending - 1
      }))

      setMessage({ type: 'success', text: data.message })
      
    } catch (error) {
      console.error('Erreur check-in manuel:', error)
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement manuel' })
    }
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
    <div className="space-y-8">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total inscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Présents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.checkedIn}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Scanner QR */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanIcon className="h-5 w-5" />
            Scanner QR Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleScan} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  value={scanToken}
                  onChange={(e) => setScanToken(e.target.value)}
                  placeholder="Scanner ou saisir le token QR..."
                  disabled={scanLoading}
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={scanLoading || !scanToken.trim()}>
                {scanLoading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Valider
                  </>
                )}
              </Button>
            </div>

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
          </form>
        </CardContent>
      </Card>

      {/* Liste des inscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Liste des inscrits
            </span>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={refreshLoading}
            >
              {refreshLoading ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par email, ticket ou événement..."
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredRegistrations.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'Aucun résultat trouvé' : 'Aucune inscription trouvée'}
                </p>
              </div>
            ) : (
              filteredRegistrations.map((registration) => {
                const event = registration.tickets[0]?.events[0]
                const ticket = registration.tickets[0]

                return (
                  <div
                    key={registration.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      registration.checked_in ? 'bg-green-50 border-green-200' : 'bg-card'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        registration.checked_in ? 'bg-green-100' : 'bg-muted'
                      }`}>
                        {registration.checked_in ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{registration.email}</p>
                          <Badge variant={registration.checked_in ? 'default' : 'secondary'}>
                            {registration.checked_in ? 'Présent' : 'En attente'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {ticket?.name} • {event?.title}
                        </p>
                        
                        {event?.location && (
                          <p className="text-xs text-muted-foreground">{event.location}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!registration.checked_in && (
                        <Button
                          onClick={() => handleManualCheckin(registration)}
                          variant="outline"
                          size="sm"
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Check-in
                        </Button>
                      )}
                      
                      {registration.checked_in && (
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Validé
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Informations sur les résultats */}
          {filteredRegistrations.length > 0 && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {filteredRegistrations.length} inscription{filteredRegistrations.length > 1 ? 's' : ''} 
              {searchTerm && ` trouvée${filteredRegistrations.length > 1 ? 's' : ''} pour "${searchTerm}"`}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
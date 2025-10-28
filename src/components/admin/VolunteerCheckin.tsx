'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  RefreshCw,
  XIcon
} from 'lucide-react'
import { BrowserMultiFormatReader } from '@zxing/browser'

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
  const [scannerOpen, setScannerOpen] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const cameraControlsRef = useRef<{ stop: () => void } | null>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const stopCamera = useCallback(() => {
    cameraControlsRef.current?.stop?.()
    cameraControlsRef.current = null
    ;(codeReaderRef.current as any)?.reset?.()
    codeReaderRef.current = null
  }, [])
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

  const submitScan = useCallback(
    async (token: string) => {
      const trimmed = token.trim()

      if (!trimmed) {
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
            token: trimmed,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          setMessage({ type: 'error', text: data.error || 'Erreur lors du check-in' })
          return
        }

        const alreadyChecked =
          registrations.find((r) => r.id === data.registration.id)?.checked_in ?? false

        setRegistrations((prev) =>
          prev.map((r) => (r.id === data.registration.id ? { ...r, checked_in: true } : r)),
        )
        setFilteredRegistrations((prev) =>
          prev.map((r) => (r.id === data.registration.id ? { ...r, checked_in: true } : r)),
        )
        setStats((prev) =>
          alreadyChecked
            ? prev
            : {
                ...prev,
                checkedIn: prev.checkedIn + 1,
                pending: prev.pending > 0 ? prev.pending - 1 : 0,
              },
        )

        setMessage({ type: 'success', text: data.message })
        setScanToken('')
      } catch (error) {
        console.error('Erreur scan:', error)
        setMessage({ type: 'error', text: "Erreur lors de l'enregistrement" })
      } finally {
        setScanLoading(false)
      }
    },
    [registrations],
  )

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitScan(scanToken)
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
      
      setStats(prev => (
        registration.checked_in
          ? prev
          : {
              ...prev,
              checkedIn: prev.checkedIn + 1,
              pending: prev.pending > 0 ? prev.pending - 1 : 0,
            }
      ))

      setMessage({ type: 'success', text: data.message })
      
    } catch (error) {
      console.error('Erreur check-in manuel:', error)
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement manuel' })
    }
  }

  const startCamera = useCallback(async () => {
    if (!videoRef.current) {
      return
    }

    setCameraError(null)

    const codeReader = new BrowserMultiFormatReader()
    codeReaderRef.current = codeReader

    try {
      const controls = await codeReader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, error, ctrl) => {
          if (result) {
            const text = result.getText()
            ctrl?.stop?.()
            cameraControlsRef.current = null
            ;(codeReaderRef.current as any)?.reset?.()
            setScannerOpen(false)
            void submitScan(text)
          }
        }
      )

      if (controls && typeof (controls as { stop?: () => void }).stop === 'function') {
        cameraControlsRef.current = controls as unknown as { stop: () => void }
      } else {
        cameraControlsRef.current = null
      }
    } catch (error) {
      console.error('Erreur caméra:', error)
      setCameraError("Impossible d'accéder à la caméra. Vérifiez les permissions.")
      stopCamera()
    }
  }, [stopCamera, submitScan])

  useEffect(() => {
    if (scannerOpen) {
      void startCamera()
    } else {
      stopCamera()
      setCameraError(null)
    }

    return () => {
      stopCamera()
    }
  }, [scannerOpen, startCamera, stopCamera])

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
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <Input
                  value={scanToken}
                  onChange={(e) => setScanToken(e.target.value)}
                  placeholder="Scanner ou saisir le token QR..."
                  disabled={scanLoading}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCameraError(null)
                    setScannerOpen(true)
                  }}
                  disabled={scanLoading}
                  className="flex items-center gap-2"
                >
                  <ScanIcon className="h-4 w-4" />
                  Scanner
                </Button>
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

      {scannerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-6 backdrop-blur">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <ScanIcon className="h-5 w-5" />
                Scanner un QR code
              </div>
              <Button variant="ghost" size="icon" onClick={() => setScannerOpen(false)}>
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-black">
              <video
                ref={videoRef}
                className="aspect-[4/3] w-full bg-black"
                autoPlay
                muted
                playsInline
              />
            </div>
            {cameraError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{cameraError}</AlertDescription>
              </Alert>
            ) : (
              <p className="text-xs text-muted-foreground">
                Placez le QR code dans le cadre. Le check-in se déclenche automatiquement dès que le code est détecté.
              </p>
            )}
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setScannerOpen(false)}>
                Fermer
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  stopCamera()
                  void startCamera()
                }}
              >
                Relancer
              </Button>
            </div>
          </div>
        </div>
      ) : null}

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
                    className={`overflow-hidden rounded-lg border transition ${
                      registration.checked_in
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                            registration.checked_in
                              ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-100'
                              : 'border-muted bg-muted text-muted-foreground'
                          }`}
                        >
                          {registration.checked_in ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <Clock className="h-5 w-5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="mb-1 flex items-center gap-2">
                            <p className="truncate font-medium">{registration.email}</p>
                            <Badge
                              variant={registration.checked_in ? 'default' : 'secondary'}
                              className={registration.checked_in ? 'border-none bg-emerald-500/20 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-100' : ''}
                            >
                              {registration.checked_in ? 'Présent' : 'En attente'}
                            </Badge>
                          </div>
                          <p className="truncate text-sm text-muted-foreground">
                            {ticket?.name || 'Ticket non défini'}
                            {event ? ` • ${event.title}` : ''}
                          </p>
                          {event?.location ? (
                            <p className="text-xs text-muted-foreground">{event.location}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {registration.checked_in ? (
                          <Badge variant="outline" className="border-emerald-400 text-emerald-700 dark:border-emerald-300 dark:text-emerald-100">
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Validé
                          </Badge>
                        ) : null}
                        {!registration.checked_in ? (
                          <Button
                            onClick={() => handleManualCheckin(registration)}
                            variant="outline"
                            size="sm"
                          >
                            <UserCheck className="mr-1 h-4 w-4" />
                            Check-in
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {registration.checked_in ? (
                      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500/30 via-emerald-500/10 to-transparent" />
                    ) : null}
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

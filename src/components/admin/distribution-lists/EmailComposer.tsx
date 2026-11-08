'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAdminEvents } from '@/app/api/admin/events/eventsQueries'
import {
  AUDIENCE_SEGMENTS,
  EVENT_SCOPED_SEGMENTS,
  SEGMENT_LABELS,
  type AudienceSegment,
} from '@/lib/email/segments'
import {
  Mail,
  Send,
  Eye,
  TestTube,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Users
} from 'lucide-react'
import type { DistributionListWithStats } from '@/types/DistributionList'

interface EmailComposerProps {
  lists: DistributionListWithStats[]
  onClose?: () => void
}

interface EmailFormData {
  subject: string
  preheader: string
  bodyHtml: string
  bodyText: string
  listIds: string[]
  segment: AudienceSegment
  /** Empty means every event. */
  eventId: string
}

const ALL_EVENTS = 'all-events'

type SendStatus = 'idle' | 'loading' | 'success' | 'error'

export function EmailComposer({ lists, onClose }: EmailComposerProps) {
  const [formData, setFormData] = useState<EmailFormData>({
    subject: '',
    preheader: '',
    bodyHtml: '',
    bodyText: '',
    listIds: [],
    segment: 'all',
    eventId: '',
  })
  const { data: events = [] } = useAdminEvents()
  const [audienceCount, setAudienceCount] = useState<number | null>(null)
  const [audienceLoading, setAudienceLoading] = useState(false)

  const [sendStatus, setSendStatus] = useState<SendStatus>('idle')
  const [testSendStatus, setTestSendStatus] = useState<SendStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')

  const handleListToggle = (listId: string) => {
    setFormData((prev) => ({
      ...prev,
      listIds: prev.listIds.includes(listId)
        ? prev.listIds.filter((id) => id !== listId)
        : [...prev.listIds, listId],
    }))
  }

  const selectedLists = lists.filter((list) => formData.listIds.includes(list.id))
  const scopedToEvent = EVENT_SCOPED_SEGMENTS.includes(formData.segment)
  const audienceEventId = scopedToEvent ? formData.eventId : ''

  // The real count: same rules as the send (traced consent, segment, digest, suppressions).
  useEffect(() => {
    if (formData.listIds.length === 0) {
      setAudienceCount(null)
      return
    }
    const controller = new AbortController()
    setAudienceLoading(true)
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/admin/distribution-lists/audience', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            listIds: formData.listIds,
            segment: formData.segment,
            ...(audienceEventId ? { eventId: audienceEventId } : {}),
          }),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Audience illisible')
        setAudienceCount(result.count as number)
        setAudienceLoading(false)
      } catch (error) {
        if (controller.signal.aborted) return
        setAudienceCount(null)
        setAudienceLoading(false)
      }
    }, 300)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [formData.listIds, formData.segment, audienceEventId])

  const totalRecipients = audienceCount ?? 0

  const requestBody = () => ({
    subject: formData.subject,
    preheader: formData.preheader,
    bodyHtml: formData.bodyHtml,
    bodyText: formData.bodyText,
    listIds: formData.listIds,
    segment: formData.segment,
    ...(audienceEventId ? { eventId: audienceEventId } : {}),
  })

  const handleTestSend = async () => {
    if (!formData.subject || !formData.bodyHtml) {
      setErrorMessage('Le sujet et le contenu HTML sont requis')
      return
    }

    setTestSendStatus('loading')
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch('/api/admin/distribution-lists/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...requestBody(),
          testMode: true,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Échec de l\'envoi de test')
      }

      setTestSendStatus('success')
      setSuccessMessage('Email de test envoyé avec succès à votre adresse')

      setTimeout(() => {
        setTestSendStatus('idle')
        setSuccessMessage('')
      }, 3000)
    } catch (error) {
      setTestSendStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Erreur inconnue')
    }
  }

  const handleSend = async () => {
    if (!formData.subject || !formData.bodyHtml) {
      setErrorMessage('Le sujet et le contenu HTML sont requis')
      return
    }

    if (formData.listIds.length === 0) {
      setErrorMessage('Sélectionnez au moins une liste de distribution')
      return
    }

    setSendStatus('loading')
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch('/api/admin/distribution-lists/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...requestBody(),
          testMode: false,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Échec de l\'envoi')
      }

      setSendStatus('success')
      if (result.remaining > 0 || result.failed > 0) {
        // Partial send: keep the form so the same campaign can be run again to continue.
        setSuccessMessage(
          `Envoi partiel : ${result.sent} envoyés, ${result.failed} échecs, ${result.remaining} restants. Relance l'envoi pour continuer.`,
        )
        return
      }
      setSuccessMessage(
        `Email envoyé avec succès : ${result.sent} destinataires (${result.alreadyDone} déjà servis)`,
      )

      // Reset form after successful send
      setTimeout(() => {
        setFormData({
          subject: '',
          preheader: '',
          bodyHtml: '',
          bodyText: '',
          listIds: [],
          segment: 'all',
          eventId: '',
        })
        setSendStatus('idle')
        setSuccessMessage('')
        onClose?.()
      }, 3000)
    } catch (error) {
      setSendStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Erreur inconnue')
    }
  }

  const activeLists = lists.filter((list) => list.active)

  return (
    <div className="space-y-6">
      <Card variant="info">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Composer un email marketing
          </CardTitle>
          <CardDescription>
            Créez et envoyez un email à vos listes de distribution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Audience */}
          <div className="space-y-4">
            <p className="text-label font-semibold uppercase text-subtle">1. Audience</p>

            <div className="space-y-3">
              <Label>Listes de distribution *</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {activeLists.map((list) => (
                  <label
                    key={list.id}
                    className={`flex items-start space-x-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                      formData.listIds.includes(list.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.listIds.includes(list.id)}
                      onChange={() => handleListToggle(list.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{list.name}</p>
                        <Badge variant="secondary" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          {list.subscriber_count || 0}
                        </Badge>
                      </div>
                      {list.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {list.description}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Le nombre sur chaque liste compte aussi les abonnements non confirmés, qui ne reçoivent rien.
                Le total réel est affiché plus bas.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="segment">Public</Label>
                <Select
                  value={formData.segment}
                  onValueChange={(value) => setFormData({ ...formData, segment: value as AudienceSegment })}
                >
                  <SelectTrigger id="segment" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_SEGMENTS.map((segment) => (
                      <SelectItem key={segment} value={segment}>
                        {SEGMENT_LABELS[segment]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {scopedToEvent && (
                <div className="space-y-2">
                  <Label htmlFor="segment-event">Événement</Label>
                  <Select
                    value={formData.eventId || ALL_EVENTS}
                    onValueChange={(value) => setFormData({ ...formData, eventId: value === ALL_EVENTS ? '' : value })}
                  >
                    <SelectTrigger id="segment-event" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_EVENTS}>Tous les événements</SelectItem>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {formData.listIds.length > 0 && (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  {audienceLoading || audienceCount === null
                    ? 'Calcul de l\'audience...'
                    : `${audienceCount} destinataire${audienceCount > 1 ? 's' : ''} recevront cet email (${selectedLists.length} liste${selectedLists.length > 1 ? 's' : ''}, adresses uniques, consentement confirmé).`}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <p className="text-label font-semibold uppercase text-subtle">2. Contenu</p>

          {/* Email Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Sujet de l'email *</Label>
              <Input
                id="subject"
                placeholder="Nouvel événement : Trail des Montagnes 2026"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preheader">Pré-header (texte d'aperçu)</Label>
              <Input
                id="preheader"
                placeholder="Inscrivez-vous dès maintenant et profitez des tarifs early bird"
                value={formData.preheader}
                onChange={(e) => setFormData({ ...formData, preheader: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Le texte qui apparaît après le sujet dans la boîte de réception
              </p>
            </div>

            <Tabs defaultValue="html" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="html">HTML</TabsTrigger>
                <TabsTrigger value="text">Texte brut</TabsTrigger>
              </TabsList>

              <TabsContent value="html" className="space-y-2">
                <Label htmlFor="bodyHtml">Contenu HTML *</Label>
                <Textarea
                  id="bodyHtml"
                  placeholder="<h1>Nouvel événement !</h1><p>Nous sommes ravis de vous annoncer...</p>"
                  value={formData.bodyHtml}
                  onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })}
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Contenu HTML de l'email. Utilisez des templates HTML valides.
                </p>
              </TabsContent>

              <TabsContent value="text" className="space-y-2">
                <Label htmlFor="bodyText">Contenu texte (fallback)</Label>
                <Textarea
                  id="bodyText"
                  placeholder="Nouvel événement !\n\nNous sommes ravis de vous annoncer..."
                  value={formData.bodyText}
                  onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
                  rows={12}
                />
                <p className="text-xs text-muted-foreground">
                  Version texte brut pour les clients email qui n'affichent pas le HTML
                </p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Status Messages */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleTestSend}
                disabled={testSendStatus === 'loading' || sendStatus === 'loading'}
              >
                {testSendStatus === 'loading' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4 mr-2" />
                )}
                Envoyer un test
              </Button>
            </div>

            <div className="flex gap-2">
              {onClose && (
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={sendStatus === 'loading'}
                >
                  Annuler
                </Button>
              )}
              <Button
                onClick={handleSend}
                disabled={
                  sendStatus === 'loading' ||
                  testSendStatus === 'loading' ||
                  audienceLoading ||
                  audienceCount === null ||
                  audienceCount === 0
                }
              >
                {sendStatus === 'loading' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Envoyer à {totalRecipients} destinataire{totalRecipients > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

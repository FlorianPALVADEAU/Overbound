'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
}

type SendStatus = 'idle' | 'loading' | 'success' | 'error'

export function EmailComposer({ lists, onClose }: EmailComposerProps) {
  const [formData, setFormData] = useState<EmailFormData>({
    subject: '',
    preheader: '',
    bodyHtml: '',
    bodyText: '',
    listIds: [],
  })

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
  const totalRecipients = selectedLists.reduce((sum, list) => sum + (list.subscriber_count || 0), 0)

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
          ...formData,
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
          ...formData,
          testMode: false,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Échec de l\'envoi')
      }

      setSendStatus('success')
      setSuccessMessage(`Email envoyé avec succès à ${totalRecipients} destinataires`)

      // Reset form after successful send
      setTimeout(() => {
        setFormData({
          subject: '',
          preheader: '',
          bodyHtml: '',
          bodyText: '',
          listIds: [],
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
      <Card>
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
          {/* Email Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Sujet de l'email *</Label>
              <Input
                id="subject"
                placeholder="Nouvel événement : Trail des Montagnes 2025"
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

          {/* Distribution Lists Selection */}
          <div className="space-y-3">
            <Label>Listes de distribution *</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {activeLists.map((list) => (
                <div
                  key={list.id}
                  className={`flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    formData.listIds.includes(list.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleListToggle(list.id)}
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
                </div>
              ))}
            </div>

            {formData.listIds.length > 0 && (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  {totalRecipients} destinataire{totalRecipients > 1 ? 's' : ''} sélectionné{totalRecipients > 1 ? 's' : ''}
                  ({selectedLists.length} liste{selectedLists.length > 1 ? 's' : ''})
                </AlertDescription>
              </Alert>
            )}
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
                disabled={sendStatus === 'loading' || testSendStatus === 'loading'}
              >
                {sendStatus === 'loading' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Envoyer à {totalRecipients} destinataires
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

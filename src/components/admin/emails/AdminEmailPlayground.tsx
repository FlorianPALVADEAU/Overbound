'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface EmailItem {
  type: string
  label: string
  description: string
  tone?: 'marketing' | 'transactional' | 'admin' | 'volunteer'
}

const EMAIL_GROUPS: Array<{
  title: string
  description: string
  items: EmailItem[]
}> = [
  {
    title: 'Cycle de vie & transactionnel',
    description: 'Emails envoyés pendant la vie du compte utilisateur (onboarding, documents, événements…).',
    items: [
      { type: 'onboarding', label: 'Onboarding', description: 'Bienvenue sur OverBound.' },
      { type: 'profile_nudge', label: 'Profil incomplet', description: 'Rappel pour compléter les informations.' },
      { type: 'event_prep', label: 'Préparation événement', description: 'Checklist pré-course à J-7.' },
      { type: 'post_event', label: 'Merci post-événement', description: 'Remerciements + feedback après la course.' },
      { type: 'document_required', label: 'Document requis', description: 'Demande de dépôt de document manquant.' },
      { type: 'document_approved', label: 'Document validé', description: 'Confirmation de validation.' },
      { type: 'document_rejected', label: 'Document rejeté', description: 'Document refusé avec instructions.' },
      { type: 'ticket_confirmation', label: 'Confirmation billet', description: 'Envoi du QR code billet.' },
      { type: 'event_update', label: 'Mise à jour événement', description: 'Changement de date/lieu.' },
    ],
  },
  {
    title: 'Marketing & activation',
    description: 'Emails envoyés pour animer la communauté et booster les conversions.',
    items: [
      { type: 'marketing_new_event', label: 'Annonce nouvel événement', description: 'Annonce d’un événement ouvrant ses inscriptions.', tone: 'marketing' },
      { type: 'marketing_price_change', label: 'Rappel changement de prix', description: 'Dernier rappel avant hausse tarifaire.', tone: 'marketing' },
      { type: 'marketing_promo', label: 'Campagne promo', description: 'Mise en avant d’une offre spéciale.', tone: 'marketing' },
      { type: 'reactivation_inactive', label: 'Réactivation inactifs', description: 'Relance d’un utilisateur inactif.', tone: 'marketing' },
      { type: 'reactivation_abandoned_checkout', label: 'Checkout abandonné', description: 'Rappel panier abandonné.', tone: 'marketing' },
    ],
  },
  {
    title: 'Volontaires & organisation',
    description: 'Scénarios liés à la mobilisation et au briefing des bénévoles.',
    items: [
      { type: 'volunteer_recruitment', label: 'Recrutement bénévoles', description: 'Digest des missions à venir.', tone: 'volunteer' },
      { type: 'volunteer_assignment', label: 'Affectation bénévole', description: 'Briefing individuel sur une mission.', tone: 'volunteer' },
    ],
  },
  {
    title: 'Pilotage admin',
    description: 'Emails destinés aux équipes internes pour le monitoring.',
    items: [
      { type: 'admin_digest', label: 'Digest admin', description: 'Résumé des actions/récentes erreurs.', tone: 'admin' },
    ],
  },
]

type TriggerStatus = 'idle' | 'loading' | 'success' | 'error'

export function AdminEmailPlayground() {
  const [statusMap, setStatusMap] = useState<Record<string, { state: TriggerStatus; message?: string }>>({})

  const triggerEmail = async (type: string) => {
    setStatusMap((prev) => ({ ...prev, [type]: { state: 'loading' } }))

    try {
      const response = await fetch('/api/admin/emails/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })

      const payload = (await response.json().catch(() => ({}))) as { error?: string; message?: string }

      if (!response.ok) {
        throw new Error(payload.error || 'Envoi impossible')
      }

      setStatusMap((prev) => ({
        ...prev,
        [type]: { state: 'success', message: payload.message ?? 'Email envoyé à l’utilisateur connecté.' },
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      setStatusMap((prev) => ({ ...prev, [type]: { state: 'error', message } }))
    }
  }

  const getBadgeVariant = (tone: EmailItem['tone']) => {
    switch (tone) {
      case 'marketing':
        return 'secondary'
      case 'admin':
        return 'outline'
      case 'volunteer':
        return 'default'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      {EMAIL_GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.items.map((item) => {
              const status = statusMap[item.type]?.state ?? 'idle'
              const message = statusMap[item.type]?.message

              return (
                <div key={item.type} className="flex flex-col gap-3 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{item.label}</p>
                      {item.tone ? (
                        <Badge variant={getBadgeVariant(item.tone)}>{item.tone}</Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    {status === 'error' && message ? (
                      <Alert variant="destructive" className="mt-2">
                        <AlertDescription>{message}</AlertDescription>
                      </Alert>
                    ) : null}
                    {status === 'success' && message ? (
                      <Alert className="mt-2">
                        <AlertDescription>{message}</AlertDescription>
                      </Alert>
                    ) : null}
                  </div>
                  <Button
                    onClick={() => triggerEmail(item.type)}
                    disabled={status === 'loading'}
                    className="md:w-auto"
                  >
                    {status === 'loading' ? 'Envoi…' : 'Envoyer'}
                  </Button>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default AdminEmailPlayground

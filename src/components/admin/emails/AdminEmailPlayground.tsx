'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

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
      { type: 'event_opening', label: 'Ouverture inscriptions', description: 'Prévenir qu’un événement vient d’ouvrir.', tone: 'marketing' },
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
  {
    title: 'Ambassadeurs (mock)',
    description: 'Simulations des emails ambassadeur (récompense débloquée / statut).',
    items: [
      { type: 'ambassador_reward_earned', label: 'Palier débloqué', description: 'Simulation email palier atteint.', tone: 'transactional' },
      { type: 'ambassador_reward_status', label: 'Statut récompense', description: 'Simulation email mise à jour statut.', tone: 'transactional' },
    ],
  },
]

type TriggerStatus = 'idle' | 'loading' | 'success' | 'error'

export function AdminEmailPlayground() {
  const [statusMap, setStatusMap] = useState<Record<string, { state: TriggerStatus; message?: string }>>({})
  const [receiptPaymentIntentId, setReceiptPaymentIntentId] = useState('')
  const [receiptStatus, setReceiptStatus] = useState<{ state: TriggerStatus; message?: string }>({
    state: 'idle',
  })

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

  const triggerReceipt = async () => {
    if (!receiptPaymentIntentId) {
      setReceiptStatus({ state: 'error', message: 'PaymentIntent manquant (ex: pi_...)' })
      return
    }

    setReceiptStatus({ state: 'loading' })

    try {
      const response = await fetch('/api/admin/emails/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId: receiptPaymentIntentId }),
      })

      const payload = (await response.json().catch(() => ({}))) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error || 'Envoi impossible')
      }

      setReceiptStatus({ state: 'success', message: 'Reçu renvoyé.' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      setReceiptStatus({ state: 'error', message })
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
      <Card>
        <CardHeader>
          <CardTitle>Reçu de paiement</CardTitle>
          <CardDescription>Renvoyer un reçu à partir d’un PaymentIntent Stripe.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              value={receiptPaymentIntentId}
              onChange={(event) => setReceiptPaymentIntentId(event.target.value)}
              placeholder="PaymentIntent (ex: pi_...)"
            />
            <Button onClick={triggerReceipt} disabled={receiptStatus.state === 'loading'}>
              {receiptStatus.state === 'loading' ? 'Envoi…' : 'Renvoyer'}
            </Button>
          </div>
          {receiptStatus.state === 'error' && receiptStatus.message ? (
            <Alert variant="destructive">
              <AlertDescription>{receiptStatus.message}</AlertDescription>
            </Alert>
          ) : null}
          {receiptStatus.state === 'success' && receiptStatus.message ? (
            <Alert>
              <AlertDescription>{receiptStatus.message}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
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

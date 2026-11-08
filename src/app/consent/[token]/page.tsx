'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { Container, Section } from '@/components/ds'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface Choice {
  id: string
  name: string
  description: string | null
  checked: boolean
}

type Status = 'loading' | 'ready' | 'saving' | 'saved' | 'error'

export default function ConsentPage() {
  const params = useParams()
  const token = params.token as string

  const [status, setStatus] = useState<Status>('loading')
  const [choices, setChoices] = useState<Choice[]>([])
  const [accepted, setAccepted] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const response = await fetch(`/api/consent/reconfirm?token=${encodeURIComponent(token)}`)
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Lien invalide')
        if (cancelled) return
        setChoices(data.choices as Choice[])
        setStatus('ready')
      } catch (error) {
        if (cancelled) return
        setErrorMessage(error instanceof Error ? error.message : 'Une erreur est survenue')
        setStatus('error')
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [token])

  const toggle = (id: string, checked: boolean) =>
    setChoices((current) => current.map((choice) => (choice.id === id ? { ...choice, checked } : choice)))

  const save = async () => {
    setStatus('saving')
    setErrorMessage('')
    try {
      const response = await fetch('/api/consent/reconfirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, listIds: choices.filter((c) => c.checked).map((c) => c.id) }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "L'enregistrement a échoué")
      setAccepted(data.accepted as number)
      setStatus('saved')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Une erreur est survenue')
      setStatus('ready')
    }
  }

  return (
    <Section spacing="default">
      <Container size="form">
        <Card variant="info">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
              {status === 'loading' || status === 'saving' ? (
                <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
              ) : status === 'saved' ? (
                <CheckCircle2 className="size-6 text-success" aria-hidden="true" />
              ) : status === 'error' ? (
                <XCircle className="size-6 text-destructive" aria-hidden="true" />
              ) : null}
            </div>
            <CardTitle role="heading" aria-level={1} className="text-title">
              {status === 'saved' ? "C'est enregistré" : 'Choisis ce que tu veux recevoir'}
            </CardTitle>
            <CardDescription>
              {status === 'saved'
                ? accepted > 0
                  ? 'Tu recevras uniquement les emails que tu as cochés. Tu peux changer d\'avis à tout moment.'
                  : 'Tu ne recevras plus nos emails marketing. Les emails liés à tes inscriptions (billets, reçus) continuent.'
                : "Nous mettons à jour la gestion des consentements. Sans confirmation de ta part, tu ne recevras plus nos emails marketing. Les emails liés à tes inscriptions (billets, reçus) ne changent pas."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {status === 'error' && (
              <Alert variant="destructive">
                <AlertDescription>
                  {errorMessage || 'Ce lien est invalide ou a expiré.'} Écris-nous à{' '}
                  <a href="mailto:contact@overbound-race.com" className="underline">
                    contact@overbound-race.com
                  </a>{' '}
                  si le problème continue.
                </AlertDescription>
              </Alert>
            )}

            {(status === 'ready' || status === 'saving') && (
              <ul className="space-y-4">
                {choices.map((choice) => (
                  <li key={choice.id} className="flex items-start gap-3">
                    <Checkbox
                      id={`consent-${choice.id}`}
                      checked={choice.checked}
                      disabled={status === 'saving'}
                      onCheckedChange={(value) => toggle(choice.id, value === true)}
                      className="mt-1"
                    />
                    <Label htmlFor={`consent-${choice.id}`} className="flex flex-col items-start gap-1">
                      <span className="font-semibold">{choice.name}</span>
                      {choice.description ? (
                        <span className="text-sm font-normal text-muted-foreground">{choice.description}</span>
                      ) : null}
                    </Label>
                  </li>
                ))}
              </ul>
            )}

            {errorMessage && (status === 'ready' || status === 'saving') && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            {(status === 'ready' || status === 'saving') && (
              <Button size="cta" className="w-full" onClick={save} disabled={status === 'saving'}>
                {status === 'saving' ? 'Enregistrement...' : 'Enregistrer mes choix'}
              </Button>
            )}
            {(status === 'saved' || status === 'error') && (
              <Button size="cta" variant="outline" className="w-full" asChild>
                <Link href="/">Retour à l'accueil</Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      </Container>
    </Section>
  )
}

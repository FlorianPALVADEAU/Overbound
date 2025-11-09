'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, MailX, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

export default function UnsubscribePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [userName, setUserName] = useState<string>('')

  const handleUnsubscribe = async () => {
    setStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unsubscribe')
      }

      setUserName(data.user?.name || '')
      setStatus('success')

      // Redirect to success page after 2 seconds
      setTimeout(() => {
        router.push('/unsubscribe/success')
      }, 2000)
    } catch (error) {
      console.error('Unsubscribe error:', error)
      setErrorMessage(
        error instanceof Error ? error.message : 'Une erreur est survenue'
      )
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            {status === 'idle' && <MailX className="w-6 h-6 text-muted-foreground" />}
            {status === 'loading' && <Loader2 className="w-6 h-6 text-primary animate-spin" />}
            {status === 'success' && <CheckCircle2 className="w-6 h-6 text-green-600" />}
            {status === 'error' && <XCircle className="w-6 h-6 text-destructive" />}
          </div>
          <CardTitle className="text-2xl">
            {status === 'success'
              ? 'Désabonnement confirmé'
              : 'Se désabonner des emails marketing'}
          </CardTitle>
          <CardDescription>
            {status === 'idle' &&
              'Vous êtes sur le point de vous désabonner de nos communications marketing.'}
            {status === 'loading' && 'Traitement en cours...'}
            {status === 'success' &&
              'Vous ne recevrez plus nos emails marketing.'}
            {status === 'error' && 'Une erreur est survenue.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'idle' && (
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                En vous désabonnant, vous ne recevrez plus :
                <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
                  <li>Les annonces de nouveaux événements</li>
                  <li>Les offres promotionnelles</li>
                  <li>Les contenus exclusifs et actualités</li>
                </ul>
                <p className="mt-3 text-sm">
                  Vous continuerez à recevoir les emails transactionnels
                  (confirmations d'inscription, billets, etc.).
                </p>
              </AlertDescription>
            </Alert>
          )}

          {status === 'success' && userName && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Merci {userName}. Votre préférence a été enregistrée.
                <br />
                <span className="text-sm">
                  Redirection automatique dans quelques secondes...
                </span>
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage || 'Une erreur inattendue est survenue.'}
                <br />
                <span className="text-sm mt-1 block">
                  Si le problème persiste, contactez-nous à{' '}
                  <a
                    href="mailto:support@overbound-race.com"
                    className="underline"
                  >
                    support@overbound-race.com
                  </a>
                </span>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          {status === 'idle' && (
            <>
              <Button
                onClick={handleUnsubscribe}
                variant="destructive"
                className="w-full"
              >
                <MailX className="w-4 h-4 mr-2" />
                Confirmer le désabonnement
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/">Retour à l'accueil</Link>
              </Button>
            </>
          )}

          {status === 'loading' && (
            <Button disabled className="w-full">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Traitement en cours...
            </Button>
          )}

          {status === 'success' && (
            <div className="w-full text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Vous pouvez gérer vos préférences à tout moment
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/preferences">Gérer mes préférences</Link>
              </Button>
            </div>
          )}

          {status === 'error' && (
            <>
              <Button
                onClick={handleUnsubscribe}
                variant="default"
                className="w-full"
              >
                Réessayer
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/">Retour à l'accueil</Link>
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

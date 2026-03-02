'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircleIcon, CheckCircleIcon, LoaderIcon, MailIcon } from 'lucide-react'

type MessageState = { type: 'success' | 'error'; text: string }

export default function ResetPasswordRequestPage() {
  const supabase = createSupabaseBrowser()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<MessageState | null>(null)

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email) {
      setMessage({ type: 'error', text: 'Saisis ton adresse email.' })
      return
    }

    if (!isValidEmail(email)) {
      setMessage({ type: 'error', text: 'Adresse email invalide.' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset/update`,
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
        return
      }

      setMessage({
        type: 'success',
        text: 'Un email de réinitialisation vient de t’être envoyé. Clique sur le lien pour choisir un nouveau mot de passe.',
      })
    } catch (err) {
      console.error('[reset] resetPasswordForEmail failed', err)
      setMessage({ type: 'error', text: 'Impossible d’envoyer l’email pour le moment.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-primary/10 p-3">
                <MailIcon className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Mot de passe oublié</CardTitle>
            <p className="text-sm text-muted-foreground">
              Saisis l’adresse associée à ton compte Overbound. Nous t’enverrons un lien pour définir un nouveau mot de passe.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Adresse email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours…
                  </>
                ) : (
                  <>
                    <MailIcon className="mr-2 h-4 w-4" />
                    Envoyer le lien de réinitialisation
                  </>
                )}
              </Button>
            </form>

            {message ? (
              <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                {message.type === 'error' ? (
                  <AlertCircleIcon className="h-4 w-4" />
                ) : (
                  <CheckCircleIcon className="h-4 w-4" />
                )}
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            ) : null}

            <div className="text-center text-sm text-muted-foreground">
              Tu te souviens de ton mot de passe ?{' '}
              <Link href="/auth/login" className="text-primary underline-offset-4 hover:underline">
                Retour à la connexion
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

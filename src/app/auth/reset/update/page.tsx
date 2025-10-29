'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircleIcon, CheckCircleIcon, EyeIcon, EyeOffIcon, LoaderIcon, LockIcon } from 'lucide-react'

type MessageState = { type: 'success' | 'error'; text: string }

export default function ResetPasswordUpdatePage() {
  const supabase = createSupabaseBrowser()
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<MessageState | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [sessionAvailable, setSessionAvailable] = useState(false)

  useEffect(() => {
    const ensureRecoverySession = async () => {
      const { data } = await supabase.auth.getSession()
      const hasSession = Boolean(data.session)
      setSessionAvailable(hasSession)
      if (!hasSession) {
        setMessage({
          type: 'error',
          text: 'Le lien de réinitialisation a expiré ou est invalide. Demande un nouvel email pour continuer.',
        })
      }
      setSessionChecked(true)
    }

    ensureRecoverySession()
  }, [supabase])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!sessionChecked || !sessionAvailable) return

    if (!password || !confirmPassword) {
      setMessage({ type: 'error', text: 'Merci de saisir et confirmer ton nouveau mot de passe.' })
      return
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères.' })
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas.' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        const isMissingSession = error.message?.toLowerCase().includes('auth session missing')
        setMessage({
          type: 'error',
          text: isMissingSession
            ? 'Ce lien n’est plus valide. Demande un nouvel email pour réinitialiser ton mot de passe.'
            : error.message,
        })
        if (isMissingSession) {
          setSessionAvailable(false)
        }
        return
      }

      setMessage({
        type: 'success',
        text: 'Mot de passe mis à jour ! Tu peux maintenant te connecter avec tes nouveaux identifiants.',
      })

      setTimeout(() => {
        router.push('/auth/login?success=' + encodeURIComponent('Ton mot de passe a été mis à jour.'))
      }, 1500)
    } catch (err) {
      console.error('[reset] updateUser failed', err)
      setMessage({ type: 'error', text: 'Impossible de mettre à jour le mot de passe pour le moment.' })
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
                <LockIcon className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Définis ton nouveau mot de passe</CardTitle>
            <p className="text-sm text-muted-foreground">
              Choisis un mot de passe sécurisé qui protège ton espace Overbound.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading || !sessionAvailable}
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Au moins 6 caractères.</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirmer le mot de passe
                </label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={loading || !sessionAvailable}
                  autoComplete="new-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !sessionChecked || !sessionAvailable}
              >
                {loading ? (
                  <>
                    <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                    Mise à jour…
                  </>
                ) : (
                  <>
                    <LockIcon className="mr-2 h-4 w-4" />
                    Mettre à jour mon mot de passe
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

            {!sessionAvailable ? (
              <div className="rounded-2xl border border-dashed border-[#26AA26]/40 bg-[#26AA26]/10 p-4 text-sm text-[#1b5a1b]">
                <p className="font-semibold">Ton lien est expiré.</p>
                <p className="mt-1">
                  Demande un nouvel email de réinitialisation pour obtenir un lien valide.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="mt-3 h-10 border-[#26AA26] text-[#26AA26] hover:bg-[#26AA26]/10"
                >
                  <Link href="/auth/reset">Envoyer un nouveau lien</Link>
                </Button>
              </div>
            ) : null}

            <div className="text-center text-sm text-muted-foreground">
              Besoin d’aide supplémentaire ?{' '}
              <Link href="/contact" className="text-primary underline-offset-4 hover:underline">
                Contacter le support
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

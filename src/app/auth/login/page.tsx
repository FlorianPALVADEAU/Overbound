'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { mapOAuthCallbackErrorMessage, resolveSafeNextPath } from '@/lib/auth/clientValidation'
import { AUTH_VISUALS, pickRandomAuthVisual } from '@/lib/auth/authVisuals'
import { useAuthFlow } from '@/hooks/auth/useAuthFlow'
import {
  AlertCircleIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
  LoaderIcon,
} from 'lucide-react'

function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [showPassword, setShowPassword] = useState(false)
  const [authVisual, setAuthVisual] = useState<string | null>(null)

  const nextPath = resolveSafeNextPath(searchParams.get('next'))

  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    message,
    setMessage,
    inAppBrowserName,
    login,
    signInWithGoogle,
    maybeAutoStartGoogleOAuth,
    openInExternalBrowser,
  } = useAuthFlow({
    nextPath,
    onAuthenticated: () => {
      router.push(nextPath)
      router.refresh()
    },
  })

  const canSubmitPassword = email.trim().length > 0 && password.trim().length > 0

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      setMessage({ type: 'error', text: mapOAuthCallbackErrorMessage(decodeURIComponent(error)) })
      return
    }

    const success = searchParams.get('success')
    if (success) {
      setMessage({ type: 'success', text: decodeURIComponent(success) || 'Connexion réussie !' })
      return
    }

    const popupNotice = searchParams.get('popup_notice')
    if (popupNotice === 'email_registered_login') {
      setMessage({
        type: 'error',
        text: 'Cette adresse e-mail existe déjà. Prochaine étape: connecte-toi.',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    const storageKey = 'overbound-auth-visual'
    const persisted = window.localStorage.getItem(storageKey)
    if (persisted && AUTH_VISUALS.includes(persisted as (typeof AUTH_VISUALS)[number])) {
      setAuthVisual(persisted)
      return
    }

    const randomVisual = pickRandomAuthVisual()
    window.localStorage.setItem(storageKey, randomVisual)
    setAuthVisual(randomVisual)
  }, [])

  useEffect(() => {
    maybeAutoStartGoogleOAuth(searchParams.get('oauth'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handlePasswordLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await login()
  }

  return (
    <main className="bg-[#0b0c0e] text-white">
      <div className="grid min-h-[calc(100dvh-96px)] lg:grid-cols-[40%_60%]">
        <section className="relative hidden lg:block">
          {authVisual ? (
            <Image src={authVisual} alt="Course Overbound" fill priority sizes="40vw" className="object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-black/35" />
        </section>

        <section className="flex items-center justify-center px-6 py-8 lg:px-14">
          <div className="w-full max-w-lg space-y-6">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">Overbound</p>
              <h1 className="text-4xl font-black uppercase leading-none">S&apos;identifier</h1>
            </div>

            <form onSubmit={handlePasswordLogin} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm text-zinc-300">Adresse e-mail</label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                  placeholder="vous@exemple.com"
                  className="h-11 border-zinc-700 bg-zinc-900/40 text-white placeholder:text-zinc-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm text-zinc-300">Mot de passe</label>
                  <Link href="/auth/reset" className="text-xs text-zinc-400 hover:text-primary">Oublié ?</Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-11 border-zinc-700 bg-zinc-900/40 pr-10 text-white placeholder:text-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <p className="text-xs text-zinc-500">
                En vous connectant, vous acceptez nos{' '}
                <Link href="/cgu" className="text-primary underline-offset-4 hover:underline">conditions d’utilisation</Link>
                {' '}et notre{' '}
                <Link href="/privacy-policies" className="text-primary underline-offset-4 hover:underline">politique de confidentialité</Link>.
              </p>

              <Button
                type="submit"
                className="h-12 w-full rounded-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                disabled={loading || !canSubmitPassword}
              >
                {loading ? (
                  <>
                    <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                    Connexion…
                  </>
                ) : (
                  <>
                    <KeyIcon className="mr-2 h-4 w-4" />
                    Se connecter
                  </>
                )}
              </Button>
            </form>

            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#0b0c0e] px-3 text-xs uppercase tracking-wide text-zinc-500">ou</span>
                </div>
              </div>

              {inAppBrowserName ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                  <p className="mb-3 font-semibold">La connexion Google nécessite un vrai navigateur.</p>
                  <p className="mb-3 text-amber-200/70 text-xs">
                    Le navigateur intégré ({inAppBrowserName}) bloque Google. Clique ci-dessous pour ouvrir dans Safari ou Chrome, puis connecte-toi.
                  </p>
                  <Button
                    type="button"
                    onClick={() => openInExternalBrowser('google')}
                    className="w-full rounded-full bg-amber-500 font-semibold text-black hover:bg-amber-400"
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Ouvrir dans Safari / Chrome pour Google
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => void signInWithGoogle()}
                  variant="outline"
                  className="cursor-pointer h-12 w-full rounded-full border-primary/60 bg-primary/15 text-white shadow-[0_0_30px_-12px_rgba(34,197,94,0.75)] hover:bg-primary/25"
                  disabled={loading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continuer avec Google
                </Button>
              )}
            </div>

            {message ? (
              <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                {message.type === 'error' ? <AlertCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            ) : null}

            <div className="text-center text-sm text-zinc-400">
              Pas encore de compte ?{' '}
              <Link href="/auth/register" className="text-primary underline-offset-4 hover:underline">Créer un compte</Link>
            </div>

          </div>
        </section>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[60vh] items-center justify-center bg-linear-to-b from-background to-muted/20">
          <div className="text-sm text-muted-foreground">Chargement de la page de connexion…</div>
        </main>
      }
    >
      <LoginInner />
    </Suspense>
  )
}

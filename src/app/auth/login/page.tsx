'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useQueryClient } from '@tanstack/react-query'
import { SESSION_QUERY_KEY, type SessionResponse } from '@/app/api/session/sessionQueries'
import {
  AUTH_CONFIG_ERROR_MESSAGE,
  buildAuthCallbackUrl,
  isValidEmail,
  mapOAuthCallbackErrorMessage,
  resolveAuthBaseUrl,
  resolveSafeNextPath,
} from '@/lib/auth/clientValidation'
import {
  buildExternalBrowserUrl,
  detectInAppBrowser,
  isInAppBrowser,
} from '@/lib/auth/inAppBrowser'
import { buildExternalOAuthUrl, shouldAutoStartGoogleOAuth } from '@/lib/auth/oauthFlow'
import { AUTH_VISUALS, pickRandomAuthVisual } from '@/lib/auth/authVisuals'
import { writeMirroredSession } from '@/lib/auth/clientSessionMirror'
import {
  AlertCircleIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
  LoaderIcon,
} from 'lucide-react'

type MessageState = { type: 'success' | 'error'; text: string }

function LoginInner() {
  const supabase = createSupabaseBrowser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<MessageState | null>(null)
  const [inAppBrowserName, setInAppBrowserName] = useState<string | null>(null)
  const [authVisual, setAuthVisual] = useState<string | null>(null)
  const autoOauthTriggeredRef = useRef(false)
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
    }
  }, [searchParams])

  useEffect(() => {
    if (typeof navigator === 'undefined') return
    const userAgent = navigator.userAgent || ''
    if (!isInAppBrowser(userAgent)) return
    setInAppBrowserName(detectInAppBrowser(userAgent))
  }, [])

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

  const resolveNextPath = () => resolveSafeNextPath(searchParams.get('next'))

  const handlePasswordLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email || !password) {
      setMessage({ type: 'error', text: 'Veuillez saisir votre email et votre mot de passe.' })
      return
    }

    if (!isValidEmail(email)) {
      setMessage({ type: 'error', text: 'Adresse email invalide.' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setMessage({
          type: 'error',
          text: 'Email ou mot de passe incorrect. Si ton compte vient de Google, connecte-toi avec Google ou utilise "Mot de passe oublié".',
        })
        return
      }

      if (signInData.session) {
        writeMirroredSession(signInData.session)
      }

      void fetch('/api/auth/post-auth-sync', { method: 'POST' }).catch((syncError) => {
        console.warn('[login] post-auth sync failed', syncError)
      })

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (currentUser) {
        queryClient.setQueryData<SessionResponse>(SESSION_QUERY_KEY, (previous) => ({
          user: {
            id: currentUser.id,
            email: currentUser.email,
            created_at: currentUser.created_at,
            user_metadata: currentUser.user_metadata,
          },
          profile: previous?.profile ?? null,
          alerts: previous?.alerts ?? null,
        }))
      }

      await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY })

      setMessage({ type: 'success', text: 'Connexion réussie ! Redirection…' })
      router.push(resolveNextPath())
      router.refresh()
    } catch (err) {
      console.error('[login] signInWithPassword failed', err)
      setMessage({ type: 'error', text: 'Impossible de vous connecter pour le moment.' })
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = useCallback(async () => {
    setLoading(true)
    setMessage(null)

    try {
      const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : undefined
      const siteUrlFromEnv = process.env.NEXT_PUBLIC_SITE_URL
      const base = resolveAuthBaseUrl(runtimeOrigin, siteUrlFromEnv)

      if (!base) {
        setMessage({ type: 'error', text: AUTH_CONFIG_ERROR_MESSAGE })
        setLoading(false)
        return
      }

      const redirectTo = buildAuthCallbackUrl(base, resolveSafeNextPath(searchParams.get('next')))
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })

      if (error) {
        setMessage({ type: 'error', text: error.message })
        setLoading(false)
      }
    } catch (err) {
      console.error('[login] signInWithOAuth failed', err)
      setMessage({ type: 'error', text: 'Connexion Google indisponible pour le moment.' })
      setLoading(false)
    }
  }, [searchParams, supabase])

  useEffect(() => {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''
    const shouldStart = shouldAutoStartGoogleOAuth({
      oauthParam: searchParams.get('oauth'),
      userAgent,
      alreadyTriggered: autoOauthTriggeredRef.current,
    })

    if (!shouldStart) return

    autoOauthTriggeredRef.current = true
    void signInWithGoogle()
  }, [searchParams, signInWithGoogle])

  const openInExternalBrowser = (oauthProvider?: 'google') => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return
    const currentUrl = oauthProvider
      ? buildExternalOAuthUrl(window.location.href, oauthProvider)
      : window.location.href
    const url = buildExternalBrowserUrl(currentUrl, navigator.userAgent || '')
    window.location.href = url
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
              <Button
                onClick={() => {
                  if (inAppBrowserName) {
                    openInExternalBrowser('google')
                    return
                  }
                  void signInWithGoogle()
                }}
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
            </div>

            {inAppBrowserName ? (
              <Alert>
                <AlertCircleIcon className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <p>Le navigateur intégré ({inAppBrowserName}) bloque souvent la connexion Google.</p>
                  <Button type="button" variant="secondary" size="sm" onClick={() => openInExternalBrowser('google')}>
                    Ouvrir dans Safari / Chrome
                  </Button>
                </AlertDescription>
              </Alert>
            ) : null}

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

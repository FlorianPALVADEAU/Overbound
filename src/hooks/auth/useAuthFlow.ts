import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { SESSION_QUERY_KEY, type SessionResponse } from '@/app/api/session/sessionQueries'
import {
  AUTH_CONFIG_ERROR_MESSAGE,
  buildAuthCallbackUrl,
  isValidEmail,
  mapOAuthCallbackErrorMessage,
  mapRegisterAuthErrorMessage,
  mapResendConfirmationErrorMessage,
  registerValidationErrorMessage,
  resolveAuthBaseUrl,
  validateRegisterInput,
} from '@/lib/auth/clientValidation'
import { buildExternalBrowserUrl, detectInAppBrowser, isInAppBrowser } from '@/lib/auth/inAppBrowser'
import { buildExternalOAuthUrl, shouldAutoStartGoogleOAuth } from '@/lib/auth/oauthFlow'

export type AuthMessage = { type: 'success' | 'error'; text: string } | null

const VERIFICATION_CODE_LENGTH = 6

interface UseAuthFlowOptions {
  /** Path used to build the Google OAuth callback redirect. */
  nextPath: string
  /**
   * Path the signup confirmation email should link back to. Overbound's signup
   * flow always confirms into `/account` regardless of where signup started,
   * so callers with a different `nextPath` (e.g. a `?next=` deep link) should
   * still pass '/account' here unless they have a reason not to.
   */
  emailConfirmRedirectPath?: string
  /** Called once the session is confirmed authenticated (after login, signup-with-session, or OTP verify). */
  onAuthenticated?: () => void
}

export function useAuthFlow({
  nextPath,
  emailConfirmRedirectPath = '/account',
  onAuthenticated,
}: UseAuthFlowOptions) {
  const supabase = createSupabaseBrowser()
  const queryClient = useQueryClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<AuthMessage>(null)

  const [inAppBrowserName, setInAppBrowserName] = useState<string | null>(null)

  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null)
  const [resendingConfirmation, setResendingConfirmation] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [verifyingCode, setVerifyingCode] = useState(false)

  const autoOauthTriggeredRef = useRef(false)

  useEffect(() => {
    if (typeof navigator === 'undefined') return
    const userAgent = navigator.userAgent || ''
    if (!isInAppBrowser(userAgent)) return
    setInAppBrowserName(detectInAppBrowser(userAgent))
  }, [])

  useEffect(() => {
    if (!pendingVerificationEmail || resendCooldown <= 0) return
    const timer = window.setInterval(() => {
      setResendCooldown((previous) => (previous > 0 ? previous - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [pendingVerificationEmail, resendCooldown])

  const syncSessionAfterAuth = useCallback(async () => {
    void fetch('/api/auth/post-auth-sync', { method: 'POST' }).catch(() => {})

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
  }, [queryClient, supabase])

  const login = useCallback(async () => {
    if (!email || !password) {
      setMessage({ type: 'error', text: 'Veuillez saisir votre email et votre mot de passe.' })
      return false
    }

    if (!isValidEmail(email)) {
      setMessage({ type: 'error', text: 'Adresse email invalide.' })
      return false
    }

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setMessage({
          type: 'error',
          text: 'Email ou mot de passe incorrect. Si ton compte vient de Google, connecte-toi avec Google ou utilise "Mot de passe oublié".',
        })
        return false
      }

      await syncSessionAfterAuth()
      setMessage({ type: 'success', text: 'Connexion réussie ! Redirection…' })
      onAuthenticated?.()
      return true
    } catch (err) {
      console.error('[useAuthFlow] signInWithPassword failed', err)
      setMessage({ type: 'error', text: 'Impossible de vous connecter pour le moment.' })
      return false
    } finally {
      setLoading(false)
    }
  }, [email, password, supabase, syncSessionAfterAuth, onAuthenticated])

  const signup = useCallback(
    async (fullName?: string) => {
      const validationError = validateRegisterInput({ email, password, confirmPassword })
      if (validationError) {
        setMessage({ type: 'error', text: registerValidationErrorMessage(validationError) })
        return false
      }

      setLoading(true)
      setMessage(null)
      setPendingVerificationEmail(null)

      try {
        const emailRedirectTo = resolveAuthRedirectUrl(emailConfirmRedirectPath)
        if (!emailRedirectTo) {
          setMessage({ type: 'error', text: AUTH_CONFIG_ERROR_MESSAGE })
          return false
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || null },
            emailRedirectTo,
          },
        })

        if (error) {
          setMessage({ type: 'error', text: mapRegisterAuthErrorMessage(error.message) })
          return false
        }

        if (data.session) {
          await syncSessionAfterAuth()
          setMessage({ type: 'success', text: 'Compte créé ! Redirection vers votre espace…' })
          onAuthenticated?.()
          return true
        }

        setMessage({
          type: 'success',
          text: "Compte créé ! Entre le code reçu par email pour confirmer ton inscription. Si tu ne reçois rien, utilise 'Renvoyer l'email'.",
        })
        setPendingVerificationEmail(email)
        setResendCooldown(60)
        return false
      } catch (err) {
        console.error('[useAuthFlow] signUp failed', err)
        setMessage({ type: 'error', text: 'Inscription impossible pour le moment.' })
        return false
      } finally {
        setLoading(false)
      }
    },
    [email, password, confirmPassword, emailConfirmRedirectPath, supabase, syncSessionAfterAuth, onAuthenticated],
  )

  const resendConfirmationEmail = useCallback(async () => {
    if (!pendingVerificationEmail || resendCooldown > 0) return

    const emailRedirectTo = resolveAuthRedirectUrl(emailConfirmRedirectPath)
    if (!emailRedirectTo) {
      setMessage({ type: 'error', text: AUTH_CONFIG_ERROR_MESSAGE })
      return
    }

    setResendingConfirmation(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingVerificationEmail,
        options: { emailRedirectTo },
      })

      if (error) {
        setMessage({ type: 'error', text: mapResendConfirmationErrorMessage(error.message) })
        return
      }

      setMessage({
        type: 'success',
        text: `Code de confirmation renvoyé à ${pendingVerificationEmail}. Vérifie aussi les spams/indésirables.`,
      })
      setResendCooldown(60)
    } catch (err) {
      console.error('[useAuthFlow] resend failed', err)
      setMessage({ type: 'error', text: "Impossible de renvoyer l'email de confirmation pour le moment." })
    } finally {
      setResendingConfirmation(false)
    }
  }, [pendingVerificationEmail, resendCooldown, emailConfirmRedirectPath, supabase])

  const verifySignupCode = useCallback(
    async (code: string) => {
      if (!pendingVerificationEmail) return false
      const token = code.trim()
      if (token.length !== VERIFICATION_CODE_LENGTH) {
        setMessage({ type: 'error', text: 'Saisis le code de confirmation reçu par email.' })
        return false
      }

      setVerifyingCode(true)
      setMessage(null)

      try {
        const { error } = await supabase.auth.verifyOtp({
          email: pendingVerificationEmail,
          token,
          type: 'signup',
        })

        if (error) {
          setMessage({ type: 'error', text: error.message })
          return false
        }

        await syncSessionAfterAuth()
        setMessage({ type: 'success', text: 'Compte confirmé. Redirection vers votre espace…' })
        setPendingVerificationEmail(null)
        onAuthenticated?.()
        return true
      } catch (err) {
        console.error('[useAuthFlow] verifyOtp failed', err)
        setMessage({ type: 'error', text: 'Impossible de vérifier le code pour le moment.' })
        return false
      } finally {
        setVerifyingCode(false)
      }
    },
    [pendingVerificationEmail, supabase, syncSessionAfterAuth, onAuthenticated],
  )

  const resetVerificationStep = useCallback(() => {
    setPendingVerificationEmail(null)
    setResendCooldown(0)
    setMessage(null)
  }, [])

  const signInWithGoogle = useCallback(async () => {
    setLoading(true)
    setMessage(null)

    try {
      const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : undefined
      const base = resolveAuthBaseUrl(runtimeOrigin, process.env.NEXT_PUBLIC_SITE_URL)

      if (!base) {
        setMessage({ type: 'error', text: AUTH_CONFIG_ERROR_MESSAGE })
        setLoading(false)
        return
      }

      const redirectTo = buildAuthCallbackUrl(base, nextPath)
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })

      if (error) {
        setMessage({ type: 'error', text: error.message })
        setLoading(false)
      }
    } catch (err) {
      console.error('[useAuthFlow] signInWithOAuth failed', err)
      setMessage({ type: 'error', text: 'Connexion Google indisponible pour le moment.' })
      setLoading(false)
    }
  }, [nextPath, supabase])

  /**
   * Opens Google OAuth in a popup instead of navigating the current page away.
   * Used from the inline registration auth step so the guest's in-progress
   * form (tickets, participants, disclaimer, signature) never gets wiped by a
   * full-page reload. Falls back to the normal full-page redirect if the
   * popup is blocked by the browser.
   */
  const signInWithGooglePopup = useCallback(
    (onSuccess: () => void) => {
      setLoading(true)
      setMessage(null)

      const openPopup = async () => {
        const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : undefined
        const base = resolveAuthBaseUrl(runtimeOrigin, process.env.NEXT_PUBLIC_SITE_URL)

        if (!base) {
          setMessage({ type: 'error', text: AUTH_CONFIG_ERROR_MESSAGE })
          setLoading(false)
          return
        }

        const redirectTo = `${base}/auth/callback/popup`
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo, skipBrowserRedirect: true },
        })

        if (error || !data?.url) {
          setMessage({ type: 'error', text: error?.message ?? 'Connexion Google indisponible pour le moment.' })
          setLoading(false)
          return
        }

        const popup = window.open(data.url, 'overbound-google-oauth', 'width=480,height=680')

        if (!popup) {
          // Popup blocked: fall back to the normal full-page redirect.
          void signInWithGoogle()
          return
        }

        let settled = false
        const cleanup = () => {
          window.removeEventListener('message', onMessage)
          window.clearInterval(pollClosed)
        }

        const onMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return
          const payload = event.data as { type?: string; error?: string } | undefined
          if (payload?.type === 'oauth-success') {
            settled = true
            cleanup()
            void (async () => {
              await syncSessionAfterAuth()
              setMessage({ type: 'success', text: 'Connexion réussie !' })
              setLoading(false)
              onSuccess()
            })()
          } else if (payload?.type === 'oauth-error') {
            settled = true
            cleanup()
            setMessage({ type: 'error', text: payload.error || 'Connexion Google impossible.' })
            setLoading(false)
          }
        }

        window.addEventListener('message', onMessage)

        const pollClosed = window.setInterval(() => {
          if (popup.closed) {
            cleanup()
            if (!settled) setLoading(false)
          }
        }, 500)
      }

      void openPopup()
    },
    [supabase, syncSessionAfterAuth, signInWithGoogle],
  )

  /** Wire this to a `?oauth=google` query param to auto-trigger Google OAuth after returning from an external-browser redirect. */
  const maybeAutoStartGoogleOAuth = useCallback(
    (oauthParam: string | null) => {
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''
      const shouldStart = shouldAutoStartGoogleOAuth({
        oauthParam,
        userAgent,
        alreadyTriggered: autoOauthTriggeredRef.current,
      })

      if (!shouldStart) return

      autoOauthTriggeredRef.current = true
      void signInWithGoogle()
    },
    [signInWithGoogle],
  )

  const openInExternalBrowser = useCallback((oauthProvider?: 'google') => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return
    const currentUrl = oauthProvider
      ? buildExternalOAuthUrl(window.location.href, oauthProvider)
      : window.location.href
    const ua = navigator.userAgent || ''
    const url = buildExternalBrowserUrl(currentUrl, ua)

    // On iOS, window.open with _blank triggers the native "Open in Safari"
    // prompt inside Meta webviews, which is the only reliable mechanism since
    // x-safari-https:// was deprecated. On Android the intent URL handles it.
    if (/iphone|ipad|ipod/i.test(ua)) {
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }

    window.location.href = url
  }, [])

  return {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    message,
    setMessage,

    inAppBrowserName,

    pendingVerificationEmail,
    resendingConfirmation,
    resendCooldown,
    verifyingCode,

    login,
    signup,
    resendConfirmationEmail,
    verifySignupCode,
    resetVerificationStep,
    signInWithGoogle,
    signInWithGooglePopup,
    maybeAutoStartGoogleOAuth,
    openInExternalBrowser,
  }
}

function resolveAuthRedirectUrl(nextPath: string) {
  const base = resolveAuthBaseUrl(
    typeof window !== 'undefined' ? window.location.origin : undefined,
    process.env.NEXT_PUBLIC_SITE_URL,
  )
  if (!base) return null
  return buildAuthCallbackUrl(base, nextPath)
}

export { mapOAuthCallbackErrorMessage }

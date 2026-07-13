'use client'

import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircleIcon, CheckCircleIcon, EyeIcon, EyeOffIcon, LoaderIcon } from 'lucide-react'
import { useAuthFlow } from '@/hooks/auth/useAuthFlow'

type Mode = 'login' | 'signup'

const VERIFICATION_CODE_LENGTH = 6

interface InlineAuthStepProps {
  onAuthenticated: () => void
}

export default function InlineAuthStep({ onAuthenticated }: InlineAuthStepProps) {
  const [mode, setMode] = useState<Mode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')

  const nextPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'

  const {
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
    signInWithGooglePopup,
  } = useAuthFlow({
    nextPath,
    emailConfirmRedirectPath: '/account',
    onAuthenticated,
  })

  const isVerificationStep = Boolean(pendingVerificationEmail)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (mode === 'login') void login()
    else void signup()
  }

  const handleVerify = async () => {
    const verified = await verifySignupCode(verificationCode)
    if (verified) setVerificationCode('')
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">
          {isVerificationStep ? 'Vérifie ton email' : 'Connecte-toi pour finaliser ton inscription'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isVerificationStep
            ? `Saisis le code envoyé à ${pendingVerificationEmail}.`
            : "Tes informations saisies sont conservées, tu n'as rien à ressaisir."}
        </p>
      </div>

      {!isVerificationStep && (
        <div className="flex gap-1 rounded-lg bg-black/30 p-1 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setMessage(null)
            }}
            className={`flex-1 rounded-md px-3 py-1.5 font-medium transition-colors ${
              mode === 'login'
                ? 'bg-primary/50 text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setMessage(null)
            }}
            className={`flex-1 rounded-md px-3 py-1.5 font-medium transition-colors ${
              mode === 'signup'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Créer un compte
          </button>
        </div>
      )}

      {isVerificationStep ? (
        <div className="space-y-3">
          <Input
            inputMode="numeric"
            placeholder="Code à 6 chiffres"
            value={verificationCode}
            onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, VERIFICATION_CODE_LENGTH))}
            disabled={verifyingCode}
            className="text-center font-mono text-lg tracking-widest"
          />
          <Button onClick={handleVerify} disabled={verifyingCode || verificationCode.length !== VERIFICATION_CODE_LENGTH} className="w-full">
            {verifyingCode ? <LoaderIcon className="mr-2 h-4 w-4 animate-spin" /> : null}
            Valider le code
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resendConfirmationEmail}
            disabled={resendingConfirmation || resendCooldown > 0}
            className="w-full"
          >
            {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : 'Renvoyer le code'}
          </Button>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              autoComplete="email"
            />
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mot de passe"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
            {mode === 'signup' && (
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <LoaderIcon className="mr-2 h-4 w-4 animate-spin" /> : null}
              {mode === 'signup' ? 'Créer mon compte et continuer' : 'Se connecter et continuer'}
            </Button>
          </form>

          {!inAppBrowserName && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-2 text-xs uppercase tracking-wide text-muted-foreground">ou</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => signInWithGooglePopup(onAuthenticated)}
                variant="outline"
                className="w-full"
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
            </>
          )}
        </>
      )}

      {message ? (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'error' ? <AlertCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}

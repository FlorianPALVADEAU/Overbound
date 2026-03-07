export type RegisterValidationInput = {
  email: string
  password: string
  confirmPassword: string
}

export type RegisterValidationError =
  | 'missing_required_fields'
  | 'invalid_email'
  | 'password_too_short'
  | 'password_mismatch'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const AUTH_CONFIG_ERROR_MESSAGE =
  "Erreur de configuration : URL de l'application introuvable."

export function isValidEmail(value: string) {
  return EMAIL_REGEX.test(value)
}

export function resolveSafeNextPath(next: string | null | undefined) {
  return next && next.startsWith('/') ? next : '/account'
}

export function resolveAuthBaseUrl(runtimeOrigin?: string | null, envSiteUrl?: string | null) {
  // In production, always prefer the canonical site URL to avoid OAuth/session
  // domain drift (e.g. www vs apex) which can lead to intermittent 401s.
  const base = envSiteUrl || runtimeOrigin || null
  if (!base) return null
  return base.replace(/\/$/, '')
}

export function buildAuthCallbackUrl(baseUrl: string, nextPath: string) {
  return `${baseUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`
}

export function validateRegisterInput(input: RegisterValidationInput): RegisterValidationError | null {
  if (!input.email || !input.password || !input.confirmPassword) {
    return 'missing_required_fields'
  }

  if (!isValidEmail(input.email)) {
    return 'invalid_email'
  }

  if (input.password.length < 6) {
    return 'password_too_short'
  }

  if (input.password !== input.confirmPassword) {
    return 'password_mismatch'
  }

  return null
}

export function registerValidationErrorMessage(error: RegisterValidationError) {
  switch (error) {
    case 'missing_required_fields':
      return 'Veuillez remplir tous les champs obligatoires.'
    case 'invalid_email':
      return 'Adresse email invalide.'
    case 'password_too_short':
      return 'Le mot de passe doit contenir au moins 6 caractères.'
    case 'password_mismatch':
      return 'Les mots de passe ne correspondent pas.'
  }
}

export function mapRegisterAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase()
  const accountAlreadyExists =
    normalized.includes('already registered') ||
    normalized.includes('already exists') ||
    normalized.includes('user already')

  if (accountAlreadyExists) {
    return 'Cette adresse est déjà utilisée. Connecte-toi avec Google ou utilise "Mot de passe oublié".'
  }

  return message
}

export function mapResendConfirmationErrorMessage(message: string) {
  const normalized = message.toLowerCase()
  const isRateLimited =
    normalized.includes('security purposes') ||
    normalized.includes('wait') ||
    normalized.includes('too many')

  if (isRateLimited) {
    return "Trop de demandes rapprochées. Attends une minute puis réessaie de renvoyer l'email."
  }

  return message
}

export function mapOAuthCallbackErrorMessage(message: string) {
  const normalized = message.toLowerCase()
  const looksLikeInAppBrowserBlock =
    normalized.includes('access_denied') ||
    normalized.includes('popup closed') ||
    normalized.includes('user canceled') ||
    normalized.includes('webview') ||
    normalized.includes('browser') ||
    normalized.includes('oauth provider error')

  if (looksLikeInAppBrowserBlock) {
    return 'La connexion Google a été bloquée par le navigateur intégré. Ouvre cette page dans Safari/Chrome puis réessaie.'
  }

  return message
}

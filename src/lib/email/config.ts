export function getEmailAssetsBaseUrl(): string {
  const envUrl =
    process.env.EMAIL_ASSETS_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://overbound-race.com'

  // Avoid localhost for emails, as clients cannot fetch it
  try {
    const u = new URL(envUrl)
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      return 'https://overbound-race.com'
    }
  } catch {
    // if invalid URL, fall back to production domain
    return 'https://overbound-race.com'
  }
  return envUrl.replace(/\/$/, '')
}

export function getLogoUrl(): string {
  return `${getEmailAssetsBaseUrl()}/images/brand/totem_logo.png`
}


/** Photos of the current series, converted to jpg for mail clients (see docs/guides/email-conventions.md). */
export type EmailPhoto =
  | 'P1090801'
  | 'P1091283'
  | 'P1091298'
  | 'P1091584'
  | 'P1102314'
  | 'P1102323'
  | 'P1102426'
  | 'chain-carry3'
  | 'log-carry1'
  | 'tire-drag'
  | 'tire-flip'
  | 'tire-flip2'

export function getEmailPhotoUrl(photo: EmailPhoto): string {
  return `${getEmailAssetsBaseUrl()}/images/email/${photo}.jpg`
}

export function getWhiteLogoUrl(): string {
  return `${getEmailAssetsBaseUrl()}/images/brand/totem_logo_white.png`
}

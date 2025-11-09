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
  return `${getEmailAssetsBaseUrl()}/images/totem_logo.png`
}


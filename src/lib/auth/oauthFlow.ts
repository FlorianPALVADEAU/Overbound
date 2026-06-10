import { isInAppBrowser } from './inAppBrowser'

export function shouldAutoStartGoogleOAuth(params: {
  oauthParam: string | null
  userAgent: string
  alreadyTriggered: boolean
}) {
  if (params.oauthParam !== 'google') {
    return false
  }

  if (params.alreadyTriggered) {
    return false
  }

  return !isInAppBrowser(params.userAgent)
}

export function buildExternalOAuthUrl(currentUrl: string, provider: 'google' = 'google') {
  const url = new URL(currentUrl)
  url.searchParams.set('oauth', provider)
  return url.toString()
}

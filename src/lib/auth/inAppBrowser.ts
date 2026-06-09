export type InAppBrowserName =
  | 'instagram'
  | 'snapchat'
  | 'facebook'
  | 'unknown_inapp'
  | 'regular_browser'

const IN_APP_PATTERNS: Array<{ name: InAppBrowserName; regex: RegExp }> = [
  { name: 'instagram', regex: /instagram/i },
  { name: 'snapchat', regex: /snapchat/i },
  { name: 'facebook', regex: /fban|fbav|fb_iab/i },
]

export function detectInAppBrowser(userAgent: string): InAppBrowserName {
  for (const pattern of IN_APP_PATTERNS) {
    if (pattern.regex.test(userAgent)) {
      return pattern.name
    }
  }

  // Catch other embedded browsers.
  if (/; wv\)|webview|line\//i.test(userAgent)) {
    return 'unknown_inapp'
  }

  return 'regular_browser'
}

export function isInAppBrowser(userAgent: string) {
  return detectInAppBrowser(userAgent) !== 'regular_browser'
}

export function buildExternalBrowserUrl(currentUrl: string, userAgent: string) {
  // Android: use intent without a package target so the OS picks the default
  // browser. Targeting com.android.chrome specifically fails when Chrome is not
  // the default or not installed.
  if (/android/i.test(userAgent)) {
    const url = new URL(currentUrl)
    const hostAndPath = `${url.host}${url.pathname}${url.search}${url.hash}`
    return `intent://${hostAndPath}#Intent;scheme=${url.protocol.replace(':', '')};action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`
  }

  // iOS: x-safari-https:// is deprecated since iOS 17. The only reliable
  // mechanism is window.open with _blank which iOS Safari accepts even from
  // webviews when triggered by a user gesture. We return the plain URL and let
  // the caller do window.open so the gesture chain stays intact.
  if (/iphone|ipad|ipod/i.test(userAgent)) {
    return currentUrl
  }

  return currentUrl
}


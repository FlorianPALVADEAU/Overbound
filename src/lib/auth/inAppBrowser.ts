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
  // Android: ask to open in Chrome directly.
  if (/android/i.test(userAgent)) {
    const url = new URL(currentUrl)
    const hostAndPath = `${url.host}${url.pathname}${url.search}${url.hash}`
    return `intent://${hostAndPath}#Intent;scheme=${url.protocol.replace(':', '')};package=com.android.chrome;end`
  }

  // iOS Safari deep-link.
  if (/iphone|ipad|ipod/i.test(userAgent)) {
    return `x-safari-${currentUrl}`
  }

  return currentUrl
}


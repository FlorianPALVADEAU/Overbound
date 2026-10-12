import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { middleware as authMiddleware } from './middlewares/authMiddleware'

export function proxy(request: NextRequest) {
  const canonicalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const isProduction = process.env.VERCEL_ENV === 'production'

  if (isProduction && canonicalSiteUrl) {
    try {
      const canonical = new URL(canonicalSiteUrl)
      const requestUrl = request.nextUrl
      const sameHost = requestUrl.host === canonical.host

      if (!sameHost) {
        const redirectUrl = new URL(requestUrl.pathname + requestUrl.search, canonical.origin)
        return NextResponse.redirect(redirectUrl, 308)
      }
    } catch (error) {
      console.warn('[middleware] invalid NEXT_PUBLIC_SITE_URL for canonical redirect', error)
    }
  }

  return authMiddleware(request)
}

export const config = {
  matcher: [
    // Static files and the Sentry tunnel skip auth and maintenance checks.
    '/((?!_next/static|_next/image|favicon.ico|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|mp4|webm|woff2?|pdf|txt|xml|js|webmanifest)$).*)',
  ],
}

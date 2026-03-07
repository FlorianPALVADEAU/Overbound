import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { middleware as authMiddleware } from './src/middlewares/authMiddleware'

export function middleware(request: NextRequest) {
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
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

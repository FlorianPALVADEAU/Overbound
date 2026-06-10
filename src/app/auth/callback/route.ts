import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

const SUPPORTED_EMAIL_OTP_TYPES = ['signup', 'magiclink', 'recovery', 'invite', 'email', 'email_change'] as const
type SupportedEmailOtpType = (typeof SUPPORTED_EMAIL_OTP_TYPES)[number]

const getSafeNextPath = (next: string | null): string => {
  if (!next) {
    return '/account'
  }

  try {
    const decoded = decodeURIComponent(next)
    return decoded.startsWith('/') ? decoded : '/account'
  } catch {
    return next.startsWith('/') ? next : '/account'
  }
}

const getSupportedOtpType = (value: string | null): SupportedEmailOtpType | null => {
  if (!value) return null
  if ((SUPPORTED_EMAIL_OTP_TYPES as readonly string[]).includes(value)) {
    return value as SupportedEmailOtpType
  }
  return null
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  const canonicalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (canonicalSiteUrl) {
    try {
      const canonical = new URL(canonicalSiteUrl)
      if (requestUrl.host !== canonical.host) {
        const canonicalCallbackUrl = new URL(requestUrl.pathname + requestUrl.search, canonical.origin)
        return NextResponse.redirect(canonicalCallbackUrl, 307)
      }
    } catch (error) {
      console.warn('[auth callback] invalid NEXT_PUBLIC_SITE_URL', error)
    }
  }

  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const otpType = getSupportedOtpType(requestUrl.searchParams.get('type'))
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const nextPath = getSafeNextPath(requestUrl.searchParams.get('next'))

  const loginUrl = new URL('/auth/login', origin)

  if (error) {
    loginUrl.searchParams.set('error', errorDescription || error)
    return NextResponse.redirect(loginUrl)
  }

  const redirectUrl = new URL(nextPath, origin)
  const response = NextResponse.redirect(redirectUrl)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(
          cookiesToSet: Array<{
            name: string
            value: string
            options: CookieOptions
          }>
        ) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  if (tokenHash && otpType) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: otpType,
      token_hash: tokenHash,
    })

    if (verifyError) {
      loginUrl.searchParams.set('error', verifyError.message)
      return NextResponse.redirect(loginUrl)
    }

    return response
  }

  if (!code) {
    loginUrl.searchParams.set('error', "Code d'authentification manquant")
    return NextResponse.redirect(loginUrl)
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    loginUrl.searchParams.set('error', exchangeError.message)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const dynamic = 'force-dynamic'

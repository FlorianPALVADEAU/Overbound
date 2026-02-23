import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

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

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const nextPath = getSafeNextPath(requestUrl.searchParams.get('next'))

  const loginUrl = new URL('/auth/login', origin)

  if (error) {
    loginUrl.searchParams.set('error', errorDescription || error)
    return NextResponse.redirect(loginUrl)
  }

  if (!code) {
    loginUrl.searchParams.set('error', "Code d'authentification manquant")
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
            options?: Parameters<typeof response.cookies.set>[2]
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

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    loginUrl.searchParams.set('error', exchangeError.message)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const dynamic = 'force-dynamic'

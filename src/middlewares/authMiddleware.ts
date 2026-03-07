import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Évitez d'écrire du code entre createServerClient et supabase.auth.getUser()
  // Une simple erreur peut conduire les utilisateurs à être bloqués définitivement

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  // Do not force-log users out on transient auth backend failures.
  if (userError) {
    console.warn('[auth middleware] getUser failed', {
      path: request.nextUrl.pathname,
      message: userError.message,
    })
    return supabaseResponse
  }

  const url = request.nextUrl.clone()

  // API routes must never redirect from middleware.
  if (url.pathname.startsWith('/api')) {
    return supabaseResponse
  }

  // Protéger les routes admin
  if (url.pathname.startsWith('/admin')) {
    if (!user) {
      url.pathname = '/auth/login'
      url.searchParams.set('next', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    // Vérifier le rôle admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      url.pathname = '/account'
      return NextResponse.redirect(url)
    }
  }

  // Protéger les routes account
  if (url.pathname.startsWith('/account')) {
    if (!user) {
      url.pathname = '/auth/login'
      url.searchParams.set('next', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }

  // Rediriger les utilisateurs connectés depuis /login vers /account
  if ((url.pathname === '/login' || url.pathname === '/auth/login') && user) {
    url.pathname = '/account'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: Vous devez retourner la réponse supabaseResponse
  // Ceci met à jour les cookies côté navigateur pour votre appli
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

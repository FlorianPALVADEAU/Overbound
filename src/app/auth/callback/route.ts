// Fichier : src/app/auth/callback/route.ts

import { createSupabaseServer } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/account'
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  console.log('Auth callback called with:', { code: !!code, next, error })

  if (error) {
    console.error('Auth error:', error, error_description)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error_description || error)}`)
  }

  if (code) {
    const supabase = await createSupabaseServer()
    
    try {
      console.log('Exchanging code for session...')
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(exchangeError.message)}`)
      }

      console.log('Code exchange successful, user:', data.user?.email)
      
      // Rediriger vers la page demandée ou vers le compte
      const redirectUrl = `${origin}${next}`
      console.log('Redirecting to:', redirectUrl)
      return NextResponse.redirect(redirectUrl)
      
    } catch (error) {
      console.error('Unexpected error during auth callback:', error)
      return NextResponse.redirect(`${origin}/login?error=Une erreur inattendue s'est produite`)
    }
  }

  // Si pas de code, rediriger vers login
  console.log('No code found, redirecting to login')
  return NextResponse.redirect(`${origin}/login?error=Code d'authentification manquant`)
}

export const dynamic = 'force-dynamic'
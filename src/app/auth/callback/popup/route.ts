import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

const popupHtml = (message: { type: 'oauth-success' | 'oauth-error'; error?: string }) => `<!DOCTYPE html>
<html><head><meta charset="utf-8" /><title>Connexion...</title></head>
<body>
<script>
  if (window.opener) {
    window.opener.postMessage(${JSON.stringify(message)}, window.location.origin);
  }
  window.close();
</script>
<p>Connexion en cours, cette fenêtre va se fermer automatiquement...</p>
</body></html>`

const htmlResponse = (message: { type: 'oauth-success' | 'oauth-error'; error?: string }) =>
  new NextResponse(popupHtml(message), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)

  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  if (error) {
    return htmlResponse({ type: 'oauth-error', error: errorDescription || error })
  }

  if (!code) {
    return htmlResponse({ type: 'oauth-error', error: "Code d'authentification manquant" })
  }

  const cookiesToForward: Array<{ name: string; value: string; options: CookieOptions }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(
          cookies: Array<{ name: string; value: string; options: CookieOptions }>,
        ) {
          cookies.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            cookiesToForward.push({ name, value, options })
          })
        },
      },
    },
  )

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return htmlResponse({ type: 'oauth-error', error: exchangeError.message })
  }

  const response = htmlResponse({ type: 'oauth-success' })
  cookiesToForward.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })
  return response
}

export const dynamic = 'force-dynamic'

import { createBrowserClient } from '@supabase/ssr'

let browserClient: ReturnType<typeof createBrowserClient> | undefined

export const createSupabaseBrowser = () => {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return document.cookie
              .split('; ')
              .filter(Boolean)
              .map((cookie) => {
                const [name, value] = cookie.split('=')
                return {
                  name: decodeURIComponent(name),
                  value: decodeURIComponent(value),
                }
              })
          },
          setAll(
            cookiesToSet: Array<{
              name: string
              value: string
              options?: {
                maxAge?: number
                sameSite?: string
                secure?: boolean
              }
            }>
          ) {
            cookiesToSet.forEach(({ name, value, options }) => {
              document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; ${
                options?.maxAge ? `Max-Age=${options.maxAge}; ` : ''
              }${options?.sameSite ? `SameSite=${options.sameSite}; ` : ''}${
                options?.secure ? 'Secure; ' : ''
              }`
            })
          },
        },
      }
    )
  }

  return browserClient
}

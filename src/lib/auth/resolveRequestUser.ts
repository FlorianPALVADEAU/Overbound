import { NextRequest } from 'next/server'
import { createClient as createSupabaseClient, type User } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase/server'

export const resolveRequestUser = async (
  request?: NextRequest | Request,
): Promise<User | null> => {
  const authorizationHeader = request?.headers.get('authorization')
  if (authorizationHeader?.toLowerCase().startsWith('bearer ')) {
    const token = authorizationHeader.slice(7).trim()
    if (token) {
      try {
        const authClient = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )
        const { data, error } = await authClient.auth.getUser(token)
        if (!error && data?.user) {
          return data.user
        }
      } catch (error) {
        console.error('[auth] bearer token validation error', error)
      }
    }
  }

  const supabase = await createSupabaseServer()
  const {
    data: { user: directUser },
  } = await supabase.auth.getUser()

  return directUser ?? null
}

import { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase/server'

export const resolveRequestUser = async (
  request?: NextRequest | Request,
): Promise<User | null> => {
  const supabase = await createSupabaseServer()
  const {
    data: { user: directUser },
  } = await supabase.auth.getUser()

  if (directUser) {
    return directUser
  }

  const authorizationHeader = request?.headers.get('authorization')
  if (!authorizationHeader?.toLowerCase().startsWith('bearer ')) {
    return null
  }

  const token = authorizationHeader.slice(7).trim()
  if (!token) {
    return null
  }

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
    console.error('[auth] bearer token fallback validation error', error)
  }

  return null
}

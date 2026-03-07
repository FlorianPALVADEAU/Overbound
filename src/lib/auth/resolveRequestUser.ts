import { NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase/server'

export const resolveRequestUser = async (
  _request?: NextRequest | Request,
): Promise<User | null> => {
  const supabase = await createSupabaseServer()
  const {
    data: { user: directUser },
  } = await supabase.auth.getUser()

  return directUser ?? null
}

import { NextResponse, type NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase/server'
import { resolveRequestUser } from '@/lib/auth/resolveRequestUser'

export type AdminAuthResult =
  | { ok: true; user: User }
  | { ok: false; response: NextResponse }

export const requireAdmin = async (
  request?: NextRequest | Request,
): Promise<AdminAuthResult> => {
  const user = await resolveRequestUser(request)

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }),
    }
  }

  const supabase = await createSupabaseServer()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }),
    }
  }

  return { ok: true, user }
}

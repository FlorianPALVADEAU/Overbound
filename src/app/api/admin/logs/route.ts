import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'

const ensureAdmin = async () => {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) }
  }

  return { supabase, user }
}

export async function GET(request: Request) {
  const { error, user } = await ensureAdmin()
  if (error) return error

  try {
    const admin = supabaseAdmin()
    const url = new URL(request.url)
    const params = url.searchParams

    const method = params.get('method')
    const status = params.get('status')
    const userEmail = params.get('userEmail')
    const actionType = params.get('actionType')
    const search = params.get('search')
    const startDate = params.get('startDate')
    const endDate = params.get('endDate')
    const limit = Math.min(parseInt(params.get('limit') || '150', 10) || 150, 500)

    let query = admin
      .from('admin_request_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (method) {
      query = query.eq('method', method.toUpperCase())
    }

    if (status) {
      query = query.eq('status_code', parseInt(status, 10))
    }

    if (userEmail) {
      query = query.ilike('user_email', `%${userEmail}%`)
    }

    if (actionType) {
      query = query.ilike('action_type', `%${actionType}%`)
    }

    if (startDate) {
      query = query.gte('created_at', new Date(startDate).toISOString())
    }

    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      query = query.lte('created_at', end.toISOString())
    }

    if (search) {
      query = query.or(
        `path.ilike.%${search}%,summary.ilike.%${search}%,user_email.ilike.%${search}%`
      )
    }

    const { data: logs, error: fetchError, count } = await query

    if (fetchError) {
      throw fetchError
    }

    return NextResponse.json({ logs: logs ?? [], count: count ?? 0, viewer: user })
  } catch (fetchError) {
    console.error('Erreur récupération logs:', fetchError)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

'use server'

import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { z } from 'zod'
import { promotionDirectionSchema, promotionSortSchema, decodePromotionCursor, encodePromotionCursor, sanitizePromotionSearch, type PromotionDirection } from '@/lib/admin/promotionsList'

const listQuerySchema = z.object({ paginated: z.enum(['true', 'false']).default('false'), cursor: z.string().min(1).optional(), limit: z.coerce.number().int().min(25).max(100).default(50), query: z.string().trim().min(1).max(160).optional(), status: z.enum(['all', 'running', 'upcoming', 'expired', 'inactive']).default('all'), sort: promotionSortSchema.default('starts_at'), direction: promotionDirectionSchema.default('desc') })

function sanitizePayload(body: any) {
  const linkText = typeof body.link_text === 'string' && body.link_text.trim().length > 0
    ? body.link_text.trim()
    : "Découvrir l'offre";
  return {
    type: body.type || 'banner',
    title: body.title,
    description: body.description,
    link_url: body.link_url,
    link_text: linkText,
    starts_at: body.starts_at,
    ends_at: body.ends_at,
    is_active: body.is_active ?? true,
    popup_config: body.popup_config || null,
  }
}

async function fetchPromotion(id: string) {
  const admin = supabaseAdmin()
  const { data, error } = await admin
    .from('site_promotions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function GET(request: Request) {
  try {
    const parsed = listQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()))
    if (!parsed.success) return NextResponse.json({ error: 'Paramètres de liste invalides' }, { status: 400 })
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const supabase = await createSupabaseServer()
    const params = parsed.data
    const paginated = params.paginated === 'true' || Boolean(params.cursor || params.query || params.status !== 'all' || request.url.includes('limit=') || request.url.includes('sort=') || request.url.includes('direction='))
    let cursor: ReturnType<typeof decodePromotionCursor> | null = null
    if (paginated && params.cursor) {
      try {
        cursor = decodePromotionCursor(params.cursor, params.sort, params.direction)
      } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Cursor de pagination invalide' }, { status: 400 })
      }
    }
    if (!paginated) {
      const { data: promotions, error: fetchError } = await supabase
        .from('site_promotions')
        .select('*')
      .order('starts_at', { ascending: false })
      if (fetchError) throw fetchError
      return NextResponse.json({ promotions: promotions ?? [] })
    }
    let query = supabase.from('site_promotions').select('*', { count: 'exact' })
    const search = params.query ? sanitizePromotionSearch(params.query) : ''
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,link_text.ilike.%${search}%`)
    if (params.status === 'inactive') {
      const now = new Date().toISOString()
      query = query.or(`is_active.eq.false,ends_at.lt.${now}`)
    }
    if (params.status !== 'all' && params.status !== 'inactive') { const now = new Date().toISOString(); if (params.status === 'running') query = query.eq('is_active', true).lte('starts_at', now).gte('ends_at', now); if (params.status === 'upcoming') query = query.eq('is_active', true).gt('starts_at', now); if (params.status === 'expired') query = query.eq('is_active', true).lt('ends_at', now) }
    if (cursor) { const { data: row, error } = await supabase.from('site_promotions').select(`id, ${params.sort}`).eq('id', cursor.id).maybeSingle(); if (error) throw error; const value = (row as Record<string, unknown> | null)?.[params.sort]; if (typeof value !== 'string') return NextResponse.json({ error: 'Cursor de pagination expiré' }, { status: 400 }); const op = params.direction === 'asc' ? 'gt' : 'lt'; query = query.or(`${params.sort}.${op}.${value},and(${params.sort}.eq.${value},id.${op}.${cursor.id})`) }
    const { data: rows, error, count } = await query.order(params.sort, { ascending: params.direction === 'asc' }).order('id', { ascending: params.direction === 'asc' }).limit(params.limit + 1)
    if (error) throw error
    const promotions = (rows ?? []).slice(0, params.limit); const last = promotions.at(-1) as Record<string, unknown> | undefined; const nextCursor = rows && rows.length > params.limit && last ? encodePromotionCursor({ sort: params.sort, direction: params.direction as PromotionDirection, id: last.id as string }) : null
    return NextResponse.json({ promotions, page: { limit: params.limit, totalCount: count ?? 0, nextCursor } })
  } catch (error) {
    console.error('Erreur GET promotions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const handlePost = async (request: NextRequest) => {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await request.json()

    const trimmedLinkText = typeof payload.link_text === 'string' ? payload.link_text.trim() : ''
    if (!payload.title || !payload.description || !payload.link_url || !trimmedLinkText || !payload.starts_at || !payload.ends_at) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    const startsAt = new Date(payload.starts_at)
    const endsAt = new Date(payload.ends_at)
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      return NextResponse.json({ error: 'Dates invalides' }, { status: 400 })
    }

    if (endsAt <= startsAt) {
      return NextResponse.json({ error: 'La date de fin doit être postérieure à la date de début' }, { status: 400 })
    }

    const admin = supabaseAdmin()
    const insertPayload = sanitizePayload(payload)

    const { data: promotion, error: insertError } = await admin
      .from('site_promotions')
      .insert(insertPayload)
      .select()
      .single()

    if (insertError) throw insertError

    const data = await fetchPromotion(promotion.id)

    return NextResponse.json({ promotion: data })
  } catch (error) {
    console.error('Erreur POST promotion:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Création promotion admin',
})

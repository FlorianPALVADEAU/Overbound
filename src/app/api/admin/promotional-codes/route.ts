import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { promotionalCodeInputSchema, toPromotionalCodeRow } from '@/lib/admin/promotionalCodeInput'
import { promoDirectionSchema, promoSortSchema, decodePromoCursor, encodePromoCursor, sanitizePromoSearch, type PromoDirection } from '@/lib/admin/promotionalCodesList'

const listQuerySchema = z.object({ paginated: z.enum(['true', 'false']).default('false'), cursor: z.string().min(1).optional(), limit: z.coerce.number().int().min(25).max(100).default(50), query: z.string().trim().min(1).max(160).optional(), status: z.enum(['all', 'active', 'inactive']).default('all'), sort: promoSortSchema.default('created_at'), direction: promoDirectionSchema.default('desc') })

async function fetchPromotionalCode(id: string) {
  const admin = supabaseAdmin()
  const { data, error } = await admin
    .from('promotional_codes')
    .select(
      `*,
      events:promotional_code_events(event_id)`
    )
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

    const admin = supabaseAdmin()
    const params = parsed.data
    const paginated = params.paginated === 'true' || Boolean(params.cursor || params.query || params.status !== 'all' || request.url.includes('limit=') || request.url.includes('sort=') || request.url.includes('direction='))
    if (!paginated) {
      const { data: promotionalCodes, error: fetchError } = await admin
      .from('promotional_codes')
      .select(
        `*,
        events:promotional_code_events(event_id)`
      )
      .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      return NextResponse.json({ promotionalCodes })
    }
    let cursor: ReturnType<typeof decodePromoCursor> | null = null
    if (params.cursor) { try { cursor = decodePromoCursor(params.cursor, params.sort, params.direction) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Cursor de pagination invalide' }, { status: 400 }) } }
    let query = admin.from('promotional_codes').select(`*, events:promotional_code_events(event_id)`, { count: 'exact' })
    if (params.status === 'active') query = query.eq('is_active', true)
    if (params.status === 'inactive') query = query.eq('is_active', false)
    const search = params.query ? sanitizePromoSearch(params.query) : ''
    if (search) query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%,description.ilike.%${search}%`)
    if (cursor) {
      const { data: row, error } = await admin.from('promotional_codes').select(`id, ${params.sort}`).eq('id', cursor.id).maybeSingle()
      if (error) throw error
      const value = (row as Record<string, unknown> | null)?.[params.sort]
      if (typeof value !== 'string') return NextResponse.json({ error: 'Cursor de pagination expiré' }, { status: 400 })
      const op = params.direction === 'asc' ? 'gt' : 'lt'
      // The Supabase client encodes PostgREST values itself. Encoding here would
      // turn ':' into '%3A' inside the timestamp literal and PostgreSQL rejects it.
      query = query.or(`${params.sort}.${op}.${value},and(${params.sort}.eq.${value},id.${op}.${cursor.id})`)
    }
    const { data: rows, error, count } = await query.order(params.sort, { ascending: params.direction === 'asc' }).order('id', { ascending: params.direction === 'asc' }).limit(params.limit + 1)
    if (error) throw error
    const hasNext = (rows?.length ?? 0) > params.limit; const promotionalCodes = (rows ?? []).slice(0, params.limit); const last = promotionalCodes.at(-1) as Record<string, unknown> | undefined
    const nextCursor = hasNext && last ? encodePromoCursor({ sort: params.sort, direction: params.direction as PromoDirection, id: last.id as string }) : null
    return NextResponse.json({ promotionalCodes, page: { limit: params.limit, totalCount: count ?? 0, nextCursor } })
  } catch (error) {
    console.error('Erreur GET promotional codes:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const handlePost = async (request: NextRequest) => {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const parsed = promotionalCodeInputSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Requête invalide' }, { status: 400 })
    }
    const payload = parsed.data

    const admin = supabaseAdmin()
    const insertPayload = toPromotionalCodeRow(payload)

    const { data: promotionalCode, error: insertError } = await admin
      .from('promotional_codes')
      .insert(insertPayload)
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Ce code promotionnel existe déjà' }, { status: 409 })
      }
      throw insertError
    }

    const eventIds: string[] = payload.event_ids || []
    if (eventIds.length > 0) {
      const { error: linkError } = await admin.from('promotional_code_events').insert(
        eventIds.map((eventId) => ({ promotional_code_id: promotionalCode.id, event_id: eventId }))
      )
      if (linkError) throw linkError
    }

    const data = await fetchPromotionalCode(promotionalCode.id)

    return NextResponse.json({ promotionalCode: data })
  } catch (error) {
    console.error('Erreur POST promotional code:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Création code promo admin',
})

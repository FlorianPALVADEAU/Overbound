import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { adminUpsellPayloadSchema, replaceExternalUpsellImages, toUpsellWritePayload } from '@/lib/upsells/adminPayload'

const upsellsQuerySchema = z.object({
  paginated: z.enum(['true', '1']).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(25).max(100).default(50),
  query: z.string().trim().max(160).optional(),
  status: z.enum(['all', 'active', 'inactive']).default('all'),
  event_id: z.string().uuid().optional(),
  sort: z.enum(['created_at', 'name', 'price_cents']).default('created_at'),
  direction: z.enum(['asc', 'desc']).default('desc'),
})

const decodeOffset = (cursor?: string) => {
  if (!cursor) return 0
  const offset = Number(Buffer.from(cursor, 'base64url').toString('utf8'))
  if (!Number.isInteger(offset) || offset < 0) throw new Error('Cursor de pagination invalide')
  return offset
}
const encodeOffset = (offset: number) => Buffer.from(String(offset)).toString('base64url')

async function fetchUpsell(id: string) {
  const admin = supabaseAdmin()
  const { data, error } = await admin
    .from('upsells')
    .select(
      `*,
      event:events(id, title, date),
      images:upsell_images(*)`
    )
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function GET(request: NextRequest) {
  const parsedQuery = upsellsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()))
  if (!parsedQuery.success) return NextResponse.json({ error: 'Paramètres de liste invalides' }, { status: 400 })
  const isPaginated = Boolean(parsedQuery.data.paginated || parsedQuery.data.cursor)
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const admin = supabaseAdmin()
    let offset = 0
    try { offset = decodeOffset(parsedQuery.data.cursor) } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Cursor de pagination invalide' }, { status: 400 })
    }
    let upsellsQuery = admin
      .from('upsells')
      .select(
        `*,
      event:events(id, title, date),
      images:upsell_images(*)`, isPaginated ? { count: 'exact' } : undefined)
    if (parsedQuery.data.query) upsellsQuery = upsellsQuery.or(`name.ilike.%${parsedQuery.data.query.replace(/[%,()._]/g, ' ')}%,description.ilike.%${parsedQuery.data.query.replace(/[%,()._]/g, ' ')}%`)
    if (parsedQuery.data.status === 'active') upsellsQuery = upsellsQuery.eq('is_active', true)
    if (parsedQuery.data.status === 'inactive') upsellsQuery = upsellsQuery.eq('is_active', false)
    if (parsedQuery.data.event_id) upsellsQuery = upsellsQuery.eq('event_id', parsedQuery.data.event_id)
    upsellsQuery = upsellsQuery.order(parsedQuery.data.sort, { ascending: parsedQuery.data.direction === 'asc' }).order('id', { ascending: parsedQuery.data.direction === 'asc' })
    if (isPaginated) upsellsQuery = upsellsQuery.range(offset, offset + parsedQuery.data.limit - 1)
    const { data: upsells, error: fetchError, count } = await upsellsQuery

    if (fetchError) throw fetchError

    if (!isPaginated) return NextResponse.json({ upsells })
    const total = count ?? 0
    return NextResponse.json({ upsells, page: { limit: parsedQuery.data.limit, totalCount: total, nextCursor: offset + (upsells?.length ?? 0) < total ? encodeOffset(offset + (upsells?.length ?? 0)) : null } })
  } catch (error) {
    console.error('Erreur GET upsells:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const handlePost = async (request: NextRequest) => {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const parsed = adminUpsellPayloadSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides' }, { status: 400 })

    const admin = supabaseAdmin()
    const insertPayload = toUpsellWritePayload(parsed.data)

    const { data: upsell, error: insertError } = await admin
      .from('upsells')
      .insert(insertPayload)
      .select()
      .single()

    if (insertError) throw insertError
    await replaceExternalUpsellImages(admin, upsell.id, parsed.data.images)

    const data = await fetchUpsell(upsell.id)
    return NextResponse.json({ upsell: data })
  } catch (error) {
    console.error('Erreur POST upsell:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Création upsell admin',
})

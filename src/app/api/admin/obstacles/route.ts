import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { z } from 'zod'
import { adminObstacleDirectionSchema, adminObstacleSortSchema, decodeAdminObstaclesCursor, encodeAdminObstaclesCursor, sanitizeAdminObstacleSearch, type AdminObstacleDirection } from '@/lib/admin/obstaclesList'

const paginatedQuerySchema = z.object({
  paginated: z.enum(['true', 'false']).default('false'),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(25).max(100).default(50),
  query: z.string().trim().min(1).max(160).optional(),
  type: z.string().trim().min(1).optional(),
  difficulty: z.enum(['all', '1-3', '4-6', '7-10']).default('all'),
  sort: adminObstacleSortSchema.default('created_at'),
  direction: adminObstacleDirectionSchema.default('desc'),
})

export async function GET(request: NextRequest) {
  try {
    const parsed = paginatedQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()))
    if (!parsed.success) return NextResponse.json({ error: 'Paramètres de liste invalides' }, { status: 400 })
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }
    const supabase = supabaseAdmin()

    const params = parsed.data
    const isPaginated = params.paginated === 'true' || Boolean(params.cursor || params.query || params.type || params.difficulty !== 'all' || request.url.includes('limit=') || request.url.includes('sort=') || request.url.includes('direction='))
    if (!isPaginated) {
      const { data: obstacles, error } = await supabase
      .from('obstacles')
      .select('*')
      .order('created_at', { ascending: false })
      if (error) throw error
      return NextResponse.json({ obstacles })
    }
    let cursor: ReturnType<typeof decodeAdminObstaclesCursor> | null = null
    if (params.cursor) {
      try { cursor = decodeAdminObstaclesCursor(params.cursor, params.sort, params.direction) }
      catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Cursor de pagination invalide' }, { status: 400 }) }
    }
    let query = supabase.from('obstacles').select('*', { count: 'exact' })
    const search = params.query ? sanitizeAdminObstacleSearch(params.query) : ''
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    if (params.type) query = query.eq('type', params.type)
    if (params.difficulty !== 'all') {
      const [min, max] = params.difficulty.split('-').map(Number)
      query = query.gte('difficulty', min).lte('difficulty', max)
    }
    if (cursor) {
      const { data: cursorRow, error: cursorError } = await supabase.from('obstacles').select(`id, ${params.sort}`).eq('id', cursor.id).maybeSingle()
      if (cursorError) throw cursorError
      const value = (cursorRow as Record<string, unknown> | null)?.[params.sort]
      if (typeof value !== 'string' && typeof value !== 'number') return NextResponse.json({ error: 'Cursor de pagination expiré' }, { status: 400 })
      const op = params.direction === 'asc' ? 'gt' : 'lt'
      const encoded = encodeURIComponent(String(value))
      query = query.or(`${params.sort}.${op}.${encoded},and(${params.sort}.eq.${encoded},id.${op}.${cursor.id})`)
    }
    const { data: rows, error, count } = await query.order(params.sort, { ascending: params.direction === 'asc' }).order('id', { ascending: params.direction === 'asc' }).limit(params.limit + 1)
    if (error) throw error
    const hasNext = (rows?.length ?? 0) > params.limit
    const obstacles = (rows ?? []).slice(0, params.limit)
    const last = obstacles.at(-1) as Record<string, unknown> | undefined
    const nextCursor = hasNext && last ? encodeAdminObstaclesCursor({ sort: params.sort, direction: params.direction as AdminObstacleDirection, id: last.id as string }) : null
    return NextResponse.json({ obstacles, page: { limit: params.limit, totalCount: count ?? 0, nextCursor } })

  } catch (error) {
    console.error('Erreur GET obstacles:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const handlePost = async (request: NextRequest) => {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const body = await request.json()
    const {
      name,
      description,
      image_url,
      video_url,
      difficulty,
      type,
      metric_label,
      metric_value,
      weight_male,
      weight_female,
      penalty
    } = body

    // Validation
    if (!name || !type || difficulty === undefined) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      )
    }

    // Valider la difficulté
    const difficultyNum = parseInt(difficulty)
    if (difficultyNum < 1 || difficultyNum > 10) {
      return NextResponse.json(
        { error: 'La difficulté doit être entre 1 et 10' },
        { status: 400 }
      )
    }

    // Utiliser supabaseAdmin pour insérer
    const admin = supabaseAdmin()
    const { data: obstacle, error } = await admin
      .from('obstacles')
      .insert({
        name,
        description: description || null,
        image_url: image_url || null,
        video_url: video_url || null,
        difficulty: difficultyNum,
        type,
        metric_label: metric_label || null,
        metric_value: metric_value || null,
        weight_male: weight_male || null,
        weight_female: weight_female || null,
        penalty: penalty || null
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ obstacle })

  } catch (error) {
    console.error('Erreur POST obstacle:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Création obstacle admin',
})

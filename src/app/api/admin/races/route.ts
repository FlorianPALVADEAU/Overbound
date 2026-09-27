import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withRequestLogging } from '@/lib/logging/adminRequestLogger'
import { requireAdmin } from '@/lib/auth/requireAdmin'

const racesQuerySchema = z.object({ paginated: z.enum(['true', '1']).optional(), cursor: z.string().min(1).optional(), limit: z.coerce.number().int().min(25).max(100).default(50), query: z.string().trim().max(160).optional(), type: z.string().trim().max(40).optional(), sort: z.enum(['created_at', 'name', 'difficulty', 'distance_km']).default('created_at'), direction: z.enum(['asc', 'desc']).default('desc') })
const decodeOffset = (cursor?: string) => { if (!cursor) return 0; const value = Number(Buffer.from(cursor, 'base64url').toString('utf8')); if (!Number.isInteger(value) || value < 0) throw new Error('Cursor de pagination invalide'); return value }
const encodeOffset = (offset: number) => Buffer.from(String(offset)).toString('base64url')

export async function GET(request: Request) {
  const parsed = racesQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()))
  if (!parsed.success) return NextResponse.json({ error: 'Paramètres de liste invalides' }, { status: 400 })
  const paginated = Boolean(parsed.data.paginated || parsed.data.cursor)
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return auth.response
    }

    const supabase = supabaseAdmin()

    // Récupérer toutes les courses avec leurs obstacles
    let offset = 0
    try { offset = decodeOffset(parsed.data.cursor) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Cursor de pagination invalide' }, { status: 400 }) }
    let racesQuery = supabase
      .from('races')
      .select(`
        *,
        obstacles:race_obstacles!race_obstacles_race_id_fkey(
          order_position,
          is_mandatory,
          obstacle:obstacles!race_obstacles_obstacle_id_fkey(*)
        )
      `, paginated ? { count: 'exact' } : undefined)
    if (parsed.data.query) racesQuery = racesQuery.or(`name.ilike.%${parsed.data.query.replace(/[%,()._]/g, ' ')}%,description.ilike.%${parsed.data.query.replace(/[%,()._]/g, ' ')}%`)
    if (parsed.data.type) racesQuery = racesQuery.eq('type', parsed.data.type)
    racesQuery = racesQuery.order(parsed.data.sort, { ascending: parsed.data.direction === 'asc' }).order('id', { ascending: parsed.data.direction === 'asc' })
    if (paginated) racesQuery = racesQuery.range(offset, offset + parsed.data.limit - 1)
    const { data: races, error, count } = await racesQuery

    if (error) {
      throw error
    }

    if (!paginated) return NextResponse.json({ races })
    const total = count ?? 0
    return NextResponse.json({ races, page: { limit: parsed.data.limit, totalCount: total, nextCursor: offset + (races?.length ?? 0) < total ? encodeOffset(offset + (races?.length ?? 0)) : null } })

  } catch (error) {
    console.error('Erreur GET races:', error)
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
      logo_url,
      type,
      difficulty,
      target_public,
      distance_km,
      description,
      is_universal,
      obstacle_ids
    } = body

    // Validation
    if (!name || !type || !target_public || distance_km === undefined) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      )
    }

    // Utiliser supabaseAdmin pour insérer
    const admin = supabaseAdmin()

    // Créer la course
    const { data: race, error: raceError } = await admin
      .from('races')
      .insert({
        name,
        logo_url: logo_url || null,
        type,
        difficulty: parseInt(difficulty) || 5,
        target_public,
        distance_km: parseFloat(distance_km),
        description: description || null,
        is_universal: is_universal ?? false
      })
      .select()
      .single()

    if (raceError) {
      throw raceError
    }

    // Associer les obstacles si fournis
    if (obstacle_ids && obstacle_ids.length > 0) {
      const obstacleAssociations = obstacle_ids.map((obstacleId: string, index: number) => ({
        race_id: race.id,
        obstacle_id: obstacleId,
        order_position: index + 1,
        is_mandatory: true
      }))

      const { error: obstacleError } = await admin
        .from('race_obstacles')
        .insert(obstacleAssociations)

      if (obstacleError) {
        console.error('Erreur lors de l\'association des obstacles:', obstacleError)
      }
    }

    // Récupérer la course avec ses obstacles
    const { data: fullRace, error: fetchError } = await admin
      .from('races')
      .select(`
        *,
        obstacles:race_obstacles!race_obstacles_race_id_fkey(
          order_position,
          is_mandatory,
          obstacle:obstacles!race_obstacles_obstacle_id_fkey(*)
        )
      `)
      .eq('id', race.id)
      .single()

    if (fetchError) {
      throw fetchError
    }

    return NextResponse.json({ race: fullRace })

  } catch (error) {
    console.error('Erreur POST race:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const POST = withRequestLogging(handlePost, {
  actionType: 'Création course admin',
})

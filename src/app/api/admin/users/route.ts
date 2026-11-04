import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAdminOrganization } from '@/lib/auth/requireAdminOrganization'
import {
  adminUserDirectionSchema,
  adminUserSortSchema,
  decodeAdminUsersCursor,
  encodeAdminUsersCursor,
  sanitizeAdminUserSearch,
} from '@/lib/admin/usersList'

const listQuerySchema = z.object({
  paginated: z.enum(['true', 'false']).default('false'),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(25).max(100).default(50),
  query: z.string().trim().min(1).max(160).optional(),
  role: z.union([z.enum(['user', 'volunteer', 'admin', 'ambassador']), z.literal('all')]).default('all'),
  sort: adminUserSortSchema.default('created_at'),
  direction: adminUserDirectionSchema.default('desc'),
})

/** One row of public.admin_list_users (migration 20261105100000): filtered, sorted and paged in the database. */
interface AdminUserRow {
  id: string
  email: string | null
  created_at: string
  last_sign_in_at: string | null
  full_name: string | null
  role: string
  phone: string | null
  profile_created_at: string | null
  date_of_birth: string | null
  marketing_opt_in: boolean | null
  ambassador_promotional_code_id: string | null
  ambassador_code: string | null
  ambassador_code_is_active: boolean | null
  group_id: string | null
  group_name: string | null
  group_invite_code: string | null
  filtered_count: number
}

function toAdminUser({ filtered_count: _filteredCount, ...user }: AdminUserRow) {
  return user
}

export async function GET(request: Request) {
  try {
    const parsed = listQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()))
    if (!parsed.success) return NextResponse.json({ error: 'Paramètres de liste invalides' }, { status: 400 })
    const auth = await requireAdminOrganization(request)
    if (!auth.ok) {
      return auth.response
    }

    const admin = supabaseAdmin()
    const params = parsed.data
    const isPaginated = params.paginated === 'true' || Boolean(params.cursor || params.query || params.role !== 'all' || request.url.includes('limit=') || request.url.includes('sort=') || request.url.includes('direction='))
    let offset = 0
    if (isPaginated && params.cursor) {
      try {
        offset = decodeAdminUsersCursor(params.cursor, params.sort, params.direction).offset
      } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Cursor de pagination invalide' }, { status: 400 })
      }
    }

    const search = params.query ? sanitizeAdminUserSearch(params.query) : ''
    const { data, error } = await admin.rpc('admin_list_users', {
      p_query: search || null,
      p_role: params.role,
      p_sort: params.sort,
      p_direction: params.direction,
      p_offset: offset,
      // Non paginé : toutes les lignes, pour le sélecteur de membres des groupes.
      p_limit: isPaginated ? params.limit : null,
    })
    if (error) {
      throw new Error(`Lecture des comptes admin échouée : ${error.message}`)
    }

    const rows = (data ?? []) as AdminUserRow[]
    const users = rows.map(toAdminUser)

    if (!isPaginated) {
      return NextResponse.json({ users, total: users.length })
    }

    // total = comptes correspondant à la requête (filtre appliqué). L'UI lit page.totalCount.
    const filteredCount = rows[0]?.filtered_count ?? 0
    const pageEnd = offset + users.length
    const nextCursor = users.length > 0 && pageEnd < filteredCount
      ? encodeAdminUsersCursor({ sort: params.sort, direction: params.direction, offset: pageEnd })
      : null

    return NextResponse.json({
      users,
      total: filteredCount,
      page: { limit: params.limit, totalCount: filteredCount, nextCursor },
    })
  } catch (error) {
    console.error('[admin users] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

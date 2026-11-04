import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAdminOrganization } from '@/lib/auth/requireAdminOrganization'
import {
  adminUserDirectionSchema,
  adminUserSortSchema,
  decodeAdminUsersCursor,
  encodeAdminUsersCursor,
  sanitizeAdminUserSearch,
  type AdminUserDirection,
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

// This admin page manages the single Overbound account universe. Keep a high
// safety bound for Auth scans while returning only the requested page.
const MAX_USERS = 50000
const PAGE_SIZE = 1000
const roleLabels: Record<string, string> = {
  user: 'Utilisateur',
  volunteer: 'Bénévole',
  admin: 'Administrateur',
  ambassador: 'Ambassadeur',
}

// Sorting compares French strings on every request: one collator, not one per comparison.
const frenchCollator = new Intl.Collator('fr', { numeric: true })

interface AuthUserRow {
  id: string
  email: string | null
  created_at: string
  last_sign_in_at: string | null
}

interface PromoRow { code: string | null; is_active: boolean | null }

interface AmbassadorEmbed {
  promotional_code_id: string | null
  promo: PromoRow | PromoRow[] | null
}

interface GroupRow { id: string; name: string | null; invite_code: string | null }

/** One profile with its ambassador row and group memberships, read in a single embedded query. */
interface ProfileScanRow {
  id: string
  full_name: string | null
  role: string | null
  phone: string | null
  created_at: string
  date_of_birth: string | null
  marketing_opt_in: boolean | null
  ambassadors: AmbassadorEmbed | AmbassadorEmbed[] | null
  group_members: Array<{ group: GroupRow | GroupRow[] | null }> | null
}

const firstOf = <T,>(value: T | T[] | null | undefined): T | null => (Array.isArray(value) ? (value[0] ?? null) : (value ?? null))

/** Every Auth account, paged. The list shows all of them, so the write endpoints accept all of them too. */
async function scanAuthUsers(admin: SupabaseClient): Promise<AuthUserRow[]> {
  const users: AuthUserRow[] = []
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE_SIZE })
    if (error) {
      throw error
    }
    const batch = data.users || []
    for (const authUser of batch) {
      users.push({
        id: authUser.id,
        email: authUser.email ?? null,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at ?? null,
      })
    }
    if (batch.length < PAGE_SIZE || users.length >= MAX_USERS) {
      return users
    }
  }
}

/**
 * Every profile in one scan of ordered pages, with its ambassador code and group embedded. The earlier version
 * sent one `in` query per 100 ids, sequentially: about 30 round trips per keystroke in the search box.
 */
async function scanProfiles(admin: SupabaseClient): Promise<ProfileScanRow[]> {
  const rows: ProfileScanRow[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await admin
      .from('profiles')
      .select('id, full_name, role, phone, created_at, date_of_birth, marketing_opt_in, ambassadors(promotional_code_id, promo:promotional_codes(code, is_active)), group_members(group:groups(id, name, invite_code))')
      .order('id')
      .range(from, from + PAGE_SIZE - 1)
    if (error) {
      throw new Error(`Lecture des comptes admin échouée : ${error.message}`)
    }
    const batch = (data ?? []) as unknown as ProfileScanRow[]
    rows.push(...batch)
    if (batch.length < PAGE_SIZE) return rows
  }
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
    let cursor: ReturnType<typeof decodeAdminUsersCursor> | null = null
    if (isPaginated && params.cursor) {
      try {
        cursor = decodeAdminUsersCursor(params.cursor, params.sort, params.direction)
      } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Cursor de pagination invalide' }, { status: 400 })
      }
    }

    const [authUsers, profileRows] = await Promise.all([scanAuthUsers(admin), scanProfiles(admin)])
    const profilesById = new Map(profileRows.map((row) => [row.id, row]))

    const usersWithProfiles = authUsers.map((authUser) => {
      const profile = profilesById.get(authUser.id)
      const ambassador = firstOf(profile?.ambassadors)
      const promo = firstOf(ambassador?.promo)
      const group = profile?.group_members?.map((membership) => firstOf(membership.group)).find((candidate) => candidate !== null) ?? null
      return {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        full_name: profile?.full_name ?? null,
        role: profile?.role ?? 'user',
        phone: profile?.phone ?? null,
        profile_created_at: profile?.created_at ?? null,
        date_of_birth: profile?.date_of_birth ?? null,
        marketing_opt_in: profile?.marketing_opt_in ?? null,
        ambassador_promotional_code_id: ambassador?.promotional_code_id ?? null,
        ambassador_code: promo?.code ?? null,
        ambassador_code_is_active: promo?.is_active ?? null,
        group_id: group?.id ?? null,
        group_name: group?.name ?? null,
        group_invite_code: group?.invite_code ?? null,
      }
    })

    if (!isPaginated) {
      return NextResponse.json({ users: usersWithProfiles, total: usersWithProfiles.length })
    }

    // The filters, the sort and the cursor run here on the full set, then only the requested page is sent.
    const search = params.query ? sanitizeAdminUserSearch(params.query) : ''
    let pageUsers = usersWithProfiles.filter((user) => {
      if (params.role !== 'all' && user.role !== params.role) return false
      if (!search) return true
      return [user.full_name, user.email, roleLabels[user.role], user.phone, user.group_name, user.group_invite_code]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(search))
    })
    const getSortValue = (user: typeof usersWithProfiles[number]): string => {
      const value = user[params.sort]
      return value == null ? '' : String(value).toLowerCase()
    }
    pageUsers.sort((left, right) => {
      const valueCompare = frenchCollator.compare(getSortValue(left), getSortValue(right))
      if (valueCompare !== 0) return params.direction === 'asc' ? valueCompare : -valueCompare
      return params.direction === 'asc' ? left.id.localeCompare(right.id) : right.id.localeCompare(left.id)
    })
    const filteredCount = pageUsers.length
    if (cursor) {
      const cursorIndex = pageUsers.findIndex((user) => user.id === cursor?.id)
      if (cursorIndex < 0) return NextResponse.json({ error: 'Cursor de pagination expiré' }, { status: 400 })
      pageUsers = pageUsers.slice(cursorIndex + 1)
    }
    const pageUsersResult = pageUsers.slice(0, params.limit)
    const hasNextPage = pageUsers.length > params.limit
    const lastUser = pageUsersResult.at(-1)
    const nextCursor = hasNextPage && lastUser
      ? encodeAdminUsersCursor({ sort: params.sort, direction: params.direction as AdminUserDirection, id: lastUser.id })
      : null

    return NextResponse.json({ users: pageUsersResult, total: usersWithProfiles.length, page: { limit: params.limit, totalCount: filteredCount, nextCursor } })
  } catch (error) {
    console.error('[admin users] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

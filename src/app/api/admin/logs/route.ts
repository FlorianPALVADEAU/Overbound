import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { decodeKeysetCursor, encodeKeysetCursor, keysetAfterFilter, type KeysetCursor } from '@/lib/admin/keysetCursor'
import { applyLogFilters, logsQuerySchema } from '@/lib/admin/logsList'
import type { AdminRequestLog } from '@/types/AdminRequestLog'

/** Request journal, newest first, paged by keyset so a long history stays fast and stable. */
export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  const parsed = logsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()))
  if (!parsed.success) return NextResponse.json({ error: 'Paramètres de liste invalides' }, { status: 400 })
  const { cursor, limit, ...filters } = parsed.data

  let decodedCursor: KeysetCursor | null = null
  try {
    if (cursor) decodedCursor = decodeKeysetCursor(cursor)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Cursor invalide' }, { status: 400 })
  }

  try {
    const admin = supabaseAdmin()
    // The count ignores the cursor: "x sur N" is the size of the filtered result, not of what remains.
    const { count, error: countError } = await applyLogFilters(
      admin.from('admin_request_logs').select('id', { count: 'exact', head: true }),
      filters,
    )
    if (countError) throw countError

    let pageQuery = applyLogFilters(admin.from('admin_request_logs').select('*'), filters)
    if (decodedCursor) pageQuery = pageQuery.or(keysetAfterFilter(decodedCursor))
    const { data, error } = await pageQuery
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1)
    if (error) throw error

    const rows = (data ?? []) as AdminRequestLog[]
    const logs = rows.slice(0, limit)
    const last = logs.at(-1)
    return NextResponse.json({
      logs,
      page: {
        limit,
        totalCount: count ?? 0,
        nextCursor: rows.length > limit && last ? encodeKeysetCursor({ createdAt: last.created_at, id: last.id }) : null,
      },
    })
  } catch (error) {
    console.error('[admin logs] unexpected error', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

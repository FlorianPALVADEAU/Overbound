import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { QUOTE_STATUSES } from '@/lib/b2b/quoteRequest'
import { supabaseAdmin } from '@/lib/supabase/server'

const STATUS_VALUES = QUOTE_STATUSES.map((status) => status.value) as [string, ...string[]]

const listQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(25).max(100).default(50),
  query: z.string().trim().max(160).optional(),
  status: z.enum(['all', ...STATUS_VALUES]).default('all'),
})

const decodeOffset = (cursor?: string) => {
  if (!cursor) return 0
  const offset = Number(Buffer.from(cursor, 'base64url').toString('utf8'))
  if (!Number.isInteger(offset) || offset < 0) return null
  return offset
}
const encodeOffset = (offset: number) => Buffer.from(String(offset)).toString('base64url')

export async function GET(request: NextRequest) {
  const parsed = listQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()))
  if (!parsed.success) return NextResponse.json({ error: 'Paramètres de liste invalides' }, { status: 400 })

  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const offset = decodeOffset(parsed.data.cursor)
    if (offset === null) return NextResponse.json({ error: 'Cursor de pagination invalide' }, { status: 400 })

    let query = supabaseAdmin().from('b2b_quote_requests').select('*', { count: 'exact' })
    if (parsed.data.status !== 'all') query = query.eq('status', parsed.data.status)
    if (parsed.data.query) {
      const term = parsed.data.query.replace(/[%,()._]/g, ' ').trim()
      if (term) query = query.or(`company_name.ilike.%${term}%,full_name.ilike.%${term}%,email.ilike.%${term}%`)
    }
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + parsed.data.limit - 1)
    if (error) throw error

    const requests = data ?? []
    const total = count ?? 0
    const nextOffset = offset + requests.length
    return NextResponse.json({
      requests,
      page: { limit: parsed.data.limit, totalCount: total, nextCursor: nextOffset < total ? encodeOffset(nextOffset) : null },
    })
  } catch (error) {
    console.error('Erreur GET b2b-quotes:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

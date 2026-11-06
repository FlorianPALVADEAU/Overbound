import { anonymizeIp } from '@/lib/consent/anonymizeIp'
import { supabaseAdmin } from '@/lib/supabase/server'
import { isCountableVisit, isOverViewCap, VIEW_WINDOW_DAYS } from './views'

/** Port : ce que le use-case attend de la persistance. */
export interface BlogViewStore {
  countVisitsSince(anonIp: string, since: Date): Promise<number>
  insertVisit(row: { postSlug: string; visitId: string; anonIp: string | null }): Promise<void>
  countViewsByPostSince(since: Date): Promise<Map<string, number>>
}

export type RecordBlogViewResult = 'recorded' | 'filtered' | 'capped'

export interface RecordBlogViewInput {
  slug: string
  visitId: string
  forwardedFor: string | null
  userAgent: string | null
  now?: Date
}

const ONE_HOUR_MS = 60 * 60 * 1000

/**
 * Use-case : enregistre une visite sur un article.
 * - robot ou user-agent absent : rien compté ('filtered') ;
 * - préfixe réseau au-dessus du plafond horaire : rien compté ('capped') ;
 * - sinon une ligne par (article, visite). Un doublon est ignoré par la base.
 */
export async function recordBlogView(
  store: BlogViewStore,
  input: RecordBlogViewInput,
): Promise<RecordBlogViewResult> {
  if (!isCountableVisit(input.userAgent)) return 'filtered'

  const anonIp = anonymizeIp(input.forwardedFor?.split(',')[0]?.trim() ?? null)
  const now = input.now ?? new Date()

  if (anonIp) {
    const recent = await store.countVisitsSince(anonIp, new Date(now.getTime() - ONE_HOUR_MS))
    if (isOverViewCap(recent)) return 'capped'
  }

  await store.insertVisit({ postSlug: input.slug, visitId: input.visitId, anonIp })
  return 'recorded'
}

/** Lectures par article sur la fenêtre de popularité. Vide si la lecture échoue. */
export async function loadBlogViewCounts(
  store: BlogViewStore,
  now: Date = new Date(),
): Promise<Map<string, number>> {
  const since = new Date(now.getTime() - VIEW_WINDOW_DAYS * 24 * ONE_HOUR_MS)
  try {
    return await store.countViewsByPostSince(since)
  } catch (error) {
    console.error('[blog views] lecture des compteurs impossible', error)
    return new Map()
  }
}

/** Adaptateur Supabase (service role, table blog_post_views). */
export function createSupabaseBlogViewStore(): BlogViewStore {
  const admin = supabaseAdmin()
  return {
    async countVisitsSince(anonIp, since) {
      const { count, error } = await admin
        .from('blog_post_views')
        .select('id', { count: 'exact', head: true })
        .eq('anon_ip', anonIp)
        .gte('viewed_at', since.toISOString())
      if (error) throw error
      return count ?? 0
    },
    async insertVisit({ postSlug, visitId, anonIp }) {
      const { error } = await admin
        .from('blog_post_views')
        .upsert(
          { post_slug: postSlug, visit_id: visitId, anon_ip: anonIp },
          { onConflict: 'post_slug,visit_id', ignoreDuplicates: true },
        )
      if (error) throw error
    },
    async countViewsByPostSince(since) {
      const { data, error } = await admin.rpc('blog_post_view_counts', {
        p_since: since.toISOString(),
      })
      if (error) throw error
      const rows: ReadonlyArray<{ post_slug: string; views: number | string }> = data ?? []
      return new Map(rows.map((row) => [row.post_slug, Number(row.views)]))
    },
  }
}

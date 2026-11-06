import { z } from 'zod'

/**
 * Règles pures du compteur de lectures du blog. Une visite = une vue :
 * le navigateur tire un identifiant de visite par onglet (sessionStorage),
 * le serveur ne compte qu'une fois chaque couple (article, visite).
 */

/** Fenêtre de popularité : les lectures des 90 derniers jours. */
export const VIEW_WINDOW_DAYS = 90

/**
 * Plafond de visites comptées par préfixe réseau (IP anonymisée, /24) et par
 * heure. Protège des scripts simples sans pénaliser un réseau partagé
 * modeste. À ajuster après observation.
 */
export const VIEW_CAP_PER_PREFIX_PER_HOUR = 100

const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|facebookexternalhit|curl|wget|python|node-fetch|go-http/i

/** Sans user-agent, ou user-agent d'un robot connu : pas de vue. */
export const isCountableVisit = (userAgent: string | null): boolean =>
  typeof userAgent === 'string' && userAgent.trim().length > 0 && !BOT_PATTERN.test(userAgent)

export const isOverViewCap = (visitsLastHourForPrefix: number): boolean =>
  visitsLastHourForPrefix >= VIEW_CAP_PER_PREFIX_PER_HOUR

export const blogViewBodySchema = z.object({
  slug: z.string().min(1).max(200),
  visitId: z.uuid(),
})

export type BlogViewBody = z.infer<typeof blogViewBodySchema>

interface RankablePost {
  slug: string
  publishedAt: string
}

/**
 * Tri du feed : plus de lectures d'abord, à égalité le plus récent. Sans
 * aucune lecture, l'ordre reste celui des dates. Ne modifie pas l'entrée.
 */
export const rankPostsByPopularity = <T extends RankablePost>(
  posts: readonly T[],
  views: ReadonlyMap<string, number>,
): T[] => {
  const time = (post: T) => new Date(post.publishedAt).getTime()
  return [...posts].sort(
    (a, b) => (views.get(b.slug) ?? 0) - (views.get(a.slug) ?? 0) || time(b) - time(a),
  )
}

/** Nombre d'articles affichés dans le bloc « Les plus lus » en tête de feed. */
export const MOST_READ_LIMIT = 3

/**
 * Les articles les plus lus, dans l'ordre de popularité. Un article sans
 * aucune lecture n'entre jamais dans ce bloc.
 */
export const pickMostReadPosts = <T extends RankablePost>(
  posts: readonly T[],
  views: ReadonlyMap<string, number>,
  limit: number = MOST_READ_LIMIT,
): T[] =>
  rankPostsByPopularity(posts, views)
    .filter((post) => (views.get(post.slug) ?? 0) > 0)
    .slice(0, limit)

import type { BlogAuthor } from './types'

/**
 * Every article is signed by the Overbound team, not by a named person.
 * Kept as one constant instead of a Sanity "author" collection: a full
 * author archive route would be dead weight for a single byline.
 * The name is lowercase because the post page renders it mid-sentence ("par l'équipe Overbound").
 */
export const DEFAULT_AUTHOR: BlogAuthor = {
  name: "l'équipe Overbound",
  slug: 'equipe-overbound',
  bio: "L'équipe qui organise Overbound.",
}

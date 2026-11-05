import type { BlogAuthor } from './types'

/**
 * Overbound has a single writer (the site owner). Kept as one constant
 * instead of a Sanity "author" collection: a full author archive route
 * would be dead weight for one person.
 */
export const DEFAULT_AUTHOR: BlogAuthor = {
  name: 'Florian Palvadeau',
  slug: 'florian-palvadeau',
  bio: "Fondateur d'Overbound et organisateur de la course.",
}

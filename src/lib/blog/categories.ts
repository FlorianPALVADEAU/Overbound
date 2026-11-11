import type { BlogCategory, BlogCategorySlug } from './types'

/**
 * Fixed category list (was the Sanity "category" collection). With ~8
 * articles total, a free-text taxonomy editable from a CMS is unnecessary;
 * a new category is a one-line addition here plus a tag on a post's
 * frontmatter.
 */
export const BLOG_CATEGORIES: BlogCategory[] = [
  { slug: 'bilan', title: 'Bilan' },
  { slug: 'formats', title: 'Formats de course' },
  { slug: 'obstacles', title: 'Obstacles' },
  { slug: 'entrainement', title: 'Entraînement' },
  { slug: 'guide', title: 'Guides pratiques' },
]

export const getCategoryBySlug = (slug: string): BlogCategory | undefined =>
  BLOG_CATEGORIES.find((category) => category.slug === slug)

export const isBlogCategorySlug = (value: string): value is BlogCategorySlug =>
  BLOG_CATEGORIES.some((category) => category.slug === value)

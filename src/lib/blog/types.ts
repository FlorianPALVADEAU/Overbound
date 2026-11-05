/**
 * Blog content types. Posts live as MDX files in src/content/blog/*.mdx,
 * replacing the old Sanity "post" document. Kept intentionally small: the
 * site has a single writer and ~8 real articles, not a content pipeline.
 */

export interface BlogAuthor {
  name: string
  slug: string
  avatarUrl?: string
  bio?: string
}

export type BlogCategorySlug =
  | 'bilan'
  | 'formats'
  | 'ambassadeurs'
  | 'obstacles'
  | 'entrainement'
  | 'guide'

export interface BlogCategory {
  slug: BlogCategorySlug
  title: string
}

export interface BlogFrontmatter {
  title: string
  slug: string
  excerpt: string
  mainImage: string
  mainImageAlt: string
  category: BlogCategorySlug
  publishedAt: string
  updatedAt?: string
  ogImage?: string
}

export interface BlogPostSummary extends BlogFrontmatter {
  readingTime: number
  author: BlogAuthor
}

export interface BlogPost extends BlogPostSummary {
  content: string
}

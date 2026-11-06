import { cache } from 'react'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import matter from 'gray-matter'
import { DEFAULT_AUTHOR } from './author'
import { isBlogCategorySlug } from './categories'
import { estimateReadingTime } from '@/lib/readingTime'
import type { BlogFrontmatter, BlogPost, BlogPostSummary } from './types'

const CONTENT_DIR = join(process.cwd(), 'src', 'content', 'blog')

const REQUIRED_FIELDS: Array<keyof BlogFrontmatter> = [
  'title',
  'slug',
  'excerpt',
  'mainImage',
  'mainImageAlt',
  'category',
  'publishedAt',
]

function assertFrontmatter(data: Record<string, unknown>, file: string): BlogFrontmatter {
  for (const field of REQUIRED_FIELDS) {
    if (!data[field] || typeof data[field] !== 'string') {
      throw new Error(`Blog post "${file}" is missing required frontmatter field "${field}"`)
    }
  }
  const category = data.category as string
  if (!isBlogCategorySlug(category)) {
    throw new Error(`Blog post "${file}" has unknown category "${category}"`)
  }
  return {
    title: data.title as string,
    slug: data.slug as string,
    excerpt: data.excerpt as string,
    mainImage: data.mainImage as string,
    mainImageAlt: data.mainImageAlt as string,
    category,
    publishedAt: data.publishedAt as string,
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
    ogImage: typeof data.ogImage === 'string' ? data.ogImage : undefined,
  }
}

/**
 * Reads every .mdx file under src/content/blog once per request (React
 * cache dedupes repeated calls within the same render), parses frontmatter
 * with gray-matter, and sorts by publication date (newest first).
 */
export const loadAllPosts = cache((): BlogPost[] => {
  let files: string[]
  try {
    files = readdirSync(CONTENT_DIR).filter((name) => name.endsWith('.mdx'))
  } catch {
    return []
  }

  const posts = files.map((file) => {
    const raw = readFileSync(join(CONTENT_DIR, file), 'utf8')
    const { data, content } = matter(raw)
    const frontmatter = assertFrontmatter(data, file)
    const readingTime = estimateReadingTime(content).minutes

    const post: BlogPost = {
      ...frontmatter,
      content: content.trim(),
      readingTime,
      author: DEFAULT_AUTHOR,
    }
    return post
  })

  return posts.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )
})

export const loadPostSummaries = cache((): BlogPostSummary[] =>
  loadAllPosts().map(({ content: _content, ...summary }) => summary),
)

export const loadPostBySlug = cache((slug: string): BlogPost | null =>
  loadAllPosts().find((post) => post.slug === slug) ?? null,
)

export interface BlogListParams {
  offset?: number
  limit?: number
  q?: string
  category?: string
}

export function listPosts(params: BlogListParams = {}): { items: BlogPostSummary[]; total: number } {
  const { offset = 0, limit, q, category } = params
  const needle = q?.trim().toLowerCase()

  let filtered = loadPostSummaries()

  if (category) {
    filtered = filtered.filter((post) => post.category === category)
  }

  if (needle) {
    filtered = filtered.filter(
      (post) =>
        post.title.toLowerCase().includes(needle) || post.excerpt.toLowerCase().includes(needle),
    )
  }

  const total = filtered.length
  const items = typeof limit === 'number' ? filtered.slice(offset, offset + limit) : filtered.slice(offset)

  return { items, total }
}

export function listRelatedPosts(slug: string, category: string, max = 3): BlogPostSummary[] {
  return loadPostSummaries()
    .filter((post) => post.slug !== slug && post.category === category)
    .slice(0, max)
}

export function listCategoriesWithCounts() {
  const posts = loadPostSummaries()
  const counts = new Map<string, number>()
  for (const post of posts) {
    counts.set(post.category, (counts.get(post.category) ?? 0) + 1)
  }
  return counts
}

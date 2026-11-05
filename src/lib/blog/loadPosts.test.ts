import { describe, expect, it } from 'vitest'
import { loadAllPosts, loadPostBySlug, listPosts, listRelatedPosts, listCategoriesWithCounts } from './loadPosts'

describe('loadAllPosts', () => {
  it('reads every MDX file under src/content/blog with valid frontmatter', () => {
    const posts = loadAllPosts()
    expect(posts.length).toBeGreaterThan(0)
    for (const post of posts) {
      expect(post.title).toBeTruthy()
      expect(post.slug).toBeTruthy()
      expect(post.excerpt).toBeTruthy()
      expect(post.mainImage).toBeTruthy()
      expect(post.content.length).toBeGreaterThan(0)
      expect(post.readingTime).toBeGreaterThan(0)
      expect(post.author.name).toBeTruthy()
    }
  })

  it('sorts posts by publication date, newest first', () => {
    const posts = loadAllPosts()
    for (let i = 1; i < posts.length; i += 1) {
      const prev = new Date(posts[i - 1].publishedAt).getTime()
      const current = new Date(posts[i].publishedAt).getTime()
      expect(prev).toBeGreaterThanOrEqual(current)
    }
  })
})

describe('loadPostBySlug', () => {
  it('returns the matching post', () => {
    const [first] = loadAllPosts()
    const found = loadPostBySlug(first.slug)
    expect(found?.slug).toBe(first.slug)
  })

  it('returns null for an unknown slug', () => {
    expect(loadPostBySlug('does-not-exist')).toBeNull()
  })
})

describe('listPosts', () => {
  it('filters by category', () => {
    const { items } = listPosts({ category: 'formats' })
    expect(items.length).toBeGreaterThan(0)
    for (const item of items) {
      expect(item.category).toBe('formats')
    }
  })

  it('returns an empty result for a search term that matches nothing', () => {
    const { items, total } = listPosts({ q: 'zzzzz-no-match-zzzzz' })
    expect(items).toEqual([])
    expect(total).toBe(0)
  })

  it('paginates with offset and limit', () => {
    const all = listPosts({}).items
    const { items } = listPosts({ offset: 1, limit: 1 })
    expect(items).toHaveLength(1)
    expect(items[0].slug).toBe(all[1]?.slug)
  })
})

describe('listRelatedPosts', () => {
  it('excludes the current post and only returns the same category', () => {
    const [first] = loadAllPosts()
    const related = listRelatedPosts(first.slug, first.category)
    expect(related.every((post) => post.slug !== first.slug)).toBe(true)
    expect(related.every((post) => post.category === first.category)).toBe(true)
  })

  it('returns an empty list when no other post shares the category', () => {
    const related = listRelatedPosts('unknown-slug', 'does-not-exist-category' as never)
    expect(related).toEqual([])
  })
})

describe('listCategoriesWithCounts', () => {
  it('counts posts per category across the whole catalog', () => {
    const counts = listCategoriesWithCounts()
    const total = Array.from(counts.values()).reduce((sum, n) => sum + n, 0)
    expect(total).toBe(loadAllPosts().length)
  })
})

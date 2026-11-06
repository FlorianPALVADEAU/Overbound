import { describe, expect, it } from 'vitest'
import {
  blogViewBodySchema,
  isCountableVisit,
  isOverViewCap,
  pickMostReadPosts,
  rankPostsByPopularity,
} from './views'

const HUMAN_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15'

describe('isCountableVisit', () => {
  it('compte un navigateur humain', () => {
    expect(isCountableVisit(HUMAN_UA)).toBe(true)
  })

  it('ignore un robot connu, un user-agent absent ou vide', () => {
    expect(isCountableVisit('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe(false)
    expect(isCountableVisit('curl/8.4.0')).toBe(false)
    expect(isCountableVisit(null)).toBe(false)
    expect(isCountableVisit('   ')).toBe(false)
  })
})

describe('isOverViewCap', () => {
  it('laisse passer sous le plafond et bloque à partir du plafond', () => {
    expect(isOverViewCap(99)).toBe(false)
    expect(isOverViewCap(100)).toBe(true)
  })
})

describe('blogViewBodySchema', () => {
  it('accepte un slug et un identifiant de visite UUID', () => {
    const parsed = blogViewBodySchema.safeParse({
      slug: 'course-a-obstacles-sans-montre',
      visitId: '4f1c2a9e-7b3d-4e8a-9c2f-1a2b3c4d5e6f',
    })
    expect(parsed.success).toBe(true)
  })

  it('refuse un identifiant de visite qui n’est pas un UUID', () => {
    const parsed = blogViewBodySchema.safeParse({ slug: 'x', visitId: 'pas-un-uuid' })
    expect(parsed.success).toBe(false)
  })
})

describe('rankPostsByPopularity', () => {
  const posts = [
    { slug: 'ancien-populaire', publishedAt: '2026-09-20' },
    { slug: 'recent-peu-lu', publishedAt: '2026-11-05' },
    { slug: 'recent-tres-lu', publishedAt: '2026-10-01' },
  ]

  it('place en tête l’article le plus lu, même s’il est plus ancien', () => {
    const views = new Map([
      ['ancien-populaire', 40],
      ['recent-peu-lu', 3],
      ['recent-tres-lu', 120],
    ])
    expect(rankPostsByPopularity(posts, views).map((p) => p.slug)).toEqual([
      'recent-tres-lu',
      'ancien-populaire',
      'recent-peu-lu',
    ])
  })

  it('sans aucune lecture, garde l’ordre des dates (le plus récent d’abord)', () => {
    expect(rankPostsByPopularity(posts, new Map()).map((p) => p.slug)).toEqual([
      'recent-peu-lu',
      'recent-tres-lu',
      'ancien-populaire',
    ])
  })

  it('départage à égalité par la date, sans modifier le tableau d’origine', () => {
    const views = new Map([
      ['ancien-populaire', 5],
      ['recent-peu-lu', 5],
    ])
    const original = [...posts]
    const ranked = rankPostsByPopularity(posts, views)
    expect(ranked[0].slug).toBe('recent-peu-lu')
    expect(posts).toEqual(original)
  })
})

describe('pickMostReadPosts', () => {
  const posts = [
    { slug: 'a', publishedAt: '2026-09-20' },
    { slug: 'b', publishedAt: '2026-11-05' },
    { slug: 'c', publishedAt: '2026-10-01' },
    { slug: 'd', publishedAt: '2026-08-01' },
  ]

  it('garde les trois articles les plus lus, dans l’ordre de popularité', () => {
    const views = new Map([
      ['a', 40],
      ['b', 3],
      ['c', 120],
      ['d', 10],
    ])
    expect(pickMostReadPosts(posts, views).map((p) => p.slug)).toEqual(['c', 'a', 'd'])
  })

  it('n’inclut jamais un article sans lecture', () => {
    const views = new Map([['b', 2]])
    expect(pickMostReadPosts(posts, views).map((p) => p.slug)).toEqual(['b'])
  })

  it('renvoie une liste vide sans aucune lecture', () => {
    expect(pickMostReadPosts(posts, new Map())).toEqual([])
  })

  it('respecte la limite demandée', () => {
    const views = new Map([
      ['a', 4],
      ['b', 3],
      ['c', 2],
      ['d', 1],
    ])
    expect(pickMostReadPosts(posts, views, 2).map((p) => p.slug)).toEqual(['a', 'b'])
  })
})

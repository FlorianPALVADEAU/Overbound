import { describe, expect, it } from 'vitest'
import { isActiveNavHref } from './activeLink'

describe('isActiveNavHref', () => {
  it('matches the exact page and its sub-pages', () => {
    expect(isActiveNavHref('/blog', '/blog')).toBe(true)
    expect(isActiveNavHref('/blog/post/mon-article', '/blog')).toBe(true)
    expect(isActiveNavHref('/events/formats/', '/events/formats')).toBe(true)
  })

  it('does not match a page that only shares a prefix', () => {
    expect(isActiveNavHref('/blogueurs', '/blog')).toBe(false)
    expect(isActiveNavHref('/events/formats', '/events/ultra-arena-2026')).toBe(false)
  })

  it('matches the home link only on the home page', () => {
    expect(isActiveNavHref('/', '/')).toBe(true)
    expect(isActiveNavHref('/blog', '/')).toBe(false)
  })

  it('ignores hashes and queries, and never matches external links', () => {
    expect(isActiveNavHref('/about/partners', '/about/partners#contacts')).toBe(true)
    expect(isActiveNavHref('/about/faq', 'https://www.instagram.com/overbound.race/')).toBe(false)
    expect(isActiveNavHref(null, '/blog')).toBe(false)
  })
})

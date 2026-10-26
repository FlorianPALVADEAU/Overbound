import { describe, expect, it } from 'vitest'
import { PILLAR_PAGES, buildPillarPages, countWords } from './pillarPages'
import { resolveNextEdition } from './nextEdition'
import { buildPillarJsonLd } from './pillarJsonLd'
import { PILLAR_LINKS } from './siteFacts'

describe('pillar pages content', () => {
  it.each(Object.entries(PILLAR_PAGES))('%s: answer-first paragraph is 40 to 60 words', (_key, page) => {
    const words = countWords(page.answer)
    expect(words).toBeGreaterThanOrEqual(40)
    expect(words).toBeLessThanOrEqual(60)
  })

  it.each(Object.entries(PILLAR_PAGES))('%s: path matches the shared link and page has a FAQ', (key, page) => {
    expect(page.path).toBe(PILLAR_LINKS[key as keyof typeof PILLAR_LINKS].href)
    expect(page.faq.length).toBeGreaterThan(0)
  })

  it('never claims the format is unique or the venue of 2027 is known', () => {
    const text = JSON.stringify(PILLAR_PAGES).toLowerCase()
    expect(text).not.toContain('unique au monde')
    expect(text).not.toContain("n'existe pas ailleurs")
    expect(text).not.toContain('24 avril')
  })
})

describe('buildPillarJsonLd', () => {
  it('builds WebPage, BreadcrumbList and FAQPage with one entry per question', () => {
    const page = PILLAR_PAGES.paris
    const graph = buildPillarJsonLd(page)
    expect(graph.map((node) => node['@type'])).toEqual(['WebPage', 'BreadcrumbList', 'FAQPage'])
    const faq = graph[2] as { mainEntity: unknown[] }
    expect(faq.mainEntity).toHaveLength(page.faq.length)
  })

  it('uses absolute URLs', () => {
    const webPage = buildPillarJsonLd(PILLAR_PAGES.facts)[0] as { url: string }
    expect(webPage.url).toMatch(/^https?:\/\/.+\/overbound-en-bref$/)
  })
})

describe('once the next edition is confirmed in the database', () => {
  const next = resolveNextEdition({ date: '2027-04-24T07:00:00+00:00', location: 'Île de Loisirs de Saint-Quentin' })
  const pages = buildPillarPages(next)

  it.each(Object.entries(pages))('%s: keeps a 40 to 60 word answer and drops the fallback wording', (_key, page) => {
    expect(countWords(page.answer)).toBeGreaterThanOrEqual(40)
    expect(countWords(page.answer)).toBeLessThanOrEqual(60)
    expect(JSON.stringify(page).toLowerCase()).not.toContain('entre avril et juin')
    expect(JSON.stringify(page)).not.toContain('sera annoncé dès sa confirmation')
  })

  it('states the confirmed date and venue', () => {
    const text = JSON.stringify(pages.facts)
    expect(text).toContain('le 24 avril 2027')
    expect(text).toContain('Île de Loisirs de Saint-Quentin')
  })
})

describe('teaser video', () => {
  it('adds a VideoObject only on the page that shows the video', () => {
    expect(PILLAR_PAGES.facts.video).toBe(true)
    expect(buildPillarJsonLd(PILLAR_PAGES.facts).map((n) => n['@type'])).toContain('VideoObject')
    expect(buildPillarJsonLd(PILLAR_PAGES.paris).map((n) => n['@type'])).not.toContain('VideoObject')
  })
})

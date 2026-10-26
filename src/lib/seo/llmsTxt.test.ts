import { describe, expect, it } from 'vitest'
import { buildLlmsFullTxt, buildLlmsTxt } from './llmsTxt'
import { PILLAR_PAGES } from './pillarPages'
import { resolveNextEdition } from './nextEdition'

describe('llms.txt', () => {
  it('starts with an H1 and a summary quote, and links the reference pages with absolute URLs', () => {
    const text = buildLlmsTxt()
    expect(text.startsWith('# Overbound\n\n> ')).toBe(true)
    for (const page of Object.values(PILLAR_PAGES)) {
      expect(text).toMatch(new RegExp(`\\(https?://[^)]+${page.path}\\)`))
    }
  })

  it('does not state a 2027 date or venue as confirmed', () => {
    const text = `${buildLlmsTxt()}${buildLlmsFullTxt()}`
    expect(text).toContain('entre avril et juin 2027')
    expect(text).not.toMatch(/24 avril/)
  })
})

describe('llms-full.txt', () => {
  it('contains every pillar answer and FAQ question', () => {
    const text = buildLlmsFullTxt()
    for (const page of Object.values(PILLAR_PAGES)) {
      expect(text).toContain(page.answer)
      for (const faq of page.faq) expect(text).toContain(faq.question)
    }
  })
})

describe('llms.txt once the next edition is confirmed', () => {
  const next = resolveNextEdition({ date: '2027-04-24T07:00:00+00:00', location: 'Île de Loisirs de Saint-Quentin' })

  it('states the confirmed date and lifts the citation restriction', () => {
    const text = buildLlmsTxt(next)
    expect(text).toContain('Prochaine édition : le 24 avril 2027')
    expect(text).not.toContain('ne le sont pas encore')
    expect(buildLlmsFullTxt(next)).not.toContain('entre avril et juin')
  })
})

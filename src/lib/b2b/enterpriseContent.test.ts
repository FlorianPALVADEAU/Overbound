import { describe, expect, it } from 'vitest'
import { countWords } from '@/lib/seo/pillarPages'
import { resolveNextEdition } from '@/lib/seo/nextEdition'
import { buildEnterpriseFaq, buildEnterpriseJsonLd, buildGoodToKnow, enterpriseAnswer, enterpriseDescription } from './enterpriseContent'

describe('enterprise page content', () => {
  it('keeps the answer-first paragraph between 40 and 60 words', () => {
    const words = countWords(enterpriseAnswer())
    expect(words).toBeGreaterThanOrEqual(40)
    expect(words).toBeLessThanOrEqual(60)
  })

  it('keeps the meta description under 160 characters', () => {
    expect(enterpriseDescription().length).toBeLessThanOrEqual(160)
  })

  it('announces the window until the edition is confirmed, then the date', () => {
    expect(enterpriseAnswer()).toContain('entre avril et juin 2027')
    const confirmed = resolveNextEdition({ date: '2027-04-24T08:00:00+02:00', location: 'Saint-Quentin-en-Yvelines' })
    expect(enterpriseAnswer(confirmed)).toContain('le 24 avril 2027')
  })

  it('states the real discount grid and transfer fee in the FAQ', () => {
    const faq = buildEnterpriseFaq().map((item) => item.answer).join(' ')
    expect(faq).toMatch(/10 % à partir de 2 billets, 15 % à partir de 3 billets, 20 % à partir de 6 billets/)
    expect(faq).toMatch(/6,99\s€ TTC/)
    expect(faq).toMatch(/OPEN et RANKED comptent ensemble/)
  })

  it('tells a buyer about the health proof, the public nature of the event and the payment methods', () => {
    const faq = buildEnterpriseFaq().map((item) => `${item.question} ${item.answer}`).join(' ')
    expect(faq).toMatch(/Pass Prévention Santé/)
    expect(faq).toMatch(/Non\. Overbound est un événement ouvert à tous/)
    expect(faq).toMatch(/virement SEPA/)
    expect(faq).toMatch(/même créneau/)
    expect(faq).toMatch(/pas de douches ni de vestiaires/)
    expect(faq).toMatch(/6 € par véhicule/)
  })

  it('does not promise a free replacement of a participant', () => {
    expect(buildEnterpriseFaq().map((item) => item.answer).join(' ')).not.toMatch(/gratuit/i)
  })

  it('ships a WebPage, a BreadcrumbList and a FAQPage with every question', () => {
    const nodes = buildEnterpriseJsonLd()
    expect(nodes.map((node) => node['@type'])).toEqual(['WebPage', 'Service', 'BreadcrumbList', 'FAQPage'])
    const faqNode = nodes[3] as { mainEntity: unknown[] }
    expect(faqNode.mainEntity).toHaveLength(buildEnterpriseFaq().length)
  })
})

describe('venue conditions', () => {
  const onSite = (next?: Parameters<typeof buildGoodToKnow>[0]) =>
    buildGoodToKnow(next).find((card) => card.title === 'Sur place')?.text ?? ''
  const announced = resolveNextEdition({ date: '2027-04-24T08:00:00+02:00', location: 'Parc de Test' })

  it('says the conditions are confirmed later while no venue is announced', () => {
    expect(onSite()).toMatch(/seront confirmées avec le lieu/)
  })

  it('names the announced venue and asks to check the event page', () => {
    expect(onSite(announced)).toMatch(/Lieu de la prochaine édition : Parc de Test/)
    expect(onSite(announced)).not.toMatch(/seront confirmées/)
    const faq = buildEnterpriseFaq(announced).map((item) => item.answer).join(' ')
    expect(faq).toMatch(/Parc de Test/)
    expect(faq).toMatch(/Vérifiez la règle de la prochaine édition/)
  })
})

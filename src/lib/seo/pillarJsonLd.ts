import { BRAND, SITE_URL } from './siteFacts'
import type { PillarContent } from './pillarPages'
import { buildBreadcrumbJsonLd, buildTeaserVideoJsonLd } from './structuredData'

const absolute = (path: string) => `${SITE_URL}${path}`

export const buildPillarJsonLd = (content: PillarContent) => {
  const url = absolute(content.path)
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: content.title,
      description: content.description,
      inLanguage: 'fr-FR',
      isPartOf: { '@type': 'WebSite', name: BRAND.name, url: SITE_URL },
    },
    buildBreadcrumbJsonLd([{ name: content.heading, path: content.path }]),
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: content.faq.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    },
    ...(content.video ? [buildTeaserVideoJsonLd()] : []),
  ]
}

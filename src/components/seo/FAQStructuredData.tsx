import type { PortableTextBlock } from '@portabletext/types'
import { safeJsonStringify } from '@/lib/safeJson'

type FAQItem = {
  title: string
  shortAnswer?: string
  answer?: PortableTextBlock[] | any[]
}

function extractTextFromPortableText(blocks?: any[]): string {
  if (!blocks || !Array.isArray(blocks)) return ''

  return blocks
    .filter((block) => block?._type === 'block')
    .map((block) => {
      if (!Array.isArray(block.children)) return ''
      return block.children
        .filter((child: any) => child?._type === 'span')
        .map((child: any) => child.text || '')
        .join('')
    })
    .filter(Boolean)
    .join(' ')
}

export function FAQPageStructuredDataServer({ faqs }: { faqs: FAQItem[] }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => {
      const answerText = faq.answer
        ? extractTextFromPortableText(faq.answer as any[])
        : faq.shortAnswer || ''

      return {
        '@type': 'Question',
        name: faq.title,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answerText || faq.shortAnswer || '',
        },
      }
    }),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonStringify(structuredData) }}
    />
  )
}

import { client } from '@/sanity/lib/client'
import { FAQsQuery } from '@/sanity/lib/queries'
import FAQPageContent, { FAQDocument } from './FAQPageContent'
import { faqFallback } from '@/datas/faqFallback'

export default async function FAQPage() {
  let faqs: FAQDocument[] | null = null

  try {
    faqs = await client.fetch<FAQDocument[]>(FAQsQuery)
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Error fetching FAQs from Sanity:', message)
    } else {
      console.error('Error fetching FAQs from Sanity:', message)
    }

    if (message.includes('project user not found')) {
      try {
        const publicClient = client.withConfig({ token: undefined, useCdn: true })
        faqs = await publicClient.fetch<FAQDocument[]>(FAQsQuery)
      } catch (fallbackError) {
        const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : fallbackError
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Retrying FAQ fetch without token failed:', fallbackMessage)
        } else {
          console.error('Retrying FAQ fetch without token failed:', fallbackMessage)
        }
      }
    }
  }

  if (!faqs || faqs.length === 0) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('Using local FAQ fallback content.')
    }
    faqs = faqFallback
  }

  return <FAQPageContent faqs={faqs} />
}

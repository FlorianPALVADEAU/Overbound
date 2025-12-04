import type { Metadata } from 'next';
import { client } from '@/sanity/lib/client'
import { FAQsQuery } from '@/sanity/lib/queries'
import FAQPageContent, { FAQDocument } from './FAQPageContent'
import { faqFallback } from '@/datas/faqFallback'

export const metadata: Metadata = {
  title: "FAQ - Questions fréquentes sur les courses à obstacles | Overbound Race",
  description: "Toutes les réponses à vos questions sur les courses à obstacles Overbound : inscriptions, formats, tarifs, équipement requis, et préparation physique.",
  alternates: {
    canonical: 'https://overbound-race.com/about/faq'
  },
  openGraph: {
    title: "FAQ - Questions fréquentes | Overbound Race",
    description: "Tout savoir sur les courses d'obstacles Overbound : formats, inscriptions, préparation.",
    url: 'https://overbound-race.com/about/faq',
    siteName: 'Overbound Race',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "FAQ Overbound Race",
    description: "Questions fréquentes sur nos courses d'obstacles OCR.",
  }
};

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

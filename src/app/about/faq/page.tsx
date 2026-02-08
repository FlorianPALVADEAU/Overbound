import type { Metadata } from 'next';
import { client } from '@/sanity/lib/client'
import { FAQsQuery } from '@/sanity/lib/queries'
import FAQPageContent, { FAQDocument } from './FAQPageContent'
import { faqFallback } from '@/datas/faqFallback'
import { FAQPageStructuredDataServer } from '@/components/seo/FAQStructuredData'

export const metadata: Metadata = {
  title: "FAQ Course à Obstacles Paris 2026 | Questions Fréquentes Overbound",
  description: "Toutes les réponses sur les courses à obstacles Overbound Race Paris 2026 : inscriptions, formats (Origin, Horizon, Ultra Arena backyard), tarifs, équipement et préparation.",
  keywords: [
    "FAQ course obstacles",
    "questions course obstacles paris",
    "inscription overbound",
    "équipement OCR",
    "préparation course obstacles",
    "backyard obstacles FAQ",
    "ultra arena questions",
  ],
  alternates: {
    canonical: 'https://overbound-race.com/about/faq'
  },
  openGraph: {
    title: "FAQ Course à Obstacles Paris 2026 | Overbound Race",
    description: "Tout savoir sur les courses à obstacles Overbound : formats, inscriptions, backyard OCR et préparation.",
    url: 'https://overbound-race.com/about/faq',
    siteName: 'Overbound Race',
    images: [
      {
        url: '/images/hero_header_poster.jpg',
        width: 1200,
        height: 630,
        alt: 'FAQ Overbound Race - Course à obstacles Paris 2026',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "FAQ | Overbound Race Paris 2026",
    description: "Questions fréquentes sur nos courses à obstacles Paris 2026 et backyard OCR.",
    images: ['/images/hero_header_poster.jpg'],
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

  return (
    <>
      <FAQPageStructuredDataServer faqs={faqs} />
      <FAQPageContent faqs={faqs} />
    </>
  )
}

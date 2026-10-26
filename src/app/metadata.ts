import { ogImageUrl } from '@/lib/seo/ogImage'
import { Metadata } from "next";
import { FALLBACK_NEXT_EDITION, type NextEditionFacts } from '@/lib/seo/nextEdition'

export const buildBaseMetadata = (next: NextEditionFacts = FALLBACK_NEXT_EDITION): Metadata => ({
  title: "Overbound Race | Course à obstacles en boucles, Paris Île-de-France",
  description: `Overbound : la course à obstacles en boucles de 2 km, inspirée du backyard ultra. Deux formats, RANKED et OPEN, pour tous les niveaux. Prochaine édition ${next.window}.`,
  openGraph: {
    title: "Overbound Race | Course à obstacles en boucles, Paris Île-de-France",
    description: `Course à obstacles en boucles de 2 km en Île-de-France. Deux formats, RANKED et OPEN. Prochaine édition ${next.window}.`,
    url: 'https://overbound-race.com',
    siteName: 'Overbound Race',
    images: [
      {
        url: ogImageUrl({ title: 'Course à obstacles en boucles', kicker: 'Overbound · Paris', photo: 'crowd' }),
        width: 1200,
        height: 630,
        alt: 'Overbound Race - course à obstacles en boucles',
      }
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Overbound Race | Course à obstacles en boucles, Paris Île-de-France",
    description: `Course à obstacles en boucles de 2 km en Île-de-France. Deux formats, RANKED et OPEN. Prochaine édition ${next.window}.`,
    images: [ogImageUrl({ title: 'Course à obstacles en boucles', kicker: 'Overbound · Paris', photo: 'crowd' })],
  }
})

export const metadata: Metadata = buildBaseMetadata()

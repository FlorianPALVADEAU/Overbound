import { client } from '@/sanity/lib/client'
import { authorsWithCountsQuery } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 300

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'
const heroImage = `${siteUrl}/images/hero_header_poster.jpg`

export const metadata: Metadata = {
  title: 'Auteurs Blog OCR | Course à Obstacles Paris 2026 - Overbound Race',
  description:
    'Découvre les auteurs du blog Overbound Race : conseils OCR, préparation backyard à obstacles et course à obstacles Paris 2026.',
  alternates: {
    canonical: `${siteUrl}/blog/auteurs`,
  },
  openGraph: {
    title: 'Auteurs du Blog OCR | Overbound Race',
    description:
      'Les auteurs Overbound Race partagent leurs conseils OCR et préparation pour la course à obstacles Paris 2026.',
    url: `${siteUrl}/blog/auteurs`,
    siteName: 'Overbound Race',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: heroImage,
        width: 1200,
        height: 630,
        alt: 'Auteurs du blog Overbound Race',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Auteurs du Blog OCR | Overbound Race',
    description:
      'Découvre les auteurs Overbound Race et leurs conseils OCR pour la course à obstacles Paris 2026.',
    images: [heroImage],
  },
}

export default async function BlogAuthorsIndex() {
  const authors = await client.fetch(authorsWithCountsQuery)
  return (
    <main className="max-w-5xl mx-auto p-6 h-min-screen">
      <h1 className="text-3xl font-bold mb-6">Auteurs</h1>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {authors.map((a: any) => (
          <li key={a.slug} className="border rounded-xl p-4 flex items-center gap-3">
            {a.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urlFor(a.avatar).width(56).height(56).url()} alt="" className="w-14 h-14 rounded-full" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gray-200" />
            )}
            <div className="flex-1">
              <Link href={`/blog/auteur/${a.slug}`} className="font-semibold">
                {a.name}
              </Link>
              <div className="text-xs opacity-60">{a.count} article(s)</div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}

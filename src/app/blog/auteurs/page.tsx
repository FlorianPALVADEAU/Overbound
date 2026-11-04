import { COVER } from '@/constants/coverImages'
import { ogImageUrl } from '@/lib/seo/ogImage'
import { client } from '@/sanity/lib/client'
import { authorsWithCountsQuery } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { containerClass } from '@/components/ds'
import { PageHero } from '@/components/hero/PageHero'
import { cn } from '@/lib/utils'

export const revalidate = 300

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'
const heroImage = `${siteUrl}${ogImageUrl({ title: 'Les auteurs', kicker: 'Blog Overbound', photo: 'group' })}`

export const metadata: Metadata = {
  title: { absolute: 'Auteurs Blog OCR | Course à Obstacles Paris 2026 - Overbound Race' },
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
    <main className="min-h-screen bg-background text-foreground">
      <PageHero
        image={{ src: COVER.pages.blog, alt: 'Auteurs du blog OverBound', position: '50% 30%' }}
        title="Auteurs"
        description="Qui écrit les conseils et les actus de la tribu OverBound."
      />

      <div className={cn(containerClass(), 'py-16')}>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {authors.map((a: any) => (
            <li key={a.slug} className="border rounded-2xl">
              <Link href={`/blog/auteur/${a.slug}`} className="flex items-center gap-3 p-4">
                {a.avatar ? (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={urlFor(a.avatar).width(112).height(112).url()}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-14 w-14 shrink-0 rounded-full bg-muted" />
                )}
                <div className="flex-1">
                  <div className="font-semibold">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.count} article(s)</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}

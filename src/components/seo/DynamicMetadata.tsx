'use client'

import Head from 'next/head'

interface DynamicMetadataProps {
  title: string
  description: string
  keywords?: string[]
  image?: string
  url?: string
}

export function DynamicMetadata({ title, description, keywords, image, url }: DynamicMetadataProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://overbound-race.com'
  const fullTitle = `${title} | Overbound Race`
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl
  const imageUrl = image ? `${siteUrl}${image}` : `${siteUrl}/images/hero_header_poster.jpg`

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Head>
  )
}

'use client'

export function OrganizationStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    "name": "Overbound Race",
    "alternateName": ["Overbound", "Overbound OCR", "Backyard à Obstacles"],
    "url": process.env.NEXT_PUBLIC_SITE_URL || "https://overbound-race.com",
    "logo": `${process.env.NEXT_PUBLIC_SITE_URL || "https://overbound-race.com"}/images/LOGO_FULL.webp`,
    "description": "Overbound Race : première course à obstacles format backyard en France. Course obstacles Paris 2026, OCR personnalisable. Choisis ta distance et ta difficulté.",
    "email": "contact@overbound-race.com",
    "areaServed": {
      "@type": "Place",
      "name": "Paris et Île-de-France"
    },
    "sameAs": [
      "https://www.facebook.com/overbound.race/",
      "https://www.instagram.com/overbound.race/",
    ],
    "sport": "Obstacle Course Racing",
    "keywords": "course à obstacles paris, backyard à obstacles, OCR france 2026, overbound race"
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function EventStructuredData({ event }: { event: any }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": event.name,
    "description": event.description,
    "startDate": event.date,
    "location": {
      "@type": "Place",
      "name": event.location,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": event.city,
        "addressCountry": "FR"
      }
    },
    "organizer": {
      "@type": "Organization",
      "name": "Overbound Race",
      "url": process.env.NEXT_PUBLIC_SITE_URL || "https://overbound-race.com"
    },
    "offers": event.tickets?.map((ticket: any) => ({
      "@type": "Offer",
      "name": ticket.name,
      "price": ticket.price,
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock",
      "url": `${process.env.NEXT_PUBLIC_SITE_URL || "https://overbound-race.com"}/events/${event.slug}/register`
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function BlogPostStructuredData({ post }: { post: any }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt || post.description,
    "author": {
      "@type": "Person",
      "name": post.author?.name || "Overbound Race"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Overbound Race",
      "logo": {
        "@type": "ImageObject",
        "url": `${process.env.NEXT_PUBLIC_SITE_URL || "https://overbound-race.com"}/images/LOGO_FULL.webp`
      }
    },
    "datePublished": post.publishedAt,
    "dateModified": post.updatedAt || post.publishedAt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${process.env.NEXT_PUBLIC_SITE_URL || "https://overbound-race.com"}/blog/post/${post.slug}`
    },
    "image": post.mainImage ? [post.mainImage] : []
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function BreadcrumbStructuredData({ items }: { items: Array<{ name: string; url: string }> }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

function extractTextFromPortableText(blocks: any[]): string {
  if (!blocks || !Array.isArray(blocks)) return ''

  return blocks
    .filter((block) => block._type === 'block')
    .map((block) => {
      if (block.children && Array.isArray(block.children)) {
        return block.children
          .filter((child: any) => child._type === 'span')
          .map((child: any) => child.text || '')
          .join('')
      }
      return ''
    })
    .filter(Boolean)
    .join(' ')
}

export function FAQPageStructuredData({ faqs }: { faqs: Array<{ title: string; shortAnswer?: string; answer?: any }> }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => {
      const answerText = faq.answer
        ? extractTextFromPortableText(faq.answer)
        : faq.shortAnswer || ''

      return {
        "@type": "Question",
        "name": faq.title,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": answerText || faq.shortAnswer || ''
        }
      }
    })
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

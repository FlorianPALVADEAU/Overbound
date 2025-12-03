'use client'

export function OrganizationStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    "name": "Overbound Race",
    "url": process.env.NEXT_PUBLIC_SITE_URL || "https://overbound-race.com",
    "logo": `${process.env.NEXT_PUBLIC_SITE_URL || "https://overbound-race.com"}/images/LOGO_FULL.webp`,
    "description": "Première course d'obstacles (OCR) à parcours personnalisables en France. Événements sportifs en Normandie.",
    "email": "contact@overbound-race.com",
    "sameAs": [
      // Ajoutez vos réseaux sociaux ici
      // "https://www.facebook.com/overbound",
      // "https://www.instagram.com/overbound",
      // "https://www.youtube.com/@overbound"
    ],
    "sport": "Obstacle Course Racing"
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
      "url": `${process.env.NEXT_PUBLIC_SITE_URL || "https://overbound-race.com"}/events/${event.id}/register`
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

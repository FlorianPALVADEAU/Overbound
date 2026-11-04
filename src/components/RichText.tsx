import { urlFor } from '@/sanity/lib/image'
import { PortableText, PortableTextComponents } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'
import { DISPLAY_TITLE } from '@/components/ds/SectionHeader'
import { headingAnchor } from '@/lib/blog/articleToc'
import { cn } from '@/lib/utils'

/**
 * `default`: FAQ answers and other short rich text, with its own heading sizes.
 * `article`: blog body, styled by `.prose-overbound`. Headings get an anchor id for the table of contents.
 */
export type RichTextVariant = 'default' | 'article'

interface ImageValue {
  asset: { _ref: string; _type: string };
  alt?: string;
  caption?: string;
}

const ARTICLE_H2 = cn(DISPLAY_TITLE, 'mt-16 scroll-mt-28 text-display-md')
const ARTICLE_H3 = cn(DISPLAY_TITLE, 'mt-12 scroll-mt-28 text-title')

function buildComponents(variant: RichTextVariant): PortableTextComponents {
  const article = variant === 'article'

  return {
    types: {
      code: ({ value }) => (
        <pre className="bg-muted p-4 rounded-xl overflow-x-auto">
          <div className="text-xs opacity-60 mb-2">
            {value?.filename || value?.language?.toUpperCase?.() || 'code'}
          </div>
          <code>{value?.code}</code>
        </pre>
      ),
      image: ({ value }) => {
        const img = value as ImageValue
        const src = urlFor(img).width(1200).height(700).fit('max').url()
        return (
          <figure className="my-6">
            <img src={src} alt={img?.alt || ''} loading="lazy" decoding="async" className="rounded-xl w-full" />
            {img?.caption && <figcaption className="text-sm text-subtle mt-2 text-center">{img.caption}</figcaption>}
          </figure>
        )
      },
    },
    block: {
      h2: ({ children, value }) =>
        article ? (
          <h2 id={headingAnchor(value?._key ?? '')} className={ARTICLE_H2}>{children}</h2>
        ) : (
          <h2 className="text-2xl font-semibold mt-8 mb-3">{children}</h2>
        ),
      h3: ({ children }) =>
        article ? <h3 className={ARTICLE_H3}>{children}</h3> : <h3 className="text-xl font-semibold mt-6 mb-2">{children}</h3>,
      blockquote: ({ children }) =>
        article ? <blockquote>{children}</blockquote> : <blockquote className="border-l-4 pl-4 italic my-4">{children}</blockquote>,
    },
    marks: {
      link: ({ children, value }) => {
        const target = value?.blank ? '_blank' : undefined
        const href = typeof value?.href === 'string' ? value.href : ''
        const safeHref = (() => {
          const trimmed = href.trim()
          if (!trimmed) return '#'
          if (
            trimmed.startsWith('/') ||
            trimmed.startsWith('#') ||
            trimmed.startsWith('./') ||
            trimmed.startsWith('../')
          ) {
            return trimmed
          }
          try {
            const url = new URL(trimmed)
            return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? trimmed : '#'
          } catch {
            return '#'
          }
        })()
        return (
          <a href={safeHref} target={target} rel={target ? 'noopener noreferrer' : undefined} className="underline">
            {children}
          </a>
        )
      },
      code: ({ children }) => <code className="px-1 py-0.5 bg-muted rounded text-sm">{children}</code>,
    },
  }
}

const COMPONENTS: Record<RichTextVariant, PortableTextComponents> = {
  default: buildComponents('default'),
  article: buildComponents('article'),
}

// No client state here: rendered on the server, so the body ships no PortableText runtime to the browser.
export default function RichText({ value, variant = 'default' }: { value: PortableTextBlock[]; variant?: RichTextVariant }) {
  return <PortableText value={value} components={COMPONENTS[variant]} />
}

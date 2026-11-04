import Image from 'next/image'
import type { PortableTextBlock } from '@portabletext/types'
import RichText from '@/components/RichText'
import { DISPLAY_TITLE } from '@/components/ds/SectionHeader'
import { headingAnchor } from '@/lib/blog/articleToc'
import { cn } from '@/lib/utils'
import { urlFor } from '@/sanity/lib/image'

/** Custom sections of a post (Sanity `sections[]`). The accent is a legacy colour name, mapped to a token here. */
export interface ArticleSectionData {
  _key: string
  title?: string | null
  layout?: string | null
  accent?: string | null
  body?: PortableTextBlock[] | null
  image?: ArticleImage | null
}

interface ArticleImage {
  asset: { _ref: string; _type: string }
  alt?: string | null
  caption?: string | null
}

const ACCENT_RULE: Record<string, string> = {
  emerald: 'bg-primary',
  orange: 'bg-warning',
  neutral: 'bg-border',
}

const SECTION_CLASS = 'mt-16 scroll-mt-28'

export function ArticleSections({ sections }: { sections: ArticleSectionData[] }) {
  return (
    <>
      {sections.map((section) => (
        <ArticleSection key={section._key} section={section} />
      ))}
    </>
  )
}

function ArticleSection({ section }: { section: ArticleSectionData }) {
  const id = headingAnchor(section._key)
  const layout = section.layout ?? 'text'
  const body = section.body ?? []
  const hasImage = Boolean(section.image?.asset)

  if (layout === 'quote') {
    return (
      <figure id={id} className={cn(SECTION_CLASS, 'text-center')}>
        <span aria-hidden className="mx-auto block h-0.5 w-12 rounded-full bg-primary" />
        <blockquote className="mx-auto mt-6 max-w-2xl text-title font-medium leading-snug text-balance">
          <RichText value={body} variant="article" />
        </blockquote>
        {section.title ? (
          <figcaption className="mt-5 text-label font-semibold uppercase text-subtle">{section.title}</figcaption>
        ) : null}
      </figure>
    )
  }

  if (layout === 'highlight') {
    const rule = ACCENT_RULE[section.accent ?? 'emerald'] ?? ACCENT_RULE.emerald
    return (
      <section id={id} className={cn(SECTION_CLASS, 'rounded-2xl border border-border bg-card p-6 md:p-8')}>
        <span aria-hidden className={cn('mb-5 block h-1 w-12 rounded-full', rule)} />
        {section.title ? <h2 className={cn(DISPLAY_TITLE, 'text-title')}>{section.title}</h2> : null}
        <div className={cn('prose-overbound', section.title && 'mt-3')}>
          <RichText value={body} variant="article" />
        </div>
      </section>
    )
  }

  // The column is too narrow for side-by-side text and photo: the photo goes above (imageLeft) or below (imageRight) the text.
  const image = (layout === 'imageLeft' || layout === 'imageRight') && section.image && hasImage ? section.image : null
  const imageBefore = layout === 'imageLeft'

  return (
    <section id={id} className={SECTION_CLASS}>
      {image && imageBefore ? <ArticleFigure image={image} /> : null}
      {section.title ? <h2 className={cn(DISPLAY_TITLE, 'text-display-md')}>{section.title}</h2> : null}
      <div className={cn('prose-overbound', section.title && 'mt-6')}>
        <RichText value={body} variant="article" />
      </div>
      {image && !imageBefore ? <ArticleFigure image={image} /> : null}
    </section>
  )
}

/** Full-width photo of the reading column, with the optional caption centred under it. */
function ArticleFigure({ image }: { image: ArticleImage }) {
  const src = urlFor(image).width(1600).height(1000).fit('crop').url()
  return (
    <figure className="my-12">
      <div className="relative aspect-16/10 overflow-hidden rounded-2xl bg-muted">
        <Image
          src={src}
          alt={image.alt ?? ''}
          fill
          sizes="(min-width: 1280px) 704px, 100vw"
          className="object-cover"
        />
      </div>
      {image.caption ? <figcaption className="mt-3 text-center text-sm text-subtle">{image.caption}</figcaption> : null}
    </figure>
  )
}

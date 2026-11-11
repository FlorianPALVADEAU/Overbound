import Image from 'next/image'
import Link from 'next/link'
import { Fragment, type ReactNode } from 'react'
import { testimonialPosterUrl } from '@/lib/testimonials/testimonialPoster'

/**
 * A small, purpose-built Markdown renderer for blog content, instead of
 * pulling in next-mdx-remote + a remark/rehype chain for ~8 articles.
 * Supports exactly the block variety this content needs: headings,
 * paragraphs (bold/italic/links), lists, images with captions, pull quotes
 * and callout asides, rendered as plain editorial typography (border rule,
 * no card, no badge) rather than boxed UI chrome.
 *
 * Fenced block syntax:
 *   :::pullquote
 *   Texte de la citation.
 *   -- Attribution optionnelle
 *   :::
 *
 *   :::callout type=info|warning|success
 *   Texte du callout.
 *   :::
 *
 *   :::video
 *   src: /videos/feedbacks/feedback-julien.webm   (l'équivalent .mp4 est ajouté en repli)
 *   title: Description courte, lue par les lecteurs d'écran
 *   caption: Légende optionnelle
 *   :::
 */

type CalloutType = 'info' | 'warning' | 'success'

const CALLOUT_CLASS: Record<CalloutType, string> = {
  info: 'border-info',
  warning: 'border-warning',
  success: 'border-success',
}

export function slugifyHeading(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export interface BlogHeading {
  id: string
  text: string
}

/**
 * Scans the raw markdown for `## ` headings only (the level the table of
 * contents follows), using the same slugify logic as the h2 renderer below
 * so ids always match.
 */
export function extractHeadings(markdown: string): BlogHeading[] {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
  const seen = new Map<string, number>()
  const headings: BlogHeading[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('## ')) continue
    const text = trimmed.slice(3).trim()
    const base = slugifyHeading(text)
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    const id = count === 0 ? base : `${base}-${count}`
    headings.push({ id, text })
  }

  return headings
}

function sanitizeHref(href: string): string {
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
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  // Split on bold, italic and link patterns while keeping the delimiters,
  // then rebuild nodes left to right.
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g
  const parts = text.split(pattern).filter((part) => part !== '')

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`
    const boldMatch = part.match(/^\*\*([^*]+)\*\*$/)
    if (boldMatch) return <strong key={key}>{boldMatch[1]}</strong>

    const italicMatch = part.match(/^\*([^*]+)\*$/)
    if (italicMatch) return <em key={key}>{italicMatch[1]}</em>

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      const [, label, href] = linkMatch
      const safeHref = sanitizeHref(href)
      const isInternal = safeHref.startsWith('/') || safeHref.startsWith('#')
      return isInternal ? (
        <Link key={key} href={safeHref} className="text-primary underline-offset-2 hover:underline">
          {label}
        </Link>
      ) : (
        <a
          key={key}
          href={safeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-2 hover:underline"
        >
          {label}
        </a>
      )
    }

    return <Fragment key={key}>{part}</Fragment>
  })
}

interface ParsedImage {
  src: string
  alt: string
  caption?: string
}

function parseImageLine(line: string): ParsedImage | null {
  const match = line.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/)
  if (!match) return null
  const [, alt, src, caption] = match
  return { src, alt, caption }
}

function ImageBlock({ image, keyPrefix }: { image: ParsedImage; keyPrefix: string }) {
  return (
    <figure key={keyPrefix} className="my-8 overflow-hidden rounded-2xl border border-border bg-muted">
      <div className="relative aspect-[16/10]">
        <Image src={image.src} alt={image.alt} fill sizes="(min-width: 768px) 700px, 100vw" className="object-cover" />
      </div>
      {image.caption ? (
        <figcaption className="px-4 py-3 text-xs text-subtle">{image.caption}</figcaption>
      ) : null}
    </figure>
  )
}

interface ParsedVideo {
  src: string
  title: string
  caption?: string
}

function parseVideoFields(lines: string[]): ParsedVideo | null {
  const fields = new Map<string, string>()
  for (const line of lines) {
    const separator = line.indexOf(':')
    if (separator === -1) continue
    fields.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim())
  }
  const src = fields.get('src')
  // Only local, self-hosted videos: the poster and the mp4 fallback derive from this path.
  if (!src || !/^\/videos\/.+\.webm$/.test(src)) return null
  return { src, title: fields.get('title') ?? '', caption: fields.get('caption') }
}

function VideoBlock({ video, keyPrefix }: { video: ParsedVideo; keyPrefix: string }) {
  return (
    <figure key={keyPrefix} className="my-8">
      <video
        className="mx-auto aspect-9/16 max-h-[36rem] w-full max-w-sm rounded-2xl border border-border bg-surface-deep object-cover"
        controls
        playsInline
        preload="none"
        poster={testimonialPosterUrl(video.src)}
        aria-label={video.title || undefined}
      >
        <source src={video.src} type="video/webm" />
        <source src={video.src.replace(/\.webm$/, '.mp4')} type="video/mp4" />
      </video>
      {video.caption ? (
        <figcaption className="mx-auto mt-3 max-w-sm text-center text-xs text-subtle">{video.caption}</figcaption>
      ) : null}
    </figure>
  )
}

function PullQuoteBlock({ lines, keyPrefix }: { lines: string[]; keyPrefix: string }) {
  const attributionIndex = lines.findIndex((line) => line.trim().startsWith('--'))
  const quoteLines = attributionIndex === -1 ? lines : lines.slice(0, attributionIndex)
  const attribution = attributionIndex === -1 ? null : lines[attributionIndex].replace(/^--\s*/, '')

  return (
    <blockquote key={keyPrefix} className="my-10 text-center text-title font-display italic leading-snug text-foreground">
      {quoteLines.join(' ')}
      {attribution ? <footer className="mt-4 text-sm font-semibold text-subtle not-italic">{attribution}</footer> : null}
    </blockquote>
  )
}

function CalloutBlock({
  lines,
  calloutType,
  keyPrefix,
}: {
  lines: string[]
  calloutType: CalloutType
  keyPrefix: string
}) {
  return (
    <div key={keyPrefix} className={`my-8 space-y-3 border-l-2 pl-5 ${CALLOUT_CLASS[calloutType]}`}>
      {lines.map((line, index) => (
        <p key={`${keyPrefix}-line-${index}`}>
          {renderInline(line, `${keyPrefix}-line-${index}`)}
        </p>
      ))}
    </div>
  )
}

function ListBlock({ items, ordered, keyPrefix }: { items: string[]; ordered: boolean; keyPrefix: string }) {
  const Tag = ordered ? 'ol' : 'ul'
  return (
    <Tag key={keyPrefix}>
      {items.map((item, index) => (
        <li key={`${keyPrefix}-${index}`}>{renderInline(item, `${keyPrefix}-${index}`)}</li>
      ))}
    </Tag>
  )
}

/**
 * Renders the markdown body of a blog post into React nodes, using
 * design-system primitives (Card, Pill) and tokens rather than raw
 * Tailwind colors.
 */
export function renderBlogMarkdown(markdown: string): ReactNode[] {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
  const nodes: ReactNode[] = []
  const headingSlugSeen = new Map<string, number>()
  let i = 0
  let blockIndex = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      i += 1
      continue
    }

    // Fenced blocks: :::pullquote or :::callout type=info
    const fenceMatch = trimmed.match(/^:::(pullquote|callout|video)(?:\s+type=(\w+))?$/)
    if (fenceMatch) {
      const [, kind, typeRaw] = fenceMatch
      const bodyLines: string[] = []
      i += 1
      while (i < lines.length && lines[i].trim() !== ':::') {
        if (lines[i].trim()) bodyLines.push(lines[i].trim())
        i += 1
      }
      i += 1 // skip closing :::
      const key = `block-${blockIndex++}`
      if (kind === 'pullquote') {
        nodes.push(<PullQuoteBlock key={key} lines={bodyLines} keyPrefix={key} />)
      } else if (kind === 'video') {
        const video = parseVideoFields(bodyLines)
        if (video) nodes.push(<VideoBlock key={key} video={video} keyPrefix={key} />)
      } else {
        const calloutType: CalloutType = (['info', 'warning', 'success'] as CalloutType[]).includes(
          typeRaw as CalloutType,
        )
          ? (typeRaw as CalloutType)
          : 'info'
        nodes.push(<CalloutBlock key={key} lines={bodyLines} calloutType={calloutType} keyPrefix={key} />)
      }
      continue
    }

    // Image line
    const image = parseImageLine(trimmed)
    if (image) {
      nodes.push(<ImageBlock key={`block-${blockIndex}`} image={image} keyPrefix={`block-${blockIndex++}`} />)
      i += 1
      continue
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      nodes.push(
        <h3 key={`block-${blockIndex++}`} className="mt-10 mb-3 text-title font-display font-bold uppercase">
          {renderInline(trimmed.slice(4), `h3-${blockIndex}`)}
        </h3>,
      )
      i += 1
      continue
    }
    if (trimmed.startsWith('## ')) {
      const headingText = trimmed.slice(3).trim()
      const baseSlug = slugifyHeading(headingText)
      const seenCount = headingSlugSeen.get(baseSlug) ?? 0
      headingSlugSeen.set(baseSlug, seenCount + 1)
      const headingId = seenCount === 0 ? baseSlug : `${baseSlug}-${seenCount}`
      nodes.push(
        <h2
          key={`block-${blockIndex++}`}
          id={headingId}
          className="mt-12 mb-4 text-display-md font-display font-bold uppercase"
        >
          {renderInline(headingText, `h2-${blockIndex}`)}
        </h2>,
      )
      i += 1
      continue
    }

    // Lists (consume consecutive list lines)
    const isOrdered = /^\d+\.\s+/.test(trimmed)
    const isUnordered = /^[-*]\s+/.test(trimmed)
    if (isOrdered || isUnordered) {
      const items: string[] = []
      while (i < lines.length) {
        const current = lines[i].trim()
        if (isOrdered && /^\d+\.\s+/.test(current)) {
          items.push(current.replace(/^\d+\.\s+/, ''))
          i += 1
        } else if (isUnordered && /^[-*]\s+/.test(current)) {
          items.push(current.replace(/^[-*]\s+/, ''))
          i += 1
        } else {
          break
        }
      }
      const key = `block-${blockIndex++}`
      nodes.push(<ListBlock key={key} items={items} ordered={isOrdered} keyPrefix={key} />)
      continue
    }

    // Blockquote (simple, non pull-quote)
    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().slice(2))
        i += 1
      }
      const key = `block-${blockIndex++}`
      nodes.push(
        <blockquote key={key}>
          {renderInline(quoteLines.join(' '), key)}
        </blockquote>,
      )
      continue
    }

    // Default paragraph: merge consecutive non-empty, non-special lines
    const paraLines: string[] = [trimmed]
    i += 1
    while (i < lines.length && lines[i].trim() && !/^(#{2,3}\s|[-*]\s|\d+\.\s|>\s|:::|!\[)/.test(lines[i].trim())) {
      paraLines.push(lines[i].trim())
      i += 1
    }
    const key = `block-${blockIndex++}`
    nodes.push(
      <p key={key}>
        {renderInline(paraLines.join(' '), key)}
      </p>,
    )
  }

  return nodes
}

/**
 * Sommaire d'un article de blog. Les ancres viennent de la clé Sanity (`_key`) :
 * stables et uniques dans un article, sans dépendre du titre.
 */

export interface ArticleHeading {
  id: string
  title: string
}

export function headingAnchor(key: string): string {
  return `titre-${key.replace(/[^a-zA-Z0-9_-]/g, '')}`
}

interface SectionLike {
  _key?: string
  title?: string | null
  layout?: string | null
}

interface BlockLike {
  _type?: string
  _key?: string
  style?: string
  children?: Array<{ text?: string }>
}

interface ArticleContent {
  sections?: SectionLike[] | null
  body?: BlockLike[] | null
}

/**
 * Sections when the article has them (same rule as the page), otherwise the h2
 * blocks of the body. A quote's title is an attribution, not a heading.
 */
export function buildArticleToc({ sections, body }: ArticleContent): ArticleHeading[] {
  if (Array.isArray(sections) && sections.length > 0) {
    return sections.flatMap((section) => {
      const title = section.title?.trim()
      if (!section._key || !title || section.layout === 'quote') return []
      return [{ id: headingAnchor(section._key), title }]
    })
  }

  if (!Array.isArray(body)) return []

  return body.flatMap((block) => {
    if (block._type !== 'block' || block.style !== 'h2' || !block._key) return []
    const title = (block.children ?? []).map((child) => child.text ?? '').join('').trim()
    return title ? [{ id: headingAnchor(block._key), title }] : []
  })
}

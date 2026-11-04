import { describe, expect, it } from 'vitest'

import { buildArticleToc, headingAnchor } from '@/lib/blog/articleToc'

describe('headingAnchor', () => {
  it('builds a stable id from a Sanity key', () => {
    expect(headingAnchor('a1b2c3')).toBe('titre-a1b2c3')
  })

  it('strips characters that are unsafe in an id', () => {
    expect(headingAnchor('a b/c#d')).toBe('titre-abcd')
  })
})

describe('buildArticleToc', () => {
  it('lists titled sections in order, skipping quotes and untitled sections', () => {
    const toc = buildArticleToc({
      sections: [
        { _key: 'k1', title: 'Le concept', layout: 'text' },
        { _key: 'k2', title: 'Citation', layout: 'quote' },
        { _key: 'k3', title: '   ', layout: 'text' },
        { _key: 'k4', title: 'Les obstacles', layout: 'highlight' },
      ],
    })

    expect(toc).toEqual([
      { id: 'titre-k1', title: 'Le concept' },
      { id: 'titre-k4', title: 'Les obstacles' },
    ])
  })

  it('falls back to h2 blocks of the body when there are no sections', () => {
    const toc = buildArticleToc({
      sections: [],
      body: [
        { _type: 'block', _key: 'b1', style: 'normal', children: [{ text: 'Intro' }] },
        { _type: 'block', _key: 'b2', style: 'h2', children: [{ text: 'Préparer ' }, { text: 'sa boucle' }] },
        { _type: 'block', _key: 'b3', style: 'h3', children: [{ text: 'Détail' }] },
      ],
    })

    expect(toc).toEqual([{ id: 'titre-b2', title: 'Préparer sa boucle' }])
  })

  it('returns an empty list when the article has no headings', () => {
    expect(buildArticleToc({ sections: null, body: null })).toEqual([])
    expect(buildArticleToc({ sections: [], body: [] })).toEqual([])
  })

  it('ignores a section without a key, since its anchor could not be built', () => {
    const toc = buildArticleToc({ sections: [{ title: 'Sans clé', layout: 'text' }] })

    expect(toc).toEqual([])
  })
})

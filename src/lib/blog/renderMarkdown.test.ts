import { describe, expect, it } from 'vitest'
import { extractHeadings, slugifyHeading } from './renderMarkdown'

describe('slugifyHeading', () => {
  it('strips accents and hyphenates French text', () => {
    expect(slugifyHeading('Étape 3 : choisir ton créneau (format OPEN uniquement)')).toBe(
      'etape-3-choisir-ton-creneau-format-open-uniquement',
    )
  })

  it('returns an empty string for a heading with only punctuation', () => {
    expect(slugifyHeading('???')).toBe('')
  })
})

describe('extractHeadings', () => {
  it('collects only level-2 headings in order, ignoring h3 and body text', () => {
    const markdown = [
      '## Le format OPEN',
      'Un paragraphe.',
      '### Un sous-titre',
      '## Le format RANKED',
    ].join('\n')

    expect(extractHeadings(markdown)).toEqual([
      { id: 'le-format-open', text: 'Le format OPEN' },
      { id: 'le-format-ranked', text: 'Le format RANKED' },
    ])
  })

  it('disambiguates duplicate heading text with a numeric suffix', () => {
    const markdown = ['## Résumé', '## Résumé'].join('\n')

    expect(extractHeadings(markdown)).toEqual([
      { id: 'resume', text: 'Résumé' },
      { id: 'resume-1', text: 'Résumé' },
    ])
  })
})

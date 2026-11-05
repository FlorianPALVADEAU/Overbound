import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { renderBlogMarkdown } from './renderMarkdown'

describe('renderBlogMarkdown', () => {
  it('renders headings, paragraphs and inline formatting', () => {
    const { container } = render(<>{renderBlogMarkdown('## Titre\n\nUn texte avec **gras** et *italique*.')}</>)
    expect(container.querySelector('h2')?.textContent).toBe('Titre')
    expect(container.querySelector('strong')?.textContent).toBe('gras')
    expect(container.querySelector('em')?.textContent).toBe('italique')
  })

  it('renders a pullquote block with attribution', () => {
    const { container } = render(
      <>{renderBlogMarkdown(':::pullquote\nUne citation marquante.\n-- Une source\n:::')}</>,
    )
    expect(container.querySelector('blockquote')?.textContent).toContain('Une citation marquante.')
    expect(container.textContent).toContain('Une source')
  })

  it('renders a callout block with its type label', () => {
    const { container } = render(<>{renderBlogMarkdown(':::callout type=warning\nAttention à ceci.\n:::')}</>)
    expect(container.textContent).toContain('Attention')
    expect(container.textContent).toContain('Attention à ceci.')
  })

  it('renders an unordered list', () => {
    const { container } = render(<>{renderBlogMarkdown('- premier\n- second')}</>)
    const items = container.querySelectorAll('ul li')
    expect(items).toHaveLength(2)
    expect(items[0].textContent).toBe('premier')
  })

  it('falls back to an info callout for an unknown callout type instead of throwing', () => {
    expect(() => render(<>{renderBlogMarkdown(':::callout type=bogus\nTexte.\n:::')}</>)).not.toThrow()
  })
})

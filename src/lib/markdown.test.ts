import { describe, expect, it } from 'vitest'

import { markdownToHtml } from '@/lib/markdown'

describe('markdownToHtml', () => {
  it('renders headings, paragraphs, inline elements and horizontal rules', () => {
    const input = `# Heading

Paragraph with **bold** text, *italic* words and a [link](https://example.com).
---
Another paragraph line.
Still same paragraph.`

    const expected = [
      '<h1>Heading</h1>',
      '<p>Paragraph with <strong>bold</strong> text, <em>italic</em> words and a <a href="https://example.com">link</a>.</p>',
      '<hr />',
      '<p>Another paragraph line. Still same paragraph.</p>',
    ].join('\n')

    expect(markdownToHtml(input)).toBe(expected)
  })

  it('builds unordered lists and converts literal \\n sequences into real newlines', () => {
    const input =
      'Intro line\\nSecond line\n\n- First entry\n* Second entry with **bold**\n\nParagraph after list'

    const expected = [
      '<p>Intro line Second line</p>',
      '<ul><li>First entry</li><li>Second entry with <strong>bold</strong></li></ul>',
      '<p>Paragraph after list</p>',
    ].join('\n')

    expect(markdownToHtml(input)).toBe(expected)
  })

  it('escapes HTML-sensitive characters before applying inline formatting', () => {
    const input = `## Title & <div>

Line with <script>alert("x")</script> and **bold** text.`

    const expected = [
      '<h2>Title &amp; &lt;div&gt;</h2>',
      '<p>Line with &lt;script&gt;alert("x")&lt;/script&gt; and <strong>bold</strong> text.</p>',
    ].join('\n')

    expect(markdownToHtml(input)).toBe(expected)
  })
})

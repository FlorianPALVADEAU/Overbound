// Minimal markdown -> HTML for titles, paragraphs, links, hr and basic lists
export function markdownToHtml(md: string): string {
  if (!md) return ''
  let text = md.replace(/\r\n?/g, '\n')
  // Convert literal "\n" sequences into real newlines (for JSONs that contain escaped newlines)
  text = text.replace(/\\n/g, '\n')

  // Escape angle brackets to avoid accidental HTML injection
  text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Inline replacements: bold, italics, links
  const inline = (s: string) =>
    s
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  const lines = text.split('\n')
  const htmlParts: string[] = []
  let listBuffer: string[] = []

  const flushList = () => {
    if (listBuffer.length) {
      htmlParts.push('<ul>' + listBuffer.map((li) => `<li>${inline(li)}</li>`).join('') + '</ul>')
      listBuffer = []
    }
  }

  let paraBuffer: string[] = []
  const flushPara = () => {
    if (paraBuffer.length) {
      const content = inline(paraBuffer.join(' ').trim())
      if (content) htmlParts.push(`<p>${content}</p>`)
      paraBuffer = []
    }
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      flushList()
      flushPara()
      continue
    }

    // headings
    if (line.startsWith('### ')) {
      flushList(); flushPara()
      htmlParts.push(`<h3>${inline(line.slice(4))}</h3>`) 
      continue
    }
    if (line.startsWith('## ')) {
      flushList(); flushPara()
      htmlParts.push(`<h2>${inline(line.slice(3))}</h2>`) 
      continue
    }
    if (line.startsWith('# ')) {
      flushList(); flushPara()
      htmlParts.push(`<h1>${inline(line.slice(2))}</h1>`) 
      continue
    }

    // horizontal rule
    if (/^-{3,}$/.test(line)) {
      flushList(); flushPara()
      htmlParts.push('<hr />')
      continue
    }

    // unordered list
    if (/^[*-]\s+/.test(line)) {
      flushPara()
      listBuffer.push(line.replace(/^[*-]\s+/, ''))
      continue
    }

    // default paragraph merge
    paraBuffer.push(line)
  }

  flushList(); flushPara()
  return htmlParts.join('\n')
}

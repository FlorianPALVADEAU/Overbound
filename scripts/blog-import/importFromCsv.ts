/*
  Usage: ts-node scripts/blog-import/importFromCsv.ts ./posts.csv
  CSV headers: title,slug,excerpt,date,image,author,categories,body
*/
import fs from 'node:fs'
import path from 'node:path'
import { sanity, uploadImageFromUrl, upsertBySlug } from './sanityClient'

function parseCsv(text: string): Record<string, string>[] {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean)
  const headers = headerLine.split(',').map((h) => h.trim())
  return lines.map((line) => {
    // naive CSV; use a library for complex cases
    const cols = line.split(',').map((c) => c.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, i) => (row[h] = cols[i] || ''))
    return row
  })
}

function toSlug(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function main() {
  const file = process.argv[2]
  if (!file) {
    console.error('Provide CSV file path')
    process.exit(1)
  }
  const text = fs.readFileSync(path.resolve(file), 'utf8')
  const rows = parseCsv(text)

  for (const r of rows) {
    const title = r.title
    if (!title) continue
    const slug = r.slug || toSlug(title)
    const _id = `post-${slug}`
    const mainImage = await uploadImageFromUrl(r.image)

    let authorRef
    if (r.author) {
      authorRef = await upsertBySlug('author', r.author, toSlug(r.author))
    }

    let categoryRefs
    const cats = r.categories ? r.categories.split('|').map((s) => s.trim()).filter(Boolean) : []
    if (cats.length) {
      categoryRefs = [] as any[]
      for (const c of cats) {
        categoryRefs.push(await upsertBySlug('category', c, toSlug(c)))
      }
    }

    await sanity.createOrReplace({
      _id,
      _type: 'post',
      title,
      slug: { _type: 'slug', current: slug },
      excerpt: r.excerpt || undefined,
      publishedAt: r.date || new Date().toISOString(),
      mainImage,
      author: authorRef,
      categories: categoryRefs,
      body: r.body
        ? [
            {
              _type: 'block',
              style: 'normal',
              children: [{ _type: 'span', text: r.body.replace(/<[^>]+>/g, '') }],
            },
          ]
        : [],
    })

    console.log(`Imported: ${slug}`)
  }

  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

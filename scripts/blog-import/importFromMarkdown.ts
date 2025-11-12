/*
  Usage: ts-node scripts/blog-import/importFromMarkdown.ts ./content
  Each .md file with frontmatter: title, slug(optional), excerpt, date, image, author, categories(array or comma string)
*/
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { sanity, uploadImageFromUrl, upsertBySlug } from './sanityClient'

function toSlug(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function importFile(filePath: string) {
  const file = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(file)
  const title = data.title as string
  if (!title) return
  const slug = (data.slug as string) || toSlug(title)
  const _id = `post-${slug}`
  const mainImage = await uploadImageFromUrl(data.image as string | undefined)

  let authorRef
  if (data.author) {
    const author = String(data.author)
    authorRef = await upsertBySlug('author', author, toSlug(author))
  }

  let categoryRefs
  const cats = Array.isArray(data.categories)
    ? (data.categories as string[])
    : data.categories
    ? String(data.categories).split(',')
    : []
  if (cats.length) {
    categoryRefs = [] as any[]
    for (const c of cats) {
      const name = String(c).trim()
      if (!name) continue
      categoryRefs.push(await upsertBySlug('category', name, toSlug(name)))
    }
  }

  await sanity.createOrReplace({
    _id,
    _type: 'post',
    title,
    slug: { _type: 'slug', current: slug },
    excerpt: data.excerpt as string | undefined,
    publishedAt: (data.date as string) || new Date().toISOString(),
    mainImage,
    author: authorRef,
    categories: categoryRefs,
    body: content
      ? [
          {
            _type: 'block',
            style: 'normal',
            children: [{ _type: 'span', text: content }],
          },
        ]
      : [],
  })

  console.log(`Imported: ${slug}`)
}

async function main() {
  const folder = process.argv[2]
  if (!folder) {
    console.error('Provide content folder')
    process.exit(1)
  }
  const abs = path.resolve(folder)
  const files = fs.readdirSync(abs).filter((f) => f.endsWith('.md'))
  for (const f of files) {
    await importFile(path.join(abs, f))
  }
  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

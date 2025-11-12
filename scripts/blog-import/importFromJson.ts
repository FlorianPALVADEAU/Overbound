/*
  Usage: ts-node scripts/blog-import/importFromJson.ts ./posts.json
  JSON Array fields: title, slug, excerpt, date, image, author, categories (comma string or string[]), body (HTML or markdown)
*/
import fs from 'node:fs'
import path from 'node:path'
import { sanity, uploadImageFromUrl, upsertBySlug } from './sanityClient'

type InputPost = {
  title: string
  slug?: string
  excerpt?: string
  date?: string
  image?: string
  author?: string
  categories?: string[] | string
  body?: string
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
    console.error('Provide JSON file path')
    process.exit(1)
  }
  const content = fs.readFileSync(path.resolve(file), 'utf8')
  const items: InputPost[] = JSON.parse(content)

  for (const it of items) {
    const slug = it.slug || toSlug(it.title)
    const _id = `post-${slug}`
    const mainImage = await uploadImageFromUrl(it.image)

    let authorRef
    if (it.author) {
      authorRef = await upsertBySlug('author', it.author, toSlug(it.author))
    }

    let categoryRefs
    const cats = Array.isArray(it.categories)
      ? it.categories
      : typeof it.categories === 'string'
      ? it.categories.split(',').map(s => s.trim()).filter(Boolean)
      : []
    if (cats.length) {
      categoryRefs = [] as any[]
      for (const c of cats) {
        categoryRefs.push(await upsertBySlug('category', c, toSlug(c)))
      }
    }

    await sanity.createOrReplace({
      _id,
      _type: 'post',
      title: it.title,
      slug: { _type: 'slug', current: slug },
      excerpt: it.excerpt,
      publishedAt: it.date || new Date().toISOString(),
      mainImage,
      author: authorRef,
      categories: categoryRefs,
      // For simplicity, store body as a single block from HTML/markdown string
      body: it.body
        ? [
            {
              _type: 'block',
              style: 'normal',
              children: [{ _type: 'span', text: it.body.replace(/<[^>]+>/g, '') }],
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

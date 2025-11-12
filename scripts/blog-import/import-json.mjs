// Pure Node ESM script: no ts-node, no TypeScript.
// Usage:
//   env $(cat .env.local | xargs) node scripts/blog-import/import-json.mjs sanity/blogSeed/content.json

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@sanity/client'

// Ensure env
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_TOKEN
if (!projectId || !dataset || !token) {
  console.error('Missing env: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_TOKEN')
  process.exit(1)
}

const sanity = createClient({ projectId, dataset, token, apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-08-16', useCdn: false })

function toSlug(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function uploadImageFromUrl(url) {
  if (!url) return undefined
  try {
    const res = await fetch(url)
    if (!res.ok) return undefined
    const buf = Buffer.from(await res.arrayBuffer())
    const asset = await sanity.assets.upload('image', buf, { filename: url.split('/').pop() || 'image' })
    return { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
  } catch (e) {
    return undefined
  }
}

async function upsertBySlug(docType, title, slug) {
  const _id = `${docType}-${slug}`
  await sanity.createIfNotExists({ _id, _type: docType, title: title, name: title, slug: { _type: 'slug', current: slug } })
  return { _type: 'reference', _ref: _id }
}

async function main() {
  const file = process.argv[2]
  if (!file) {
    console.error('Provide JSON file path')
    process.exit(1)
  }
  const abs = path.resolve(fileURLToPath(import.meta.url), '..', '..', '..', file)
  const exists = fs.existsSync(abs) ? abs : path.resolve(file)
  const content = fs.readFileSync(exists, 'utf8')
  let items
  try {
    items = JSON.parse(content)
  } catch (e) {
    console.error('Invalid JSON: ', e.message)
    process.exit(1)
  }
  if (!Array.isArray(items)) {
    console.error('JSON must be an array of posts')
    process.exit(1)
  }

  for (const it of items) {
    const title = it.title
    if (!title) {
      console.warn('Skipping item without title')
      continue
    }
    const slug = it.slug || toSlug(title)
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
      ? it.categories.split(',').map((s) => s.trim()).filter(Boolean)
      : []
    if (cats.length) {
      categoryRefs = []
      for (const c of cats) {
        const slugC = toSlug(c)
        categoryRefs.push(await upsertBySlug('category', c, slugC))
      }
    }

    const bodyString = typeof it.body === 'string' ? it.body.replace(/\\n/g, '\n') : ''
    const bodyBlocks = bodyString
      ? [
          {
            _type: 'block',
            style: 'normal',
            children: [{ _type: 'span', text: String(bodyString).replace(/<[^>]+>/g, '') }],
          },
        ]
      : []

    await sanity.createOrReplace({
      _id,
      _type: 'post',
      title,
      slug: { _type: 'slug', current: slug },
      excerpt: it.excerpt || undefined,
      publishedAt: it.date || new Date().toISOString(),
      mainImage,
      author: authorRef,
      categories: categoryRefs,
      body: bodyBlocks,
    })
    console.log(`Imported: ${slug}`)
  }

  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

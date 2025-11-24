/*
  Usage: ts-node scripts/blog-import/importBlogContent.ts
  Imports all blog posts from sanity/blogSeed/content.json to Sanity
*/
import fs from 'node:fs'
import path from 'node:path'
import { uploadImageFromUrl, upsertBySlug, sanity } from './sanityClient.js'

type InputPost = {
  title: string
  slug: string
  excerpt?: string
  date: string
  image?: string
  author?: string
  categories?: string[]
  seo_keywords?: string[]
  references?: Array<{ label: string; url: string }>
  body: string
  sections?: Array<{
    title: string
    layout: 'text' | 'imageLeft' | 'imageRight' | 'highlight' | 'quote'
    accent: 'emerald' | 'orange' | 'neutral'
    body: string
    image?: string
  }>
}

function toSlug(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Convert markdown text to Sanity block content
function markdownToBlocks(markdown: string) {
  if (!markdown) return []

  const lines = markdown.split('\n')
  const blocks: any[] = []

  let currentBlock: any = null

  for (const line of lines) {
    const trimmed = line.trim()

    // Headers
    if (trimmed.startsWith('# ')) {
      if (currentBlock) blocks.push(currentBlock)
      currentBlock = {
        _type: 'block',
        style: 'h1',
        children: [{ _type: 'span', text: trimmed.slice(2) }],
      }
    } else if (trimmed.startsWith('## ')) {
      if (currentBlock) blocks.push(currentBlock)
      currentBlock = {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: trimmed.slice(3) }],
      }
    } else if (trimmed.startsWith('### ')) {
      if (currentBlock) blocks.push(currentBlock)
      currentBlock = {
        _type: 'block',
        style: 'h3',
        children: [{ _type: 'span', text: trimmed.slice(4) }],
      }
    } else if (trimmed.startsWith('> ')) {
      // Blockquote
      if (currentBlock) blocks.push(currentBlock)
      currentBlock = {
        _type: 'block',
        style: 'blockquote',
        children: [{ _type: 'span', text: trimmed.slice(2) }],
      }
    } else if (trimmed === '---') {
      // Separator - skip
      continue
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      // List item - simplified
      if (currentBlock && currentBlock.listItem !== 'bullet') {
        blocks.push(currentBlock)
        currentBlock = null
      }
      if (currentBlock) {
        blocks.push(currentBlock)
      }
      currentBlock = {
        _type: 'block',
        style: 'normal',
        listItem: 'bullet',
        children: [{ _type: 'span', text: trimmed.slice(2) }],
      }
    } else if (trimmed === '') {
      // Empty line - finalize current block
      if (currentBlock) {
        blocks.push(currentBlock)
        currentBlock = null
      }
    } else {
      // Normal paragraph
      if (currentBlock && currentBlock.style !== 'normal') {
        blocks.push(currentBlock)
        currentBlock = null
      }
      if (!currentBlock) {
        currentBlock = {
          _type: 'block',
          style: 'normal',
          children: [{ _type: 'span', text: trimmed }],
        }
      } else {
        // Continue existing paragraph
        currentBlock.children[0].text += ' ' + trimmed
      }
    }
  }

  if (currentBlock) blocks.push(currentBlock)

  return blocks
}

async function main() {
  const contentPath = path.resolve(__dirname, '../../sanity/blogSeed/content.json')

  if (!fs.existsSync(contentPath)) {
    console.error(`File not found: ${contentPath}`)
    process.exit(1)
  }

  const content = fs.readFileSync(contentPath, 'utf8')
  const items: InputPost[] = JSON.parse(content)

  console.log(`Found ${items.length} posts to import...\n`)

  for (const it of items) {
    const slug = it.slug || toSlug(it.title)
    const _id = `post-${slug}`

    console.log(`Importing: ${slug}`)

    // Upload main image
    const mainImage = await uploadImageFromUrl(it.image)

    // Create or get author reference
    let authorRef
    if (it.author) {
      authorRef = await upsertBySlug('author', it.author, toSlug(it.author))
    }

    // Create or get category references
    let categoryRefs
    if (it.categories && it.categories.length > 0) {
      categoryRefs = []
      for (const cat of it.categories) {
        categoryRefs.push(await upsertBySlug('category', cat, toSlug(cat)))
      }
    }

    // Convert sections
    let sections
    if (it.sections && it.sections.length > 0) {
      sections = []
      for (const section of it.sections) {
        const sectionData: any = {
          _type: 'articleSection',
          _key: `section-${Math.random().toString(36).substr(2, 9)}`,
          title: section.title,
          layout: section.layout,
          accent: section.accent,
          body: markdownToBlocks(section.body),
        }

        // Upload section image if exists
        if (section.image) {
          sectionData.image = await uploadImageFromUrl(section.image)
        }

        sections.push(sectionData)
      }
    }

    // Create or replace the post
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
      body: markdownToBlocks(it.body),
      sections,
    })

    console.log(`✓ Imported: ${slug}\n`)
  }

  console.log('✓ Done! All posts have been imported to Sanity.')
}

main().catch((e) => {
  console.error('Error:', e)
  process.exit(1)
})

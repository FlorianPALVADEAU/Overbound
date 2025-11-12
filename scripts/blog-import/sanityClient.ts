import 'dotenv/config'
import { createClient } from '@sanity/client'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_TOKEN

if (!projectId || !dataset) {
  throw new Error(
    'Missing Sanity env. Set NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET before running import scripts.'
  )
}
if (!token) {
  console.warn('Warning: SANITY_API_TOKEN is missing — uploads/writes will fail.')
}

export const sanity = createClient({
  projectId,
  dataset,
  token,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-08-16',
  useCdn: false,
})

export async function uploadImageFromUrl(url?: string) {
  if (!url) return undefined
  try {
    const res = await fetch(url)
    if (!res.ok) return undefined
    const buf = Buffer.from(await res.arrayBuffer())
    const asset = await sanity.assets.upload('image', buf, { filename: url.split('/').pop() || 'image' })
    return { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
  } catch {
    return undefined
  }
}

export async function upsertBySlug(docType: string, title: string, slug: string) {
  const _id = `${docType}-${slug}`
  await sanity.createIfNotExists({ _id, _type: docType, title, slug: { _type: 'slug', current: slug } })
  return { _type: 'reference', _ref: _id }
}

import { defineLive } from 'next-sanity/live'
import { client } from './client'

const serverToken =
  process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_TOKEN
const browserToken = process.env.NEXT_PUBLIC_SANITY_API_READ_TOKEN

export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: serverToken && serverToken.trim().length > 0 ? serverToken : undefined,
  browserToken:
    browserToken && browserToken.trim().length > 0 ? browserToken : undefined,
})

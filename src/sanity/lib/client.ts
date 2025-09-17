import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: typeof window !== 'undefined', // Use CDN only on the client to avoid CORS issues
  token: process.env.SANITY_API_TOKEN,
})
import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

const token = process.env.SANITY_API_TOKEN

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: !token,
  token: token && token.trim().length > 0 ? token : undefined,
  perspective: 'published',
})

import { cache } from 'react'
import { loadFeaturedEvent } from '@/lib/events/loadFeaturedEvent'
import { FALLBACK_NEXT_EDITION, resolveNextEdition, type NextEditionFacts } from './nextEdition'

/** Next edition facts from the featured event; the fallback window if none or on a read error. */
export const loadNextEdition = cache(async (): Promise<NextEditionFacts> => {
  try {
    const { event } = await loadFeaturedEvent()
    return resolveNextEdition(event)
  } catch {
    return FALLBACK_NEXT_EDITION
  }
})

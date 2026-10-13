import type { ReactNode } from 'react'
import ObstaclesPageContent from './_page-content'
import { ObstaclesSeed } from './ObstaclesSeed'
import { FeaturedEventSeed } from '@/components/homepage/FeaturedEventSeed'
import { loadPublicObstacles } from '@/lib/obstacles/loadPublicObstacles'
import { loadFeaturedEvent } from '@/lib/events/loadFeaturedEvent'

// Rendered on the server so the catalogue is in the HTML; regenerated at
// most every minute.
export const revalidate = 60

export default async function ObstaclesPage() {
  // A failed read falls back to the browser fetch.
  const [obstacles, featured] = await Promise.all([
    loadPublicObstacles().catch(() => null),
    loadFeaturedEvent().catch(() => null),
  ])

  let content: ReactNode = <ObstaclesPageContent />
  if (obstacles) content = <ObstaclesSeed data={obstacles}>{content}</ObstaclesSeed>
  if (featured) content = <FeaturedEventSeed data={featured}>{content}</FeaturedEventSeed>
  return content
}

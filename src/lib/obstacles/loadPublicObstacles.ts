import { supabaseAdmin } from '@/lib/supabase/server'
import { isPublicObstacleVisible } from '@/lib/obstaclesVisibility'
import type { Obstacle } from '@/types/Obstacle'

/**
 * Server-side read of the obstacles shown publicly. Shared by
 * `/api/obstacles` and the `/obstacles` page, which renders the catalogue
 * into the HTML. Throws on a database error.
 */
export async function loadPublicObstacles(): Promise<Obstacle[]> {
  const { data, error } = await supabaseAdmin().from('obstacles').select('*')

  if (error) throw error
  return ((data ?? []) as Obstacle[]).filter((obstacle) => isPublicObstacleVisible(obstacle?.name))
}

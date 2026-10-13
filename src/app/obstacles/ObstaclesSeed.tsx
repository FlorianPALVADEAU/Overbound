'use client'

import type { ReactNode } from 'react'
import { useSeedQueryData } from '@/hooks/useSeedQueryData'
import { OBSTACLES_QUERY_KEY } from '@/app/api/obstacles/obstaclesQueries'
import type { Obstacle } from '@/types/Obstacle'

/** Seeds the server-read obstacles so the catalogue is in the HTML. */
export function ObstaclesSeed({ data, children }: { data: Obstacle[]; children: ReactNode }) {
  useSeedQueryData(OBSTACLES_QUERY_KEY, data)
  return children
}

import { RaceType, TargetPublic, Timestamp, UUID } from './base.type'
import type { Obstacle } from './Obstacle'

export interface RaceObstacle {
  order_position: number
  is_mandatory: boolean
  obstacle: Obstacle
}

export interface Race {
  id: UUID
  name: string
  logo_url?: string | null
  type: RaceType
  difficulty: number
  target_public: TargetPublic
  distance_km: number | null
  description?: string | null
  is_universal: boolean // True for single-format races (Kids, Backyard), false for multi-format (Primal/Fury/Ultra Hardcore)
  created_at: Timestamp
  updated_at: Timestamp
  obstacles?: RaceObstacle[] | null
}

export interface RaceFilters {
  type?: RaceType[]
  difficulty_min?: number
  difficulty_max?: number
  target_public?: TargetPublic[]
  distance_min?: number
  distance_max?: number
}

  import { RaceType, TargetPublic, Timestamp, UUID } from "./base.type";

export interface Race {
  id: UUID;
  name: string;
  logo_url: string | null;
  type: RaceType;
  difficulty: number; // 1-10
  target_public: TargetPublic;
  distance_km: number | null;
  description: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface RaceFilters {
  type?: RaceType[];
  difficulty_min?: number;
  difficulty_max?: number;
  target_public?: TargetPublic[];
  distance_min?: number;
  distance_max?: number;
}
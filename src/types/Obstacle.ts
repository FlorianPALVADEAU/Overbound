import { ObstacleType, Timestamp, UUID } from "./base.type";

export interface Obstacle {
  id: UUID;
  name: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  difficulty: number;
  type: ObstacleType;
  created_at: Timestamp;
  updated_at: Timestamp;
}
import { ObstacleType, Timestamp, UUID } from "./base.type";

export interface Obstacle {
  id: UUID;
  name: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  difficulty: number;
  type: ObstacleType;
  metric_label: string | null;
  metric_value: string | null;
  weight_male: string | null;
  weight_female: string | null;
  penalty: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}
import { UUID, UserRole, Timestamp, RaceType } from "./base.type";

export interface Profile {
  id: UUID; // ref to auth.users.id
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: Timestamp;
}

export interface UserStats {
  total_registrations: number;
  completed_events: number;
  pending_registrations: number;
  favorite_race_type: RaceType | null;
}
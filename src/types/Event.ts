import { Timestamp, EventStatus, UUID } from "./base.type";

export interface Event {
  id: UUID;
  slug: string;
  title: string;
  subtitle: string | null;
  date: Timestamp;
  location: string;
  capacity: number;
  status: EventStatus;
  external_provider: string | null;
  external_event_id: string | null;
  external_url: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface EventFilters {
  status?: EventStatus[];
  location?: string;
  date_from?: string;
  date_to?: string;
  capacity_min?: number;
  capacity_max?: number;
}

export interface EventStats {
  total_registrations: number;
  total_revenue: number;
  capacity_usage: number;
  pending_approvals: number;
  checked_in_count: number;
}
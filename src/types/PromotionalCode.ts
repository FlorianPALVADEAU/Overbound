import { Timestamp, UUID } from "./base.type";

export interface PromotionalCode {
  id: UUID;
  code: string;
  discount_percent?: number;
  discount_amount?: number;
  valid_from: Timestamp;
  valid_until: Timestamp;
  usage_limit?: number;
  used_count: number;
  event_ids?: UUID[];
}
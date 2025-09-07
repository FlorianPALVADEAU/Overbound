import { OrderStatus, Currency, Timestamp, Provider, UUID } from "./base.type";

export interface Order {
  id: UUID;
  user_id: UUID | null;
  email: string;
  provider: Provider;
  provider_order_id: string | null;
  status: OrderStatus;
  amount_total: number | null; // en centimes
  currency: Currency;
  invoice_url: string | null;
  created_at: Timestamp;
}
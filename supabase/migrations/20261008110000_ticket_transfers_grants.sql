-- Same issue as the volunteer planning tables: tables created by migration get no privilege
-- for service_role here (42501 "permission denied for table ticket_transfers").
-- Only the service-role client (API routes + Stripe webhook) touches ticket_transfers;
-- RLS stays enabled with no policy for anon/authenticated.
--
-- Idempotent: GRANT can be replayed safely.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_transfers TO service_role;

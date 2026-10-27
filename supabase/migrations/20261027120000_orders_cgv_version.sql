-- CGV version accepted at checkout, stamped on each order (see src/constants/legalVersions.ts).
-- Apply BEFORE deploying the code that writes it: the order insert fails on an unknown column.
alter table public.orders add column if not exists cgv_version text;

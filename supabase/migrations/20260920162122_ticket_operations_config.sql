-- Explicit, extensible ticket behavior configuration.
-- Legacy tickets remain valid with NULL and are handled by the compatibility
-- adapter; new tickets should persist their operational profile from the form.

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS operations_config jsonb;

COMMENT ON COLUMN public.tickets.operations_config IS
  'Extensible operational profile: departure_mode (none|wave|fixed), departure_change_policy (preserve|clear|reassign), profile_key and future factory-specific settings.';

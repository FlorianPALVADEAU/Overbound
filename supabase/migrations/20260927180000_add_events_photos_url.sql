-- FDR-0015 §9: replaces the hardcoded photo gallery URL that was baked into
-- UltraArenaEventOver.tsx and Header.tsx (https://photo.capture-ai.fr/events/overbound-2026),
-- so each future edition can carry its own link without a code change.
-- NOT applied automatically -- review before running against any environment.
alter table public.events
  add column if not exists photos_url text;

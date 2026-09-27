-- FDR-0014: per-reward image, for the wheel's segment illustrations
-- (product decision 2026-09-22 -- Flytex-style wheel with a product image
-- per segment, discrete segment-stop rotation instead of a continuous
-- spinning text wheel). Nullable: a reward without an image falls back to
-- text-only rendering client-side, never a broken image or a hard
-- requirement blocking existing campaigns/rewards.
ALTER TABLE public.lucky_wheel_rewards
  ADD COLUMN IF NOT EXISTS image_url text;

COMMENT ON COLUMN public.lucky_wheel_rewards.image_url IS
  'Optional illustration shown on the reward''s wheel segment and on the win screen. Public HTTPS URL (Supabase Storage or external), never required.';

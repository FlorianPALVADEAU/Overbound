-- FDR-0014 addendum (product-line discounts): nullable upsell-targeting
-- columns on promotional_codes and lucky_wheel_rewards.
--
-- Expand-only, fully backward-compatible: every existing row stays NULL,
-- which is the unchanged legacy behavior (a code nets against the ticket
-- subtotal, never an upsell). Nothing in the application reads these
-- columns yet -- this is stage 1 of a 4-stage rollout (see the addendum's
-- §5), deliberately shipped alone so it carries none of the pricing-engine
-- risk of the later stages.
--
-- Rollback: drop both columns and the index; safe at any point before an
-- application version starts writing non-null values, since no other
-- schema object depends on them yet.

alter table public.promotional_codes
  add column if not exists target_upsell_id uuid references public.upsells(id);

comment on column public.promotional_codes.target_upsell_id is
  'Nullable. NULL = code nets against the ticket subtotal (legacy behavior, unchanged).
   Non-null = code scoped to one upsell, nets only against that upsell''s own subtotal --
   must never discount the ticket if this upsell is not selected. See FDR-0014 addendum
   (docs/fdr/FDR-0014-addendum-product-line-discounts.md) §2 for the pricing engine
   contract, not yet implemented as of this migration.';

create index if not exists idx_promotional_codes_target_upsell_id
  on public.promotional_codes (target_upsell_id)
  where target_upsell_id is not null;

alter table public.lucky_wheel_rewards
  add column if not exists target_upsell_id uuid references public.upsells(id);

comment on column public.lucky_wheel_rewards.target_upsell_id is
  'Admin-configured target for PRODUCT_DISCOUNT / PHOTO_DISCOUNT rewards (which upsell
   the discount applies to). NULL for every other reward type. Validated applicatively
   at save time (not a DB CHECK, since validity depends on reward.type) -- the chosen
   upsell must be active for at least one of the campaign''s linked events. See
   FDR-0014 addendum §3.1. Not yet read by the mint path (src/lib/luckyWheel/redemption.ts)
   as of this migration -- that is stage 3 of the rollout.';

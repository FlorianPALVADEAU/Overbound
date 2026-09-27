-- FDR-0014 addendum (product-line discounts): PRODUCT_DISCOUNT and
-- PHOTO_DISCOUNT were shipped as percent-only (2026-09-26), but real usage
-- proved that assumption wrong -- an admin configured a fixed-amount
-- discount ("-5€ sur pack photo") under PRODUCT_DISCOUNT/PHOTO_DISCOUNT,
-- and public_value=5 was silently interpreted as 5% instead of 5€ (0,90€
-- off a 17,99€ pack instead of the intended 5,00€ off). Splits into 4
-- explicit types, mirroring the existing TICKET_PERCENT_DISCOUNT /
-- TICKET_FIXED_DISCOUNT pattern, so the unit is never inferred from the
-- reward type name alone.
--
-- Expand-only: PRODUCT_DISCOUNT/PHOTO_DISCOUNT stay valid in the CHECK
-- constraint (existing rows using them are not touched by this migration --
-- application code stops offering them for *new* rewards, see
-- RewardFormDialog.tsx, but a row already saved as PRODUCT_DISCOUNT still
-- satisfies this constraint and must be manually re-edited to the correct
-- *_PERCENT_/*_FIXED_ variant by an admin, since only a human knows which
-- unit was actually intended for that specific reward).
--
-- Rollback: drop the 4 new values from the CHECK constraint, but only
-- after confirming no lucky_wheel_rewards row uses them.

ALTER TABLE public.lucky_wheel_rewards
  DROP CONSTRAINT lucky_wheel_rewards_type_check;

ALTER TABLE public.lucky_wheel_rewards
  ADD CONSTRAINT lucky_wheel_rewards_type_check CHECK (type IN (
    'TICKET_PERCENT_DISCOUNT', 'TICKET_FIXED_DISCOUNT', 'FREE_TICKET',
    'FREE_PRODUCT', 'PRODUCT_DISCOUNT', 'PHOTO_DISCOUNT', 'FREE_PHOTO_PACK', 'CUSTOM',
    'PRODUCT_PERCENT_DISCOUNT', 'PRODUCT_FIXED_DISCOUNT',
    'PHOTO_PERCENT_DISCOUNT', 'PHOTO_FIXED_DISCOUNT'
  ));

-- Migration: Support multiple promotional codes per ambassador
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
--
-- This fixes the "filleuls disappear" bug caused by single-code tracking,
-- and enables assigning multiple promo codes to the same ambassador.

CREATE TABLE IF NOT EXISTS ambassador_promotional_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ambassador_id uuid NOT NULL REFERENCES ambassadors(id) ON DELETE CASCADE,
  promotional_code_id uuid NOT NULL REFERENCES promotional_codes(id) ON DELETE CASCADE,
  is_current boolean NOT NULL DEFAULT false,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ambassador_id, promotional_code_id)
);

CREATE INDEX IF NOT EXISTS idx_apc_ambassador_id
  ON ambassador_promotional_codes(ambassador_id);

-- Migrate current codes from the ambassadors table
INSERT INTO ambassador_promotional_codes (ambassador_id, promotional_code_id, is_current)
SELECT id, promotional_code_id, true
FROM ambassadors
WHERE promotional_code_id IS NOT NULL
ON CONFLICT (ambassador_id, promotional_code_id)
DO UPDATE SET is_current = true;

-- Recover historical codes from credited point events
-- (handles cases where the code was temporarily changed then reverted)
INSERT INTO ambassador_promotional_codes (ambassador_id, promotional_code_id, is_current)
SELECT DISTINCT ape.ambassador_id, r.promotional_code_id, false
FROM ambassador_points_events ape
JOIN registrations r ON r.id = ape.registration_id
WHERE r.promotional_code_id IS NOT NULL
ON CONFLICT (ambassador_id, promotional_code_id) DO NOTHING;

-- Hardening: a visitor's own session (anon / authenticated, the public API key plus their JWT) must
-- not write the shop tables directly. Production still has Supabase's default grants (ALL on every
-- public table, TRUNCATE included), so only RLS stood between a signed-in user and, for instance,
--   insert into registrations ...        (a bib without paying: registrations_insert_own)
--   update registrations set paid_ticket_cents = ..., flexible_refund = true   (registrations_update_own)
--   insert/update on orders              (orders_insert_own, orders_update_own)
-- Audit (2026-10-12): the application writes these tables only with the service-role client
-- (68 writes, 0 through a session). The development project already has them revoked.
--
-- Scope: the tables below, all written exclusively by service-role code (or not written at all).
-- SELECT is kept: the app still reads several of them with the visitor's session, under RLS.
-- NOT touched, because the app writes them with the session (see audit): profiles,
-- notification_preferences, list_subscriptions, email_logs, event_ratings, bootcamps,
-- bootcamp_registrations, distribution_lists, upsell_images, volunteer_assignments,
-- volunteer_zone_settings. Each needs its own route moved to service role first.
--
-- Idempotent: REVOKE can be replayed. Tables missing in an environment are skipped.
--
-- Rollback (restores the previous, permissive state; do not use unless a route breaks):
--   GRANT INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.<table> TO anon, authenticated;

DO $$
DECLARE
  shop_table text;
BEGIN
  FOREACH shop_table IN ARRAY ARRAY[
    -- money and identity
    'registrations', 'orders', 'order_items', 'registration_signatures', 'registration_upsells',
    'registration_documents', 'ticket_refunds', 'ticket_transfers',
    -- groups and ambassadors
    'groups', 'group_members', 'ambassadors', 'ambassador_points', 'ambassador_points_events',
    'ambassador_points_years', 'ambassador_promotional_codes', 'ambassador_rewards',
    'ambassador_manual_referrals', 'ambassador_reward_audit_events',
    -- promotions and lucky wheel
    'promotional_codes', 'promotional_code_events', 'promotional_code_usage', 'site_promotions',
    'lucky_wheel_campaigns', 'lucky_wheel_campaign_events', 'lucky_wheel_rewards',
    'lucky_wheel_entries', 'lucky_wheel_reward_allocations',
    -- catalogue and capacity
    'events', 'tickets', 'races', 'event_races', 'obstacles', 'race_obstacles', 'upsells',
    'event_price_tiers', 'event_waves', 'event_bib_counters', 'event_opening_notifications',
    -- operations
    'volunteer_applications', 'admin_request_logs', 'push_subscriptions', 'cookie_consent_logs',
    'site_maintenance'
  ]
  LOOP
    IF to_regclass(format('public.%I', shop_table)) IS NOT NULL THEN
      EXECUTE format(
        'REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM anon, authenticated',
        shop_table
      );
    END IF;
  END LOOP;
END
$$;

-- Tables created by later migrations must not be writable by visitors by default either.
-- (They then need an explicit GRANT to service_role, as ticket_transfers and the volunteer tables already do.)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM anon, authenticated;

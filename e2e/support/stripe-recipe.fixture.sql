-- Fixture of e2e/stripe-recipe.spec.ts. DEV database only (never production): the recipe creates real
-- orders against Stripe TEST mode. Safe to re-run after stripe-recipe.cleanup.sql.
--
-- Prerequisite: a confirmed auth user e2e-checkout@example.com with a profile row, created through the
-- Supabase admin API. Its credentials go to the spec through E2E_USER_EMAIL / E2E_USER_PASSWORD.

insert into events (id, slug, title, date, location, capacity, status, sales_start, open_bib_capacity, ranked_bib_capacity, organization_id)
values ('e2e00000-0000-4000-8000-000000000001', 'e2e-checkout', 'E2E Checkout (test, à supprimer)', '2027-09-12 06:00:00+00', 'Test', 100, 'on_sale',
        '2026-01-01 00:00:00+00', 50, 50, (select organization_id from events where slug <> 'e2e-checkout' limit 1));

insert into tickets (id, event_id, name, final_price_cents, currency, max_participants, race_format, organization_id, operations_config)
select t.id, 'e2e00000-0000-4000-8000-000000000001', t.name, t.price, 'eur', 40, t.format, e.organization_id, t.config::jsonb
from events e,
     (values
       ('e2e00000-0000-4000-8000-0000000000a1'::uuid, 'OPEN - E2E', 5000, 'open',
        '{"profile_key":"ticket-default-v1","departure_mode":"wave","fixed_start_time":null,"departure_change_policy":"reassign"}'),
       ('e2e00000-0000-4000-8000-0000000000a2'::uuid, 'RANKED - E2E', 7000, 'ranked',
        '{"profile_key":"ticket-default-v1","departure_mode":"none","fixed_start_time":null,"departure_change_policy":"preserve"}')
     ) as t(id, name, price, format, config)
where e.id = 'e2e00000-0000-4000-8000-000000000001';

insert into event_waves (event_id, wave_index, start_time, capacity, assigned_count, is_closed, organization_id, ticket_id)
select e.id, w.idx, w.start_time::timestamptz, w.capacity, 0, false, e.organization_id, 'e2e00000-0000-4000-8000-0000000000a1'
from events e,
     (values (1, '2027-09-12 10:00:00+00', 10), (2, '2027-09-12 10:10:00+00', 10), (3, '2027-09-12 10:20:00+00', 1)) as w(idx, start_time, capacity)
where e.id = 'e2e00000-0000-4000-8000-000000000001';

insert into event_bib_counters (event_id, race_format, next_number, max_number) values
  ('e2e00000-0000-4000-8000-000000000001', 'open', 1, 50),
  ('e2e00000-0000-4000-8000-000000000001', 'ranked', 1, 50);

-- Tier that fills up mid-order (scenario 6): Early -20 % for 2 bibs, then Late at full price.
insert into event_price_tiers (id, event_id, name, discount_percentage, available_from, available_until, display_order, max_registrations) values
  ('e2e00000-0000-4000-8000-0000000000f1', 'e2e00000-0000-4000-8000-000000000001', 'Early E2E', 20, '2026-01-01', '2028-01-01', 1, 2),
  ('e2e00000-0000-4000-8000-0000000000f2', 'e2e00000-0000-4000-8000-000000000001', 'Late E2E', 0, '2026-01-01', '2028-01-01', 2, null);

insert into promotional_codes (id, code, name, discount_percent, currency, valid_from, valid_until, usage_limit, is_active, target_upsell_id) values
  ('e2e00000-0000-4000-8000-0000000000c1', 'E2EFREEOPENTICKET', 'e2e', 100, 'eur', '2026-01-01', '2028-01-01', null, true, null),
  ('e2e00000-0000-4000-8000-0000000000c2', 'E2EHALF',            'e2e',  50, 'eur', '2026-01-01', '2028-01-01', null, true, null),
  ('e2e00000-0000-4000-8000-0000000000c3', 'E2EFREE',            'e2e', 100, 'eur', '2026-01-01', '2028-01-01', null, true, null),
  ('e2e00000-0000-4000-8000-0000000000c5', 'E2EAMBHALF',         'e2e ambassador', 50, 'eur', '2026-01-01', '2028-01-01', null, true, null);
insert into promotional_code_events (promotional_code_id, event_id)
select id, 'e2e00000-0000-4000-8000-000000000001' from promotional_codes where id::text like 'e2e00000-%';

-- The recipe user is an ambassador (E2EAMBHALF) and captain of a group already anchored on wave 2 (scenario 7).
insert into ambassadors (id, profile_id, promotional_code_id, is_active)
select 'e2e00000-0000-4000-8000-0000000000d1', u.id, 'e2e00000-0000-4000-8000-0000000000c5', true
from auth.users u where u.email = 'e2e-checkout@example.com';
insert into ambassador_promotional_codes (ambassador_id, promotional_code_id, is_current)
values ('e2e00000-0000-4000-8000-0000000000d1', 'e2e00000-0000-4000-8000-0000000000c5', true);

insert into groups (id, name, captain_id, invite_code, anchor_event_id, anchor_wave_index, anchor_start_time, anchor_initialized_by, anchor_initialized_from_profile_id, anchor_initialized_at)
select 'e2e00000-0000-4000-8000-0000000000b1', 'Team E2E', u.id, 'E2E00001', 'e2e00000-0000-4000-8000-000000000001', 2,
       '2027-09-12 10:10:00+00', 'admin_manual', u.id, now()
from auth.users u where u.email = 'e2e-checkout@example.com';
insert into group_members (group_id, profile_id, role)
select 'e2e00000-0000-4000-8000-0000000000b1', u.id, 'captain' from auth.users u where u.email = 'e2e-checkout@example.com';

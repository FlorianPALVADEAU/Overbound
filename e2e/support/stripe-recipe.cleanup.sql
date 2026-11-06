-- Removes everything e2e/stripe-recipe.spec.ts created, orders included. DEV database only.
-- Keeps the auth user and its profile. Re-seed with stripe-recipe.fixture.sql.

-- Foreign keys without cascade (restrict or no action) block the deletes below: clear their rows first.
-- Checked on DEV 2026-11-06 with pg_constraint (confdeltype a = no action, r = restrict).
delete from ticket_refunds where registration_id in (select id from registrations where event_id = 'e2e00000-0000-4000-8000-000000000001');
delete from admin_operation_commands where event_id = 'e2e00000-0000-4000-8000-000000000001' or registration_id in (select id from registrations where event_id = 'e2e00000-0000-4000-8000-000000000001');
delete from lucky_wheel_reward_allocations where redemption_event_id = 'e2e00000-0000-4000-8000-000000000001' or order_id in (select order_id from registrations where event_id = 'e2e00000-0000-4000-8000-000000000001');
delete from lucky_wheel_entries where event_id = 'e2e00000-0000-4000-8000-000000000001';
delete from ambassador_points_adjustments where ambassador_id::text like 'e2e00000-%';
delete from ambassador_reward_audit_events where ambassador_id::text like 'e2e00000-%';
delete from registrations where event_id = 'e2e00000-0000-4000-8000-000000000001' and companion_of is not null;

-- Orders next: they cascade to their remaining registrations, items, code usage and ambassador points.
delete from orders where id in (select order_id from registrations where event_id = 'e2e00000-0000-4000-8000-000000000001');
delete from registrations where event_id = 'e2e00000-0000-4000-8000-000000000001';
delete from groups where id::text like 'e2e00000-%';
delete from ambassadors where id::text like 'e2e00000-%';
delete from promotional_codes where id::text like 'e2e00000-%';
delete from events where id = 'e2e00000-0000-4000-8000-000000000001';

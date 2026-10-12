-- Removes everything e2e/stripe-recipe.spec.ts created, orders included. DEV database only.
-- Keeps the auth user and its profile. Re-seed with stripe-recipe.fixture.sql.

-- Orders first: they cascade to their registrations, items, code usage and ambassador points.
delete from orders where id in (select order_id from registrations where event_id = 'e2e00000-0000-4000-8000-000000000001');
delete from registrations where event_id = 'e2e00000-0000-4000-8000-000000000001';
delete from groups where id::text like 'e2e00000-%';
delete from ambassadors where id::text like 'e2e00000-%';
delete from promotional_codes where id::text like 'e2e00000-%';
delete from events where id = 'e2e00000-0000-4000-8000-000000000001';

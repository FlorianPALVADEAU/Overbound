-- The check-in API authorizes the staff member with their authenticated
-- session, then uses the server-only service role for participant operations.
-- Keep registrations unavailable as a broad authenticated read surface.
GRANT SELECT, UPDATE ON TABLE public.registrations TO service_role;
GRANT SELECT ON TABLE public.tickets TO service_role;
GRANT SELECT ON TABLE public.events TO service_role;
GRANT INSERT ON TABLE public.admin_request_logs TO service_role;

-- Rollback:
-- REVOKE SELECT, UPDATE ON TABLE public.registrations FROM service_role;
-- REVOKE SELECT ON TABLE public.tickets FROM service_role;
-- REVOKE SELECT ON TABLE public.events FROM service_role;
-- REVOKE INSERT ON TABLE public.admin_request_logs FROM service_role;

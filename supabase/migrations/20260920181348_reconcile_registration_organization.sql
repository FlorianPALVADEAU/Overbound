-- The event is the tenant ownership boundary for registrations. Repair rows
-- created before organization_id was propagated consistently.
UPDATE public.registrations registration
SET organization_id = event.organization_id
FROM public.events event
WHERE registration.event_id = event.id
  AND registration.organization_id IS DISTINCT FROM event.organization_id;

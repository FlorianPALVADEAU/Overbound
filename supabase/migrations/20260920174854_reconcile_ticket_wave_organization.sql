-- A ticket is the ownership boundary for its wave inventory. Reconcile legacy
-- rows that predate ticket scoping so tenant metadata cannot drift from the
-- validated parent ticket.
UPDATE public.event_waves wave
SET event_id = ticket.event_id,
    organization_id = ticket.organization_id,
    updated_at = now()
FROM public.tickets ticket
WHERE wave.ticket_id = ticket.id
  AND (
    wave.event_id IS DISTINCT FROM ticket.event_id
    OR wave.organization_id IS DISTINCT FROM ticket.organization_id
  );

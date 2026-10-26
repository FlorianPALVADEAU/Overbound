-- Optional end of an event, exposed as `endDate` in the SportsEvent JSON-LD.
-- Nullable: the JSON-LD omits endDate when it is not set. Apply by hand after review (FDR-0009).
alter table public.events add column if not exists end_date timestamptz;

comment on column public.events.end_date is 'End of the event (course closing). Optional, used for structured data.';

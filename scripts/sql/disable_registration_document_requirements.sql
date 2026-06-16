-- Disable the legacy registration document requirement flow.
--
-- Default is DRY RUN. To apply, change dry_run to false in the params CTE.
-- Non-destructive: does not delete uploaded files or registration_documents rows.

WITH params AS (
  SELECT true::boolean AS dry_run
),
ticket_candidates AS (
  SELECT id
  FROM tickets
  WHERE requires_document IS TRUE
),
registration_candidates AS (
  SELECT id
  FROM registrations
  WHERE approval_status IS DISTINCT FROM 'approved'
),
updated_tickets AS (
  UPDATE tickets
  SET
    requires_document = false,
    updated_at = now()
  WHERE id IN (SELECT id FROM ticket_candidates)
    AND NOT (SELECT dry_run FROM params)
  RETURNING id
),
updated_registrations AS (
  UPDATE registrations
  SET
    approval_status = 'approved',
    rejection_reason = NULL,
    approved_at = COALESCE(approved_at, now()),
    approved_by = NULL
  WHERE id IN (SELECT id FROM registration_candidates)
    AND NOT (SELECT dry_run FROM params)
  RETURNING id
)
SELECT
  (SELECT dry_run FROM params) AS dry_run,
  (SELECT count(*) FROM ticket_candidates) AS tickets_requiring_documents,
  (SELECT count(*) FROM registration_candidates) AS registrations_not_approved,
  (SELECT count(*) FROM updated_tickets) AS tickets_updated,
  (SELECT count(*) FROM updated_registrations) AS registrations_updated;

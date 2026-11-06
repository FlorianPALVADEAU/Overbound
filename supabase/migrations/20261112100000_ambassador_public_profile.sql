-- Public ambassador wall (/ambassadors). Two flags on the ambassador row:
--   public_opt_in : the ambassador chose to appear. Off by default (GDPR: no listing without consent).
--   public_blocked: moderation by the team. Wins over the opt-in, the ambassador cannot undo it.
--   public_bio    : one short sentence written by the ambassador, shown on the card.
--   public_show_group: the ambassador agrees to show their group (name + invite code) with a "join" link.
-- The photo is the account photo (profiles.avatar_url, uploaded from the account or the ambassador dashboard).
-- Writes go through the API with the service role: ambassadors already have no client write grants.

alter table public.ambassadors
  add column if not exists public_opt_in boolean not null default false,
  add column if not exists public_blocked boolean not null default false,
  add column if not exists public_bio text check (public_bio is null or char_length(public_bio) <= 120),
  add column if not exists public_show_group boolean not null default false;

comment on column public.ambassadors.public_opt_in is
  'The ambassador agreed to appear on the public /ambassadors page. Default false.';
comment on column public.ambassadors.public_blocked is
  'The team hid this ambassador from the public page. Overrides public_opt_in.';
comment on column public.ambassadors.public_bio is
  'Short presentation shown on the public card, 120 characters at most.';
comment on column public.ambassadors.public_show_group is
  'Show the ambassador''s group (name and invite code) on the public page. Default false: the invite code is public once shown.';

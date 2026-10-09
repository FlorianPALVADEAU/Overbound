-- A transferred bib needs a fresh waiver signed by the new holder, next to the buyer's original one.
-- The old (registration_id, regulation_version) uniqueness would reject it, so signatures are now
-- keyed by the context they were signed in.
alter table public.registration_signatures
  add column if not exists context text not null default 'purchase',
  add column if not exists signer_user_id uuid references auth.users(id) on delete set null;

alter table public.registration_signatures
  drop constraint if exists registration_signatures_context_check,
  add constraint registration_signatures_context_check check (context in ('purchase', 'transfer'));

alter table public.registration_signatures
  drop constraint if exists registration_signatures_registration_id_regulation_version_key;

create unique index if not exists registration_signatures_one_per_context
  on public.registration_signatures (registration_id, context);

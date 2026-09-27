-- Expand-only foundation for the mono-organisation Overbound upsell gallery.
-- Compatibility: public readers may keep using upsells.image_url until the
-- application has been deployed with upsell_images support.
-- Rollback: disable the new application path; do not drop this table or bucket
-- after media has been uploaded. A destructive contraction needs its own plan.

create table if not exists public.upsell_images (
  id uuid primary key default gen_random_uuid(),
  upsell_id uuid not null references public.upsells(id) on delete cascade,
  source text not null check (source in ('external', 'upload')),
  external_url text,
  storage_path text,
  alt_text text,
  position smallint not null check (position >= 0 and position < 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint upsell_images_source_location_check check (
    (source = 'external' and external_url is not null and storage_path is null)
    or (source = 'upload' and storage_path is not null and external_url is null)
  ),
  constraint upsell_images_upsell_position_key unique (upsell_id, position)
);

create index if not exists upsell_images_upsell_position_idx
  on public.upsell_images (upsell_id, position);

-- Preserve every legacy URL as the first gallery item. This is idempotent and
-- intentionally does not download or modify the remote resource.
insert into public.upsell_images (upsell_id, source, external_url, position)
select id, 'external', image_url, 0
from public.upsells
where image_url is not null and btrim(image_url) <> ''
on conflict (upsell_id, position) do nothing;

insert into storage.buckets (id, name, public)
values ('upsell-images', 'upsell-images', true)
on conflict (id) do update set public = excluded.public;

alter table public.upsell_images enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'upsell_images' and policyname = 'Public read upsell images') then
    create policy "Public read upsell images" on public.upsell_images for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'upsell_images' and policyname = 'Admins manage upsell images') then
    create policy "Admins manage upsell images" on public.upsell_images for all to authenticated
      using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
      with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public read upsell media') then
    create policy "Public read upsell media" on storage.objects for select using (bucket_id = 'upsell-images');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Admins upload upsell media') then
    create policy "Admins upload upsell media" on storage.objects for insert to authenticated
      with check (bucket_id = 'upsell-images' and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Admins delete upsell media') then
    create policy "Admins delete upsell media" on storage.objects for delete to authenticated
      using (bucket_id = 'upsell-images' and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
  end if;
end $$;

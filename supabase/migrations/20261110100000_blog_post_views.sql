-- Compteur de lectures du blog : une visite = une vue, une ligne par (article, visite).
-- Pas de cookie : l'identifiant de visite vit dans sessionStorage côté navigateur.
-- IP stockée anonymisée (même règle que cookie_consent_logs : dernier octet retiré).
-- Rétention à définir avant mise en production (purge des lignes de plus de 13 mois).
-- À relire puis appliquer manuellement, avant le déploiement du code qui écrit la table.

create table if not exists public.blog_post_views (
  id bigint generated always as identity primary key,
  post_slug text not null check (char_length(post_slug) between 1 and 200),
  visit_id uuid not null,
  anon_ip text,
  viewed_at timestamptz not null default now(),
  constraint blog_post_views_visit_unique unique (post_slug, visit_id)
);

create index if not exists blog_post_views_anon_ip_viewed_at_idx
  on public.blog_post_views (anon_ip, viewed_at);
create index if not exists blog_post_views_viewed_at_idx
  on public.blog_post_views (viewed_at);

-- Accès réservé au service role : aucune policy, donc anon et authenticated ne lisent rien.
alter table public.blog_post_views enable row level security;

create or replace function public.blog_post_view_counts(p_since timestamptz)
returns table (post_slug text, views bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select v.post_slug, count(*)::bigint as views
  from public.blog_post_views v
  where v.viewed_at >= p_since
  group by v.post_slug;
$$;

revoke all on function public.blog_post_view_counts(timestamptz) from public, anon, authenticated;
grant execute on function public.blog_post_view_counts(timestamptz) to service_role;

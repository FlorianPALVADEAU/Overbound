-- Unicité du slug d'événement : deux événements ne peuvent pas partager /events/<slug>.
-- Prérequis vérifié avant écriture : 0 doublon sur dev (3 événements, 3 slugs distincts) et prod (1 événement).
-- À relire puis appliquer manuellement. Verrou court (table de quelques lignes).
-- Si la création échoue ici, des doublons existent : les corriger avant de relancer.
create unique index if not exists events_slug_key on public.events (slug);

-- Participation des mineurs de 16 à 17 ans (format OPEN uniquement), à partir de l'édition 2027.
--
-- events.minimum_age : âge minimal le jour de l'événement. 18 par défaut, donc aucune édition existante
--   ne change. Passer à 16 sur l'événement concerné ouvre l'inscription aux 16 à 17 ans, OPEN seulement
--   (la règle OPEN uniquement est dans le code, pas dans cette colonne).
-- registrations.is_minor : posé à l'inscription, d'après la date de naissance et la date de l'événement.
-- registrations.minor_papers_verified_* : contrôle des papiers par un bénévole au retrait du dossard
--   (autorisation parentale signée, pièce d'identité, adulte référent, attestation de santé). Le check-in
--   d'un mineur est refusé tant que ce contrôle n'est pas enregistré.
--
-- À appliquer AVANT de déployer le code qui lit ces colonnes.
-- Retour arrière : drop des trois colonnes de registrations puis de events.minimum_age.

alter table public.events
  add column if not exists minimum_age smallint not null default 18
    check (minimum_age between 16 and 18);

alter table public.registrations
  add column if not exists is_minor boolean not null default false,
  add column if not exists minor_papers_verified_at timestamptz,
  add column if not exists minor_papers_verified_by uuid references public.profiles(id);

alter table public.registrations
  drop constraint if exists registrations_minor_papers_only_for_minors;
alter table public.registrations
  add constraint registrations_minor_papers_only_for_minors
    check (minor_papers_verified_at is null or is_minor);

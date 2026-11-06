-- Contacts du représentant légal et de l'adulte référent d'un mineur, stockés sur l'inscription.
--
-- Seule l'inscription d'un mineur les remplit (le code n'écrit rien pour un adulte). Le mail du billet part
-- au représentant en copie quand il diffère de l'adresse du mineur. Le référent est joignable le jour J ;
-- le formulaire ne demande pas son email, donc il n'y a pas de colonne pour cela.
--
-- À appliquer AVANT de déployer le code qui écrit ces colonnes (src/app/api/registrations/create/route.ts).
-- Retour arrière : drop des cinq colonnes.

alter table public.registrations
  add column if not exists guardian_name text,
  add column if not exists guardian_phone text,
  add column if not exists guardian_email text,
  add column if not exists referent_name text,
  add column if not exists referent_phone text;

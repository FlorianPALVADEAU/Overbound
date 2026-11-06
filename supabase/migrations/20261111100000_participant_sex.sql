-- Sexe (homme / femme) pour les classements par genre (podium RANKED).
--
-- profiles.sex : réponse du compte, facultative, pré-remplie sur le premier billet de l'acheteur.
-- registrations.sex : posé sur chaque billet à l'inscription. Obligatoire pour toute nouvelle inscription
--   (contrôle dans le code, avant paiement et à la création). NULL seulement pour les inscriptions faites
--   avant cette migration : aucune ligne existante n'est modifiée.
--
-- Pas de valeur « autre » : les classements n'en ont pas besoin.
--
-- À appliquer AVANT de déployer le code qui écrit ces colonnes (sinon l'insert de registration échoue).
-- Retour arrière : drop des deux colonnes.

alter table public.profiles
  add column if not exists sex text
    check (sex in ('homme', 'femme'));

alter table public.registrations
  add column if not exists sex text
    check (sex in ('homme', 'femme'));

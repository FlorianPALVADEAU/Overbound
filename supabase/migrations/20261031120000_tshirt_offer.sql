-- T-shirt offert aux N premiers participants (tout billet confondu).
-- Quota par événement (null = pas d'offre). Le décompte est dérivé des
-- inscriptions, rien d'autre à stocker que la taille choisie.
alter table public.events
  add column if not exists tshirt_offer_quota integer
    check (tshirt_offer_quota is null or tshirt_offer_quota > 0);

alter table public.registrations
  add column if not exists tshirt_size text
    check (tshirt_size is null or tshirt_size in ('XS', 'S', 'M', 'L', 'XL', 'XXL'));

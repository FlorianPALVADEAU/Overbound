-- Planning bénévoles : affectation des bénévoles aux zones, par créneau (matin / après-midi),
-- et effectifs cibles par zone. Les candidatures (volunteer_applications) ne changent pas :
-- créneau et pod sont retrouvés depuis `availability` et `preferred_mission`.
--
-- Accès uniquement via le client service-role (routes /api/admin/volunteers/planning/*).
-- RLS activée sans policy anon/authenticated, comme pour les autres tables admin.
--
-- À relire puis appliquer manuellement (supabase db push) : voir FDR-0009.

CREATE TABLE IF NOT EXISTS public.volunteer_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  -- NULL pour un RESP / AIDE saisi à la main qui n'a pas candidaté sur le site.
  application_id uuid REFERENCES public.volunteer_applications(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  shift text NOT NULL CHECK (shift IN ('morning', 'afternoon')),
  zone_key text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('resp', 'aide', 'member')),
  -- true = posé ou déplacé à la main : la répartition automatique n'y touche pas.
  locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Une candidature = au plus une zone par créneau.
CREATE UNIQUE INDEX IF NOT EXISTS volunteer_assignments_application_shift_key
  ON public.volunteer_assignments (event_id, application_id, shift)
  WHERE application_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS volunteer_assignments_zone_idx
  ON public.volunteer_assignments (event_id, shift, zone_key);

CREATE TABLE IF NOT EXISTS public.volunteer_zone_settings (
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  shift text NOT NULL CHECK (shift IN ('morning', 'afternoon')),
  zone_key text NOT NULL,
  -- NULL = pas de limite d'effectif sur cette zone.
  capacity integer CHECK (capacity IS NULL OR capacity >= 0),
  -- NULL = poids par défaut du code (zones d'obstacles C et D = 2, les autres = 1).
  weight integer CHECK (weight IS NULL OR weight > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, shift, zone_key)
);

ALTER TABLE public.volunteer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_zone_settings ENABLE ROW LEVEL SECURITY;

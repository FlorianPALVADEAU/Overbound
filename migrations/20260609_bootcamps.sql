-- ============================================================
-- Bootcamps — séances d'entraînement encadrées Overbound
-- ============================================================

CREATE TABLE IF NOT EXISTS bootcamps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT,
  image_url     TEXT,
  location_name TEXT        NOT NULL,
  location_address TEXT,
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  starts_at     TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bootcamp_registrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bootcamp_id   UUID        NOT NULL REFERENCES bootcamps(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (bootcamp_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bootcamp_registrations_bootcamp ON bootcamp_registrations(bootcamp_id);
CREATE INDEX IF NOT EXISTS idx_bootcamp_registrations_user    ON bootcamp_registrations(user_id);

-- updated_at auto-refresh
CREATE OR REPLACE FUNCTION fn_bootcamps_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bootcamps_set_updated_at ON bootcamps;
CREATE TRIGGER trg_bootcamps_set_updated_at
  BEFORE UPDATE ON bootcamps
  FOR EACH ROW EXECUTE FUNCTION fn_bootcamps_set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE bootcamps                ENABLE ROW LEVEL SECURITY;
ALTER TABLE bootcamp_registrations   ENABLE ROW LEVEL SECURITY;

-- bootcamps : lecture publique, écriture admin uniquement
CREATE POLICY "bootcamps_public_read"
  ON bootcamps FOR SELECT
  USING (true);

CREATE POLICY "bootcamps_admin_all"
  ON bootcamps FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- bootcamp_registrations : un utilisateur voit uniquement ses inscriptions
CREATE POLICY "registrations_own_read"
  ON bootcamp_registrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "registrations_own_insert"
  ON bootcamp_registrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "registrations_own_delete"
  ON bootcamp_registrations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
  ));

-- ============================================================
-- Seed — 4 bootcamps réels
-- ============================================================

INSERT INTO bootcamps (title, description, image_url, location_name, location_address, lat, lng, starts_at)
VALUES
  (
    'Bootcamp Airtime — 23 juin',
    NULL,
    '/images/images/farmer-carry.avif',
    'Airtime Training',
    '2 Rue Charlie Chaplin, 78390 Bois-d''Arcy',
    48.7897,
    2.0381,
    '2026-06-23T12:00:00+02:00'
  ),
  (
    'Bootcamp Versus — 23 juin',
    NULL,
    '/images/images/blond-lady-carrying-chains.avif',
    'Versus',
    '52 Rue de la Victoire, 75009 Paris',
    48.8762,
    2.3334,
    '2026-06-23T15:30:00+02:00'
  ),
  (
    'Bootcamp Airtime — 25 juillet',
    NULL,
    '/images/images/a-young-man-lifting-a-tire-from-the-ground.avif',
    'Airtime Training',
    '2 Rue Charlie Chaplin, 78390 Bois-d''Arcy',
    48.7897,
    2.0381,
    '2026-07-25T08:00:00+02:00'
  ),
  (
    'Bootcamp Airtime — 30 août',
    NULL,
    '/images/images/a-man-flipping-a-tire-with-overbound-headband.avif',
    'Airtime Training',
    '2 Rue Charlie Chaplin, 78390 Bois-d''Arcy',
    48.7897,
    2.0381,
    '2026-08-30T15:30:00+02:00'
  );

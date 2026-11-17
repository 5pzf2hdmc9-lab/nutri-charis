-- =============================================================================
-- NutriCharis — Security Lockdown (RLS / IDOR / GDPR Art.9 consent columns)
-- Run in Supabase SQL Editor. Idempotent where possible.
-- OWASP: never rely on client-side filters alone — enforce at Postgres.
-- =============================================================================

-- 1) Dietitian registry (roles must NOT live in editable user_metadata)
CREATE TABLE IF NOT EXISTS public.dietitians (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dietitians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dietitians FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dietitians_select_own" ON public.dietitians;
CREATE POLICY "dietitians_select_own"
  ON public.dietitians FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Seed primary dietitian (update UUID after first login if needed)
-- INSERT INTO public.dietitians (user_id, email, full_name)
-- SELECT id, email, 'Χάρις Φωτούδη' FROM auth.users
-- WHERE lower(email) = 'chadisfotoudi@gmail.com'
-- ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_dietitian()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dietitians d
    WHERE d.user_id = (SELECT auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.is_dietitian() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_dietitian() TO authenticated;

-- 2) Clients — ownership + GDPR Art.9 consent timestamps
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS dietitian_id uuid REFERENCES auth.users (id),
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id),
  ADD COLUMN IF NOT EXISTS gdpr_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS art9_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

CREATE INDEX IF NOT EXISTS clients_dietitian_id_idx ON public.clients (dietitian_id);
CREATE INDEX IF NOT EXISTS clients_user_id_idx ON public.clients (user_id);
CREATE INDEX IF NOT EXISTS clients_email_lower_idx ON public.clients (lower(email));

-- Backfill: attach orphan rows to primary dietitian when possible
UPDATE public.clients c
SET dietitian_id = d.user_id
FROM public.dietitians d
WHERE c.dietitian_id IS NULL
  AND lower(d.email) = 'chadisfotoudi@gmail.com';

UPDATE public.clients c
SET user_id = u.id
FROM auth.users u
WHERE c.user_id IS NULL
  AND c.email IS NOT NULL
  AND lower(c.email) = lower(u.email);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_select_owner_or_self" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_authenticated" ON public.clients;
DROP POLICY IF EXISTS "clients_update_owner_or_self" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_owner_or_self" ON public.clients;

CREATE POLICY "clients_select_owner_or_self"
  ON public.clients FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND (
      dietitian_id = (SELECT auth.uid())
      OR user_id = (SELECT auth.uid())
      OR (
        email IS NOT NULL
        AND lower(email) = lower(COALESCE((SELECT auth.jwt() ->> 'email'), ''))
      )
      OR (SELECT public.is_dietitian())
    )
  );

CREATE POLICY "clients_insert_authenticated"
  ON public.clients FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND (
      -- Dietitian creating a patient folder
      (
        (SELECT public.is_dietitian())
        AND dietitian_id = (SELECT auth.uid())
      )
      -- Patient self-registration
      OR (
        user_id = (SELECT auth.uid())
        AND lower(COALESCE(email, '')) = lower(COALESCE((SELECT auth.jwt() ->> 'email'), ''))
      )
    )
  );

CREATE POLICY "clients_update_owner_or_self"
  ON public.clients FOR UPDATE TO authenticated
  USING (
    dietitian_id = (SELECT auth.uid())
    OR user_id = (SELECT auth.uid())
    OR (SELECT public.is_dietitian())
  )
  WITH CHECK (
    dietitian_id = (SELECT auth.uid())
    OR user_id = (SELECT auth.uid())
    OR (SELECT public.is_dietitian())
  );

CREATE POLICY "clients_delete_owner_or_self"
  ON public.clients FOR DELETE TO authenticated
  USING (
    dietitian_id = (SELECT auth.uid())
    OR user_id = (SELECT auth.uid())
    OR (SELECT public.is_dietitian())
  );

-- 3) Appointments — access only via owned client
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS dietitian_id uuid REFERENCES auth.users (id);

CREATE INDEX IF NOT EXISTS appointments_client_id_idx ON public.appointments (client_id);
CREATE INDEX IF NOT EXISTS appointments_dietitian_id_idx ON public.appointments (dietitian_id);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointments_select" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete" ON public.appointments;

CREATE POLICY "appointments_select"
  ON public.appointments FOR SELECT TO authenticated
  USING (
    dietitian_id = (SELECT auth.uid())
    OR (SELECT public.is_dietitian())
    OR EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id::text = appointments.client_id::text
        AND (
          c.dietitian_id = (SELECT auth.uid())
          OR c.user_id = (SELECT auth.uid())
          OR lower(COALESCE(c.email, '')) = lower(COALESCE((SELECT auth.jwt() ->> 'email'), ''))
        )
    )
  );

CREATE POLICY "appointments_insert"
  ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_dietitian() OR dietitian_id = (SELECT auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id::text = appointments.client_id::text
        AND (
          c.dietitian_id = (SELECT auth.uid())
          OR (SELECT public.is_dietitian())
        )
    )
  );

CREATE POLICY "appointments_update"
  ON public.appointments FOR UPDATE TO authenticated
  USING (dietitian_id = (SELECT auth.uid()) OR (SELECT public.is_dietitian()))
  WITH CHECK (dietitian_id = (SELECT auth.uid()) OR (SELECT public.is_dietitian()));

CREATE POLICY "appointments_delete"
  ON public.appointments FOR DELETE TO authenticated
  USING (dietitian_id = (SELECT auth.uid()) OR (SELECT public.is_dietitian()));

-- 4) Measurements
ALTER TABLE public.measurements
  ADD COLUMN IF NOT EXISTS dietitian_id uuid REFERENCES auth.users (id);

CREATE INDEX IF NOT EXISTS measurements_client_id_idx ON public.measurements (client_id);
CREATE INDEX IF NOT EXISTS measurements_dietitian_id_idx ON public.measurements (dietitian_id);

ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "measurements_select" ON public.measurements;
DROP POLICY IF EXISTS "measurements_insert" ON public.measurements;
DROP POLICY IF EXISTS "measurements_update" ON public.measurements;
DROP POLICY IF EXISTS "measurements_delete" ON public.measurements;

CREATE POLICY "measurements_select"
  ON public.measurements FOR SELECT TO authenticated
  USING (
    dietitian_id = (SELECT auth.uid())
    OR (SELECT public.is_dietitian())
    OR EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id::text = measurements.client_id::text
        AND (
          c.dietitian_id = (SELECT auth.uid())
          OR c.user_id = (SELECT auth.uid())
          OR lower(COALESCE(c.email, '')) = lower(COALESCE((SELECT auth.jwt() ->> 'email'), ''))
        )
    )
  );

CREATE POLICY "measurements_insert"
  ON public.measurements FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id::text = measurements.client_id::text
        AND (
          c.dietitian_id = (SELECT auth.uid())
          OR c.user_id = (SELECT auth.uid())
          OR (SELECT public.is_dietitian())
        )
    )
  );

CREATE POLICY "measurements_update"
  ON public.measurements FOR UPDATE TO authenticated
  USING (
    dietitian_id = (SELECT auth.uid())
    OR (SELECT public.is_dietitian())
    OR EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id::text = measurements.client_id::text
        AND (c.dietitian_id = (SELECT auth.uid()) OR c.user_id = (SELECT auth.uid()))
    )
  )
  WITH CHECK (
    dietitian_id = (SELECT auth.uid())
    OR (SELECT public.is_dietitian())
    OR EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id::text = measurements.client_id::text
        AND (c.dietitian_id = (SELECT auth.uid()) OR c.user_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "measurements_delete"
  ON public.measurements FOR DELETE TO authenticated
  USING (
    dietitian_id = (SELECT auth.uid())
    OR (SELECT public.is_dietitian())
  );

-- 5) Optional legacy tables (meals / journal / settings) — lock if present
DO $$
BEGIN
  IF to_regclass('public.meals') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.meals FORCE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS meals_dietitian_all ON public.meals';
    EXECUTE $p$
      CREATE POLICY meals_dietitian_all ON public.meals
      FOR ALL TO authenticated
      USING ((SELECT public.is_dietitian()))
      WITH CHECK ((SELECT public.is_dietitian()))
    $p$;
  END IF;

  IF to_regclass('public.journal') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.journal ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.journal FORCE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS journal_dietitian_all ON public.journal';
    EXECUTE $p$
      CREATE POLICY journal_dietitian_all ON public.journal
      FOR ALL TO authenticated
      USING ((SELECT public.is_dietitian()))
      WITH CHECK ((SELECT public.is_dietitian()))
    $p$;
  END IF;

  IF to_regclass('public.settings') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE public.settings FORCE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS settings_dietitian_all ON public.settings';
    EXECUTE $p$
      CREATE POLICY settings_dietitian_all ON public.settings
      FOR ALL TO authenticated
      USING ((SELECT public.is_dietitian()))
      WITH CHECK ((SELECT public.is_dietitian()))
    $p$;
  END IF;
END $$;

-- 6) Revoke broad anon grants (defense in depth)
REVOKE ALL ON TABLE public.clients FROM anon;
REVOKE ALL ON TABLE public.appointments FROM anon;
REVOKE ALL ON TABLE public.measurements FROM anon;
REVOKE ALL ON TABLE public.dietitians FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.clients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.measurements TO authenticated;
GRANT SELECT ON TABLE public.dietitians TO authenticated;

-- =============================================================================
-- NutriCharis — Sprint 3 Final Lockdown
-- bigint client_id, measurement anthro columns, drop legacy dup policies,
-- RLS on questionnaires/available_slots, admin_users index, is_dietitian harden.
-- Idempotent where possible. Run after security_rls.sql + practice_ops_10.sql.
-- LIVE policies call private.is_dietitian / private.uid / private.jwt_email.
-- Re-applying this file drops those policies and references public.is_dietitian.
-- =============================================================================

DO $guard$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'private' AND p.proname = 'is_dietitian'
  ) THEN
    RAISE EXCEPTION
      'Refusing sprint3_lockdown.sql: live RLS already uses private.is_dietitian.';
  END IF;
END
$guard$;

-- 0) Drop ALL policies that depend on client_id BEFORE altering column types
DROP POLICY IF EXISTS "Admin full access clients" ON public.clients;
DROP POLICY IF EXISTS "Client read own profile" ON public.clients;
DROP POLICY IF EXISTS "Client insert own profile" ON public.clients;

DROP POLICY IF EXISTS "Admin full access appointments" ON public.appointments;
DROP POLICY IF EXISTS "Client read own appointments" ON public.appointments;
DROP POLICY IF EXISTS "appointments_select" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete" ON public.appointments;

DROP POLICY IF EXISTS "Admin full access measurements" ON public.measurements;
DROP POLICY IF EXISTS "Client read own measurements" ON public.measurements;
DROP POLICY IF EXISTS "measurements_select" ON public.measurements;
DROP POLICY IF EXISTS "measurements_insert" ON public.measurements;
DROP POLICY IF EXISTS "measurements_update" ON public.measurements;
DROP POLICY IF EXISTS "measurements_delete" ON public.measurements;

-- 1) Measurements: clinical columns + anthro JSON (Athlisis-class)
ALTER TABLE public.measurements
  ADD COLUMN IF NOT EXISTS body_fat numeric,
  ADD COLUMN IF NOT EXISTS muscle_mass numeric,
  ADD COLUMN IF NOT EXISTS waist numeric,
  ADD COLUMN IF NOT EXISTS anthro jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.measurements
SET body_fat = fat
WHERE body_fat IS NULL AND fat IS NOT NULL;

-- 2) Convert appointments.client_id text → bigint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'appointments'
      AND column_name = 'client_id' AND data_type = 'text'
  ) THEN
    UPDATE public.appointments
    SET client_id = NULL
    WHERE client_id IS NOT NULL AND client_id !~ '^[0-9]+$';

    ALTER TABLE public.appointments
      ALTER COLUMN client_id TYPE bigint
      USING (NULLIF(trim(client_id), '')::bigint);
  END IF;
END $$;

-- 3) Convert measurements.client_id text → bigint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'measurements'
      AND column_name = 'client_id' AND data_type = 'text'
  ) THEN
    UPDATE public.measurements
    SET client_id = NULL
    WHERE client_id IS NOT NULL AND client_id !~ '^[0-9]+$';

    ALTER TABLE public.measurements
      ALTER COLUMN client_id TYPE bigint
      USING (NULLIF(trim(client_id), '')::bigint);
  END IF;
END $$;

-- 5) Recreate appointments/measurements policies with bigint joins (no ::text)

CREATE POLICY "appointments_select"
  ON public.appointments FOR SELECT TO authenticated
  USING (
    dietitian_id = (SELECT auth.uid())
    OR (SELECT public.is_dietitian())
    OR EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = appointments.client_id
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
    ((SELECT public.is_dietitian()) OR dietitian_id = (SELECT auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = appointments.client_id
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
      WHERE c.id = measurements.client_id
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
      WHERE c.id = measurements.client_id
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
      WHERE c.id = measurements.client_id
        AND (c.dietitian_id = (SELECT auth.uid()) OR c.user_id = (SELECT auth.uid()))
    )
  )
  WITH CHECK (
    dietitian_id = (SELECT auth.uid())
    OR (SELECT public.is_dietitian())
    OR EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = measurements.client_id
        AND (c.dietitian_id = (SELECT auth.uid()) OR c.user_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "measurements_delete"
  ON public.measurements FOR DELETE TO authenticated
  USING (
    dietitian_id = (SELECT auth.uid())
    OR (SELECT public.is_dietitian())
  );

-- 6) Lock questionnaires + available_slots (were ERROR: RLS disabled)
ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaires FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "questionnaires_select" ON public.questionnaires;
DROP POLICY IF EXISTS "questionnaires_insert" ON public.questionnaires;
DROP POLICY IF EXISTS "questionnaires_update" ON public.questionnaires;
DROP POLICY IF EXISTS "questionnaires_delete" ON public.questionnaires;

CREATE POLICY "questionnaires_select"
  ON public.questionnaires FOR SELECT TO authenticated
  USING (
    (SELECT public.is_dietitian())
    OR EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = questionnaires.client_id
        AND (
          c.dietitian_id = (SELECT auth.uid())
          OR c.user_id = (SELECT auth.uid())
        )
    )
  );

CREATE POLICY "questionnaires_insert"
  ON public.questionnaires FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_dietitian())
    OR EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = questionnaires.client_id
        AND (
          c.dietitian_id = (SELECT auth.uid())
          OR c.user_id = (SELECT auth.uid())
        )
    )
  );

CREATE POLICY "questionnaires_update"
  ON public.questionnaires FOR UPDATE TO authenticated
  USING (
    (SELECT public.is_dietitian())
    OR EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = questionnaires.client_id
        AND (
          c.dietitian_id = (SELECT auth.uid())
          OR c.user_id = (SELECT auth.uid())
        )
    )
  )
  WITH CHECK (
    (SELECT public.is_dietitian())
    OR EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = questionnaires.client_id
        AND (
          c.dietitian_id = (SELECT auth.uid())
          OR c.user_id = (SELECT auth.uid())
        )
    )
  );

CREATE POLICY "questionnaires_delete"
  ON public.questionnaires FOR DELETE TO authenticated
  USING ((SELECT public.is_dietitian()));

REVOKE ALL ON TABLE public.questionnaires FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.questionnaires TO authenticated;

ALTER TABLE public.available_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.available_slots FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "available_slots_select" ON public.available_slots;
DROP POLICY IF EXISTS "available_slots_write" ON public.available_slots;

-- Read for signed-in users (booking UI); write only dietitians
CREATE POLICY "available_slots_select"
  ON public.available_slots FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "available_slots_write"
  ON public.available_slots FOR ALL TO authenticated
  USING ((SELECT public.is_dietitian()))
  WITH CHECK ((SELECT public.is_dietitian()));

REVOKE ALL ON TABLE public.available_slots FROM anon;
GRANT SELECT ON TABLE public.available_slots TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.available_slots TO authenticated;

-- 7) admin_users FK index + harden open SELECT policy
CREATE INDEX IF NOT EXISTS admin_users_user_id_idx ON public.admin_users (user_id);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to all users" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_select_own" ON public.admin_users;

CREATE POLICY "admin_users_select_own"
  ON public.admin_users FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_dietitian()));

REVOKE ALL ON TABLE public.admin_users FROM anon;
GRANT SELECT ON TABLE public.admin_users TO authenticated;

-- 8) Harden is_dietitian — revoke anon RPC (keep authenticated for RLS)
REVOKE ALL ON FUNCTION public.is_dietitian() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_dietitian() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_dietitian() TO authenticated;

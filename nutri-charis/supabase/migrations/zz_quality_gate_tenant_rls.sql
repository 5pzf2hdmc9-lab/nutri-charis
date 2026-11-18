-- =============================================================================
-- Quality gate — tenant RLS (run LAST in the Supabase SQL editor)
--
-- Historical policies used `OR public.is_dietitian()`, which is true for every
-- dietitian and therefore exposed every client, appointment, measurement, and
-- questionnaire to every dietitian account. Ownership is auth.uid().
--
-- A sole-dietitian practice can still see folders that have no dietitian_id
-- (patient self-signup). A second dietitian cannot.
-- Idempotent. Does not drop clinical data.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.uid()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT auth.uid() $$;

CREATE OR REPLACE FUNCTION private.jwt_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT lower(COALESCE(auth.jwt() ->> 'email', '')) $$;

CREATE OR REPLACE FUNCTION private.is_dietitian()
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

-- True only when the caller is a dietitian AND the practice has exactly one.
CREATE OR REPLACE FUNCTION private.sole_dietitian()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.is_dietitian()
    AND (SELECT count(*) FROM public.dietitians) = 1;
$$;

REVOKE ALL ON FUNCTION private.uid() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.jwt_email() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_dietitian() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sole_dietitian() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.uid() FROM anon;
REVOKE ALL ON FUNCTION private.jwt_email() FROM anon;
REVOKE ALL ON FUNCTION private.is_dietitian() FROM anon;
REVOKE ALL ON FUNCTION private.sole_dietitian() FROM anon;
GRANT EXECUTE ON FUNCTION private.uid() TO authenticated;
GRANT EXECUTE ON FUNCTION private.jwt_email() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_dietitian() TO authenticated;
GRANT EXECUTE ON FUNCTION private.sole_dietitian() TO authenticated;

-- Exposed security-definer must not remain callable. Leftover policies that
-- still call it fail closed instead of granting cross-tenant access.
DO $revoke_public$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'is_dietitian'
  ) THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.is_dietitian() FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON FUNCTION public.is_dietitian() FROM anon';
    EXECUTE 'REVOKE ALL ON FUNCTION public.is_dietitian() FROM authenticated';
  END IF;
END
$revoke_public$;

-- Attach orphan rows when the practice is still a single dietitian.
DO $backfill$
DECLARE
  n integer;
  sole uuid;
BEGIN
  IF to_regclass('public.dietitians') IS NULL THEN
    RETURN;
  END IF;
  SELECT count(*) INTO n FROM public.dietitians;
  IF n <> 1 THEN
    RETURN;
  END IF;
  SELECT user_id INTO sole FROM public.dietitians LIMIT 1;
  IF to_regclass('public.clients') IS NOT NULL THEN
    UPDATE public.clients SET dietitian_id = sole WHERE dietitian_id IS NULL;
  END IF;
  IF to_regclass('public.appointments') IS NOT NULL THEN
    UPDATE public.appointments SET dietitian_id = sole WHERE dietitian_id IS NULL;
  END IF;
  IF to_regclass('public.measurements') IS NOT NULL THEN
    UPDATE public.measurements SET dietitian_id = sole WHERE dietitian_id IS NULL;
  END IF;
END
$backfill$;

-- Patients cannot retarget a folder onto another auth user.
CREATE OR REPLACE FUNCTION private.protect_client_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF private.is_dietitian() THEN
    IF NEW.dietitian_id IS NOT NULL AND NEW.dietitian_id IS DISTINCT FROM private.uid() THEN
      NEW.dietitian_id := OLD.dietitian_id;
    END IF;
  ELSE
    NEW.dietitian_id := OLD.dietitian_id;
    NEW.user_id := OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.protect_client_owner() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.protect_client_owner() FROM anon;
REVOKE ALL ON FUNCTION private.protect_client_owner() FROM authenticated;

CREATE OR REPLACE FUNCTION private.protect_dietitian_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF private.is_dietitian() THEN
    IF NEW.dietitian_id IS DISTINCT FROM private.uid() THEN
      NEW.dietitian_id := private.uid();
    END IF;
  ELSE
    NEW.dietitian_id := OLD.dietitian_id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.protect_dietitian_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.protect_dietitian_id() FROM anon;
REVOKE ALL ON FUNCTION private.protect_dietitian_id() FROM authenticated;

DO $clients$
BEGIN
  IF to_regclass('public.clients') IS NULL THEN
    RETURN;
  END IF;

  DROP TRIGGER IF EXISTS clients_protect_owner ON public.clients;
  CREATE TRIGGER clients_protect_owner
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION private.protect_client_owner();

  ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.clients FORCE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "clients_select_owner_or_self" ON public.clients;
  DROP POLICY IF EXISTS "clients_insert_authenticated" ON public.clients;
  DROP POLICY IF EXISTS "clients_update_owner_or_self" ON public.clients;
  DROP POLICY IF EXISTS "clients_delete_owner_or_self" ON public.clients;

  CREATE POLICY "clients_select_owner_or_self"
    ON public.clients FOR SELECT TO authenticated
    USING (
      dietitian_id = (SELECT private.uid())
      OR user_id = (SELECT private.uid())
      OR (
        email IS NOT NULL
        AND (SELECT private.jwt_email()) <> ''
        AND lower(email) = (SELECT private.jwt_email())
      )
      OR (dietitian_id IS NULL AND (SELECT private.sole_dietitian()))
    );

  CREATE POLICY "clients_insert_authenticated"
    ON public.clients FOR INSERT TO authenticated
    WITH CHECK (
      gdpr_consent_at IS NOT NULL
      AND art9_consent_at IS NOT NULL
      AND terms_accepted_at IS NOT NULL
      AND (
        (
          (SELECT private.is_dietitian())
          AND dietitian_id = (SELECT private.uid())
        )
        OR (
          user_id = (SELECT private.uid())
          AND (dietitian_id IS NULL OR dietitian_id = (SELECT private.uid()))
          AND (SELECT private.jwt_email()) <> ''
          AND lower(COALESCE(email, '')) = (SELECT private.jwt_email())
        )
      )
    );

  CREATE POLICY "clients_update_owner_or_self"
    ON public.clients FOR UPDATE TO authenticated
    USING (
      dietitian_id = (SELECT private.uid())
      OR user_id = (SELECT private.uid())
      OR (
        email IS NOT NULL
        AND (SELECT private.jwt_email()) <> ''
        AND lower(email) = (SELECT private.jwt_email())
      )
      OR (dietitian_id IS NULL AND (SELECT private.sole_dietitian()))
    )
    WITH CHECK (
      (
        (SELECT private.is_dietitian())
        AND (
          dietitian_id = (SELECT private.uid())
          OR (dietitian_id IS NULL AND (SELECT private.sole_dietitian()))
        )
      )
      OR user_id = (SELECT private.uid())
    );

  CREATE POLICY "clients_delete_owner_or_self"
    ON public.clients FOR DELETE TO authenticated
    USING (
      dietitian_id = (SELECT private.uid())
      OR user_id = (SELECT private.uid())
      OR (
        email IS NOT NULL
        AND (SELECT private.jwt_email()) <> ''
        AND lower(email) = (SELECT private.jwt_email())
      )
      OR (dietitian_id IS NULL AND (SELECT private.sole_dietitian()))
    );

  REVOKE ALL ON TABLE public.clients FROM anon;
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.clients TO authenticated;
END
$clients$;

DO $appointments$
BEGIN
  IF to_regclass('public.appointments') IS NULL THEN
    RETURN;
  END IF;

  DROP TRIGGER IF EXISTS appointments_protect_owner ON public.appointments;
  CREATE TRIGGER appointments_protect_owner
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION private.protect_dietitian_id();

  ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.appointments FORCE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "appointments_select" ON public.appointments;
  DROP POLICY IF EXISTS "appointments_insert" ON public.appointments;
  DROP POLICY IF EXISTS "appointments_update" ON public.appointments;
  DROP POLICY IF EXISTS "appointments_delete" ON public.appointments;

  CREATE POLICY "appointments_select"
    ON public.appointments FOR SELECT TO authenticated
    USING (
      dietitian_id = (SELECT private.uid())
      OR EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = appointments.client_id
          AND (
            c.dietitian_id = (SELECT private.uid())
            OR c.user_id = (SELECT private.uid())
            OR (
              c.email IS NOT NULL
              AND (SELECT private.jwt_email()) <> ''
              AND lower(c.email) = (SELECT private.jwt_email())
            )
            OR (c.dietitian_id IS NULL AND (SELECT private.sole_dietitian()))
          )
      )
    );

  CREATE POLICY "appointments_insert"
    ON public.appointments FOR INSERT TO authenticated
    WITH CHECK (
      dietitian_id = (SELECT private.uid())
      AND (SELECT private.is_dietitian())
      AND EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = appointments.client_id
          AND (
            c.dietitian_id = (SELECT private.uid())
            OR (c.dietitian_id IS NULL AND (SELECT private.sole_dietitian()))
          )
      )
    );

  CREATE POLICY "appointments_update"
    ON public.appointments FOR UPDATE TO authenticated
    USING (
      dietitian_id = (SELECT private.uid())
      OR (
        dietitian_id IS NULL
        AND (SELECT private.sole_dietitian())
      )
    )
    WITH CHECK (
      dietitian_id = (SELECT private.uid())
      AND (SELECT private.is_dietitian())
    );

  CREATE POLICY "appointments_delete"
    ON public.appointments FOR DELETE TO authenticated
    USING (
      dietitian_id = (SELECT private.uid())
      OR (dietitian_id IS NULL AND (SELECT private.sole_dietitian()))
    );

  REVOKE ALL ON TABLE public.appointments FROM anon;
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.appointments TO authenticated;
END
$appointments$;

DO $measurements$
BEGIN
  IF to_regclass('public.measurements') IS NULL THEN
    RETURN;
  END IF;

  DROP TRIGGER IF EXISTS measurements_protect_owner ON public.measurements;
  CREATE TRIGGER measurements_protect_owner
    BEFORE UPDATE ON public.measurements
    FOR EACH ROW
    EXECUTE FUNCTION private.protect_dietitian_id();

  ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.measurements FORCE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "measurements_select" ON public.measurements;
  DROP POLICY IF EXISTS "measurements_insert" ON public.measurements;
  DROP POLICY IF EXISTS "measurements_update" ON public.measurements;
  DROP POLICY IF EXISTS "measurements_delete" ON public.measurements;

  CREATE POLICY "measurements_select"
    ON public.measurements FOR SELECT TO authenticated
    USING (
      dietitian_id = (SELECT private.uid())
      OR EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = measurements.client_id
          AND (
            c.dietitian_id = (SELECT private.uid())
            OR c.user_id = (SELECT private.uid())
            OR (
              c.email IS NOT NULL
              AND (SELECT private.jwt_email()) <> ''
              AND lower(c.email) = (SELECT private.jwt_email())
            )
            OR (c.dietitian_id IS NULL AND (SELECT private.sole_dietitian()))
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
            c.dietitian_id = (SELECT private.uid())
            OR c.user_id = (SELECT private.uid())
            OR (
              c.email IS NOT NULL
              AND (SELECT private.jwt_email()) <> ''
              AND lower(c.email) = (SELECT private.jwt_email())
            )
            OR (c.dietitian_id IS NULL AND (SELECT private.sole_dietitian()))
          )
      )
    );

  CREATE POLICY "measurements_update"
    ON public.measurements FOR UPDATE TO authenticated
    USING (
      dietitian_id = (SELECT private.uid())
      OR EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = measurements.client_id
          AND (
            c.user_id = (SELECT private.uid())
            OR (c.dietitian_id = (SELECT private.uid()))
            OR (c.dietitian_id IS NULL AND (SELECT private.sole_dietitian()))
          )
      )
    )
    WITH CHECK (
      dietitian_id = (SELECT private.uid())
      OR EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = measurements.client_id
          AND (
            c.user_id = (SELECT private.uid())
            OR (
              c.email IS NOT NULL
              AND (SELECT private.jwt_email()) <> ''
              AND lower(c.email) = (SELECT private.jwt_email())
            )
          )
      )
    );

  CREATE POLICY "measurements_delete"
    ON public.measurements FOR DELETE TO authenticated
    USING (
      dietitian_id = (SELECT private.uid())
      OR (dietitian_id IS NULL AND (SELECT private.sole_dietitian()))
    );

  REVOKE ALL ON TABLE public.measurements FROM anon;
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.measurements TO authenticated;
END
$measurements$;

DO $notes$
BEGIN
  IF to_regclass('public.clinical_notes') IS NULL THEN
    RETURN;
  END IF;

  DROP POLICY IF EXISTS "clinical_notes_insert" ON public.clinical_notes;
  CREATE POLICY "clinical_notes_insert"
    ON public.clinical_notes FOR INSERT TO authenticated
    WITH CHECK (
      (SELECT private.uid()) = dietitian_id
      AND (SELECT private.is_dietitian())
      AND EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = clinical_notes.client_id
          AND (
            c.dietitian_id = (SELECT private.uid())
            OR (c.dietitian_id IS NULL AND (SELECT private.sole_dietitian()))
          )
      )
    );
END
$notes$;

DO $billing$
BEGIN
  IF to_regclass('public.billing_packages') IS NULL THEN
    RETURN;
  END IF;

  DROP POLICY IF EXISTS "billing_packages_insert" ON public.billing_packages;
  CREATE POLICY "billing_packages_insert"
    ON public.billing_packages FOR INSERT TO authenticated
    WITH CHECK (
      (SELECT private.uid()) = dietitian_id
      AND (SELECT private.is_dietitian())
      AND EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = billing_packages.client_id
          AND (
            c.dietitian_id = (SELECT private.uid())
            OR (c.dietitian_id IS NULL AND (SELECT private.sole_dietitian()))
          )
      )
    );
END
$billing$;

DO $questionnaires$
BEGIN
  IF to_regclass('public.questionnaires') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.questionnaires FORCE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "questionnaires_select" ON public.questionnaires;
  DROP POLICY IF EXISTS "questionnaires_insert" ON public.questionnaires;
  DROP POLICY IF EXISTS "questionnaires_update" ON public.questionnaires;
  DROP POLICY IF EXISTS "questionnaires_delete" ON public.questionnaires;

  CREATE POLICY "questionnaires_select"
    ON public.questionnaires FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = questionnaires.client_id
          AND (
            c.dietitian_id = (SELECT private.uid())
            OR c.user_id = (SELECT private.uid())
            OR (
              c.email IS NOT NULL
              AND (SELECT private.jwt_email()) <> ''
              AND lower(c.email) = (SELECT private.jwt_email())
            )
            OR (c.dietitian_id IS NULL AND (SELECT private.sole_dietitian()))
          )
      )
    );

  CREATE POLICY "questionnaires_insert"
    ON public.questionnaires FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = questionnaires.client_id
          AND (
            c.dietitian_id = (SELECT private.uid())
            OR c.user_id = (SELECT private.uid())
            OR (c.dietitian_id IS NULL AND (SELECT private.sole_dietitian()))
          )
      )
    );

  CREATE POLICY "questionnaires_update"
    ON public.questionnaires FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = questionnaires.client_id
          AND (
            c.dietitian_id = (SELECT private.uid())
            OR c.user_id = (SELECT private.uid())
            OR (c.dietitian_id IS NULL AND (SELECT private.sole_dietitian()))
          )
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = questionnaires.client_id
          AND (
            c.dietitian_id = (SELECT private.uid())
            OR c.user_id = (SELECT private.uid())
            OR (c.dietitian_id IS NULL AND (SELECT private.sole_dietitian()))
          )
      )
    );

  CREATE POLICY "questionnaires_delete"
    ON public.questionnaires FOR DELETE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = questionnaires.client_id
          AND (
            c.dietitian_id = (SELECT private.uid())
            OR (c.dietitian_id IS NULL AND (SELECT private.sole_dietitian()))
          )
      )
    );

  REVOKE ALL ON TABLE public.questionnaires FROM anon;
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.questionnaires TO authenticated;
END
$questionnaires$;

DO $slots$
BEGIN
  IF to_regclass('public.available_slots') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE public.available_slots ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.available_slots FORCE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "available_slots_select" ON public.available_slots;
  DROP POLICY IF EXISTS "available_slots_write" ON public.available_slots;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'available_slots' AND column_name = 'dietitian_id'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "available_slots_select" ON public.available_slots
      FOR SELECT TO authenticated
      USING (dietitian_id = (SELECT private.uid()) OR dietitian_id IS NULL)
    $p$;
    EXECUTE $p$
      CREATE POLICY "available_slots_write" ON public.available_slots
      FOR ALL TO authenticated
      USING (dietitian_id = (SELECT private.uid()) AND (SELECT private.is_dietitian()))
      WITH CHECK (dietitian_id = (SELECT private.uid()) AND (SELECT private.is_dietitian()))
    $p$;
  ELSE
    EXECUTE $p$
      CREATE POLICY "available_slots_select" ON public.available_slots
      FOR SELECT TO authenticated
      USING ((SELECT private.is_dietitian()))
    $p$;
    EXECUTE $p$
      CREATE POLICY "available_slots_write" ON public.available_slots
      FOR ALL TO authenticated
      USING ((SELECT private.is_dietitian()))
      WITH CHECK ((SELECT private.is_dietitian()))
    $p$;
  END IF;

  REVOKE ALL ON TABLE public.available_slots FROM anon;
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.available_slots TO authenticated;
END
$slots$;

DO $admins$
BEGIN
  IF to_regclass('public.admin_users') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.admin_users FORCE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "Allow read access to all users" ON public.admin_users;
  DROP POLICY IF EXISTS "admin_users_select_own" ON public.admin_users;

  CREATE POLICY "admin_users_select_own"
    ON public.admin_users FOR SELECT TO authenticated
    USING (user_id = (SELECT private.uid()));

  REVOKE ALL ON TABLE public.admin_users FROM anon;
  GRANT SELECT ON TABLE public.admin_users TO authenticated;
END
$admins$;

-- Legacy tables: scope by owner column when present; otherwise dietitian role only.
DO $legacy$
DECLARE
  rel text;
BEGIN
  FOREACH rel IN ARRAY ARRAY['meals', 'journal', 'settings']
  LOOP
    IF to_regclass('public.' || rel) IS NULL THEN
      CONTINUE;
    END IF;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', rel);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', rel);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', rel || '_dietitian_all', rel);
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = rel AND column_name = 'dietitian_id'
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (dietitian_id = (SELECT private.uid())) WITH CHECK (dietitian_id = (SELECT private.uid()))',
        rel || '_owner',
        rel
      );
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = rel AND column_name = 'user_id'
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (user_id = (SELECT private.uid())) WITH CHECK (user_id = (SELECT private.uid()))',
        rel || '_owner',
        rel
      );
    ELSE
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING ((SELECT private.is_dietitian())) WITH CHECK ((SELECT private.is_dietitian()))',
        rel || '_dietitian_all',
        rel
      );
    END IF;
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', rel);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', rel);
  END LOOP;
END
$legacy$;

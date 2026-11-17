-- Art.15 / Art.17 / Art.20 subject access + erasure.
-- Helpers stay in private (not an exposed security-definer). Idempotent.
-- Clears any legacy Gemini key stored in public.settings.

CREATE SCHEMA IF NOT EXISTS private;
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

REVOKE ALL ON FUNCTION private.uid() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.jwt_email() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_dietitian() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.uid() TO authenticated;
GRANT EXECUTE ON FUNCTION private.jwt_email() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_dietitian() TO authenticated;

UPDATE public.settings SET value = '' WHERE key = 'gemini_api_key';

DROP POLICY IF EXISTS "clinical_notes_select_subject" ON public.clinical_notes;
CREATE POLICY "clinical_notes_select_subject"
  ON public.clinical_notes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = clinical_notes.client_id
        AND (
          c.user_id = (SELECT private.uid())
          OR (c.email IS NOT NULL AND lower(c.email) = (SELECT private.jwt_email()))
        )
    )
  );

DROP POLICY IF EXISTS "clinical_notes_delete_subject" ON public.clinical_notes;
CREATE POLICY "clinical_notes_delete_subject"
  ON public.clinical_notes FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = clinical_notes.client_id
        AND (
          c.user_id = (SELECT private.uid())
          OR (c.email IS NOT NULL AND lower(c.email) = (SELECT private.jwt_email()))
        )
    )
  );

DROP POLICY IF EXISTS "billing_packages_select_subject" ON public.billing_packages;
CREATE POLICY "billing_packages_select_subject"
  ON public.billing_packages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = billing_packages.client_id
        AND (
          c.user_id = (SELECT private.uid())
          OR (c.email IS NOT NULL AND lower(c.email) = (SELECT private.jwt_email()))
        )
    )
  );

DROP POLICY IF EXISTS "billing_packages_delete_subject" ON public.billing_packages;
CREATE POLICY "billing_packages_delete_subject"
  ON public.billing_packages FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = billing_packages.client_id
        AND (
          c.user_id = (SELECT private.uid())
          OR (c.email IS NOT NULL AND lower(c.email) = (SELECT private.jwt_email()))
        )
    )
  );

DROP POLICY IF EXISTS "questionnaires_delete_subject" ON public.questionnaires;
CREATE POLICY "questionnaires_delete_subject"
  ON public.questionnaires FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = questionnaires.client_id
        AND (
          c.user_id = (SELECT private.uid())
          OR (c.email IS NOT NULL AND lower(c.email) = (SELECT private.jwt_email()))
        )
    )
  );

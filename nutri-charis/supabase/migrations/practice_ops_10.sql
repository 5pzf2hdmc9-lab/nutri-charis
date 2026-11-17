-- =============================================================================
-- NutriCharis — Practice Ops 10/10 (SOAP notes + billing packages)
-- Run in Supabase SQL Editor after security_rls.sql. Idempotent where possible.
-- RLS: dietitian owns rows via auth.uid() = dietitian_id (FORCE RLS).
-- Sprint 1 Fix: client_id is bigint (matches public.clients.id), NOT uuid.
-- =============================================================================

-- Recreate if an earlier draft used uuid client_id (resets SOAP/billing rows only).
DROP TABLE IF EXISTS public.billing_packages CASCADE;
DROP TABLE IF EXISTS public.clinical_notes CASCADE;

-- 1) Clinical SOAP notes (per visit)
CREATE TABLE public.clinical_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id bigint NOT NULL REFERENCES public.clients (id) ON DELETE CASCADE,
  dietitian_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  visit_date date NOT NULL DEFAULT (CURRENT_DATE),
  subjective text NOT NULL DEFAULT '',
  objective text NOT NULL DEFAULT '',
  assessment text NOT NULL DEFAULT '',
  plan text NOT NULL DEFAULT '',
  adherence_score smallint NOT NULL DEFAULT 5
    CHECK (adherence_score >= 1 AND adherence_score <= 10),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX clinical_notes_client_id_idx
  ON public.clinical_notes (client_id);
CREATE INDEX clinical_notes_dietitian_id_idx
  ON public.clinical_notes (dietitian_id);
CREATE INDEX clinical_notes_visit_date_idx
  ON public.clinical_notes (visit_date DESC);

ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_notes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinical_notes_select" ON public.clinical_notes;
DROP POLICY IF EXISTS "clinical_notes_insert" ON public.clinical_notes;
DROP POLICY IF EXISTS "clinical_notes_update" ON public.clinical_notes;
DROP POLICY IF EXISTS "clinical_notes_delete" ON public.clinical_notes;

CREATE POLICY "clinical_notes_select"
  ON public.clinical_notes FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = dietitian_id);

CREATE POLICY "clinical_notes_insert"
  ON public.clinical_notes FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = dietitian_id
    AND EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = clinical_notes.client_id
        AND (c.dietitian_id = (SELECT auth.uid()) OR (SELECT public.is_dietitian()))
    )
  );

CREATE POLICY "clinical_notes_update"
  ON public.clinical_notes FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = dietitian_id)
  WITH CHECK ((SELECT auth.uid()) = dietitian_id);

CREATE POLICY "clinical_notes_delete"
  ON public.clinical_notes FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = dietitian_id);

-- 2) Billing packages / session packs
CREATE TABLE public.billing_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id bigint NOT NULL REFERENCES public.clients (id) ON DELETE CASCADE,
  dietitian_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  package_name text NOT NULL,
  total_sessions integer NOT NULL CHECK (total_sessions >= 1 AND total_sessions <= 100),
  used_sessions integer NOT NULL DEFAULT 0
    CHECK (used_sessions >= 0 AND used_sessions <= 100),
  amount_eur numeric(10, 2) NOT NULL DEFAULT 0
    CHECK (amount_eur >= 0),
  payment_status text NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('paid', 'pending', 'overdue')),
  payment_method text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_packages_used_lte_total
    CHECK (used_sessions <= total_sessions)
);

CREATE INDEX billing_packages_client_id_idx
  ON public.billing_packages (client_id);
CREATE INDEX billing_packages_dietitian_id_idx
  ON public.billing_packages (dietitian_id);
CREATE INDEX billing_packages_payment_status_idx
  ON public.billing_packages (payment_status);

ALTER TABLE public.billing_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_packages FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billing_packages_select" ON public.billing_packages;
DROP POLICY IF EXISTS "billing_packages_insert" ON public.billing_packages;
DROP POLICY IF EXISTS "billing_packages_update" ON public.billing_packages;
DROP POLICY IF EXISTS "billing_packages_delete" ON public.billing_packages;

CREATE POLICY "billing_packages_select"
  ON public.billing_packages FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = dietitian_id);

CREATE POLICY "billing_packages_insert"
  ON public.billing_packages FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = dietitian_id
    AND EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = billing_packages.client_id
        AND (c.dietitian_id = (SELECT auth.uid()) OR (SELECT public.is_dietitian()))
    )
  );

CREATE POLICY "billing_packages_update"
  ON public.billing_packages FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = dietitian_id)
  WITH CHECK ((SELECT auth.uid()) = dietitian_id);

CREATE POLICY "billing_packages_delete"
  ON public.billing_packages FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = dietitian_id);

-- 3) Grants (anon revoked — defense in depth)
REVOKE ALL ON TABLE public.clinical_notes FROM anon;
REVOKE ALL ON TABLE public.billing_packages FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.clinical_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.billing_packages TO authenticated;

-- NutriCharis Excellence Pass — dietitian GDPR / terms consent timestamps
-- Idempotent. Adds Art.9 / GDPR / Terms stamps on public.dietitians + own UPDATE.

ALTER TABLE public.dietitians
  ADD COLUMN IF NOT EXISTS gdpr_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS art9_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

COMMENT ON COLUMN public.dietitians.gdpr_consent_at IS 'Timestamp of dietitian GDPR privacy policy acceptance';
COMMENT ON COLUMN public.dietitians.art9_consent_at IS 'Timestamp of dietitian Art.9 health-data processing acknowledgment';
COMMENT ON COLUMN public.dietitians.terms_accepted_at IS 'Timestamp of dietitian Terms + AI transparency acceptance';

DROP POLICY IF EXISTS "dietitians_update_own_consent" ON public.dietitians;
CREATE POLICY "dietitians_update_own_consent"
  ON public.dietitians FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

GRANT SELECT, UPDATE ON TABLE public.dietitians TO authenticated;

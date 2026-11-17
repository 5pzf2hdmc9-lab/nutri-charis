-- Appointment outcome workflow (Practice Better-class): scheduled / completed / no-show / cancelled.
-- Idempotent. Run after sprint3_lockdown.sql.

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS status text;

UPDATE public.appointments
SET status = 'Προγραμματισμένο'
WHERE status IS NULL
   OR status NOT IN ('Προγραμματισμένο', 'Ολοκληρωμένο', 'No-show', 'Ακυρώθηκε');

ALTER TABLE public.appointments
  ALTER COLUMN status SET DEFAULT 'Προγραμματισμένο';

ALTER TABLE public.appointments
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('Προγραμματισμένο', 'Ολοκληρωμένο', 'No-show', 'Ακυρώθηκε'));

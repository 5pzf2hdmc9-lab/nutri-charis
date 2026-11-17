ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS notes text;
COMMENT ON COLUMN public.appointments.notes IS 'Session type + free-text notes shown in UI';
UPDATE public.appointments SET notes = COALESCE(notes, type, client) WHERE notes IS NULL;

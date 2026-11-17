-- Restore auto ids for legacy bigint PKs (inserts were failing with 23502 null id).
CREATE SEQUENCE IF NOT EXISTS public.clients_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.appointments_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.measurements_id_seq;

SELECT setval(
  'public.clients_id_seq',
  GREATEST(
    COALESCE((SELECT MAX(id) FROM public.clients), 1),
    (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::bigint
  )
);
SELECT setval(
  'public.appointments_id_seq',
  GREATEST(
    COALESCE((SELECT MAX(id) FROM public.appointments), 1),
    (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::bigint
  )
);
SELECT setval(
  'public.measurements_id_seq',
  GREATEST(
    COALESCE((SELECT MAX(id) FROM public.measurements), 1),
    (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::bigint
  )
);

ALTER TABLE public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq');
ALTER TABLE public.appointments ALTER COLUMN id SET DEFAULT nextval('public.appointments_id_seq');
ALTER TABLE public.measurements ALTER COLUMN id SET DEFAULT nextval('public.measurements_id_seq');

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;
ALTER SEQUENCE public.appointments_id_seq OWNED BY public.appointments.id;
ALTER SEQUENCE public.measurements_id_seq OWNED BY public.measurements.id;

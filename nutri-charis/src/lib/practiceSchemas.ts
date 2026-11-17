// @ts-nocheck — Zod 4 typings require TypeScript 5+; CRA pins TS 4.9 via react-scripts.
import { z } from 'zod';
import { sanitizeText } from './authAccess';

/** public.clients.id is bigint — coerce form/JSON strings to positive int. */
export const clientIdSchema = z.coerce.number().int().positive('Μη έγκυρο client_id');

const emptyToNull = (value: unknown) => (value === '' || value == null ? null : value);

function optionalRange(min: number, max: number, message: string) {
  return z.preprocess(
    emptyToNull,
    z.union([z.null(), z.coerce.number().finite().min(min, message).max(max, message)])
  );
}

export const appointmentStatusSchema = z.enum([
  'Προγραμματισμένο',
  'Ολοκληρωμένο',
  'No-show',
  'Ακυρώθηκε'
]);

export const appointmentSchema = z.object({
  client_id: clientIdSchema,
  client_name: z.string().min(1, 'Λείπει το όνομα πελάτη').max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Μη έγκυρη ημερομηνία'),
  time: z.string().regex(/^\d{2}:\d{2}/, 'Μη έγκυρη ώρα'),
  notes: z.string().max(500).default(''),
  status: appointmentStatusSchema
});

export function parseMeasurement(raw: Record<string, unknown>) {
  return measurementSchema.safeParse(raw);
}

export function parseAppointment(raw: Record<string, unknown>) {
  return appointmentSchema.safeParse(raw);
}

export const soapNoteSchema = z.object({
  client_id: clientIdSchema,
  visit_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Μη έγκυρη ημερομηνία'),
  subjective: z.string().max(4000).default(''),
  objective: z.string().max(4000).default(''),
  assessment: z.string().max(4000).default(''),
  plan: z.string().max(4000).default(''),
  adherence_score: z.coerce.number().int().min(1).max(10)
});

export const billingPackageSchema = z.object({
  client_id: clientIdSchema,
  package_name: z.string().min(1).max(120),
  total_sessions: z.coerce.number().int().min(1).max(100),
  used_sessions: z.coerce.number().int().min(0).max(100).default(0),
  amount_eur: z.coerce.number().finite().min(0).max(100000),
  payment_status: z.enum(['paid', 'pending', 'overdue']),
  payment_method: z.string().max(80).default(''),
  notes: z.string().max(500).default('')
});

export type SoapNoteInput = z.infer<typeof soapNoteSchema>;
export type BillingPackageInput = z.infer<typeof billingPackageSchema>;

export function parseSoapNote(raw: Record<string, unknown>) {
  return soapNoteSchema.safeParse({
    ...raw,
    subjective: sanitizeText(raw.subjective, 4000),
    objective: sanitizeText(raw.objective, 4000),
    assessment: sanitizeText(raw.assessment, 4000),
    plan: sanitizeText(raw.plan, 4000)
  });
}

export function parseBillingPackage(raw: Record<string, unknown>) {
  return billingPackageSchema.safeParse({
    ...raw,
    package_name: sanitizeText(raw.package_name, 120),
    payment_method: sanitizeText(raw.payment_method, 80),
    notes: sanitizeText(raw.notes, 500)
  });
}

const finiteRange = (min: number, max: number) => z.number().finite().min(min).max(max);

/** Folder create/register — consent timestamps required (Art.9). */
export const clientFolderSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().max(180).default(''),
  phone: z.string().max(40).default(''),
  gender: z.enum(['male', 'female']),
  age: finiteRange(5, 115),
  weight: finiteRange(25, 350),
  height: finiteRange(90, 240),
  goal: z.string().max(200).default(''),
  gdpr_consent_at: z.string().min(20).max(40),
  art9_consent_at: z.string().min(20).max(40),
  terms_accepted_at: z.string().min(20).max(40)
});

export function parseClientFolder(raw: Record<string, unknown>) {
  return clientFolderSchema.safeParse({
    ...raw,
    name: sanitizeText(raw.name, 120),
    email: sanitizeText(raw.email, 180).toLowerCase(),
    phone: sanitizeText(raw.phone, 40),
    goal: sanitizeText(raw.goal, 200)
  });
}

const cm = z.coerce.number().finite().min(15).max(200);
const mm = z.coerce.number().finite().min(1).max(80);

export const anthroSchema = z
  .object({
    circ: z
      .object({
        neck: cm.optional(),
        chest: cm.optional(),
        arm: cm.optional(),
        hip: cm.optional(),
        thigh: cm.optional(),
        calf: cm.optional()
      })
      .strict()
      .optional(),
    folds: z
      .object({
        triceps: mm.optional(),
        biceps: mm.optional(),
        subscapular: mm.optional(),
        suprailiac: mm.optional(),
        abdominal: mm.optional(),
        thighFold: mm.optional(),
        calfFold: mm.optional(),
        chestFold: mm.optional()
      })
      .strict()
      .optional()
  })
  .strict();

export const measurementSchema = z.object({
  client_id: clientIdSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Μη έγκυρη ημερομηνία'),
  weight: z.coerce.number().finite().min(25, 'Βάρος εκτός ορίων (25–350 kg)').max(350, 'Βάρος εκτός ορίων (25–350 kg)'),
  body_fat: optionalRange(3, 70, 'Λίπος εκτός ορίων (3–70%)'),
  muscle_mass: optionalRange(10, 150, 'Μυϊκή μάζα εκτός ορίων (10–150 kg)'),
  waist: optionalRange(40, 220, 'Μέση εκτός ορίων (40–220 cm)'),
  anthro: anthroSchema
});

export function parseAnthro(raw: unknown) {
  const body = raw && typeof raw === 'object' ? raw : {};
  const circ = (body as { circ?: object }).circ || {};
  const folds = (body as { folds?: object }).folds || {};
  if (!Object.keys(circ).length && !Object.keys(folds).length) {
    return { success: true as const, data: {} };
  }
  return anthroSchema.safeParse(body);
}

// @ts-nocheck — Zod 4 typings require TypeScript 5+; CRA pins TS 4.9 via react-scripts.
import { z } from 'zod';
import { sanitizeText } from './authAccess';

/** public.clients.id is bigint — coerce form/JSON strings to positive int. */
export const clientIdSchema = z.coerce.number().int().positive();

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

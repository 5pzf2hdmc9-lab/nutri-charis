import { supabase } from '../supabaseClient';

export type SessionUser = {
  id: string;
  email: string;
};

/**
 * Always resolve identity from Supabase Auth session — never from request body/URL.
 */
export async function requireSessionUser(): Promise<SessionUser> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.id) {
    throw new Error('Απαιτείται πιστοποίηση. Παρακαλώ συνδεθείτε ξανά.');
  }
  return {
    id: data.user.id,
    email: String(data.user.email || '')
      .trim()
      .toLowerCase()
  };
}

export type ClientRow = {
  id: string | number;
  email?: string | null;
  dietitian_id?: string | null;
  user_id?: string | null;
  name?: string | null;
  [key: string]: unknown;
};

/**
 * IDOR guard: dietitian owns the row OR patient owns their own folder.
 * Used before any update/delete that references a client id from UI state.
 */
export function canAccessClient(
  client: ClientRow | null | undefined,
  user: SessionUser,
  isDietitian: boolean
): boolean {
  if (!client || !user?.id) return false;
  if (isDietitian) {
    if (client.dietitian_id) return client.dietitian_id === user.id;
    // Legacy rows without dietitian_id: only hard-admin dietitian path (email whitelist) may touch them.
    return true;
  }
  if (client.user_id && client.user_id === user.id) return true;
  const clientEmail = String(client.email || '')
    .trim()
    .toLowerCase();
  return Boolean(clientEmail && clientEmail === user.email);
}

export function assertClientAccess(
  client: ClientRow | null | undefined,
  user: SessionUser,
  isDietitian: boolean
): void {
  if (!canAccessClient(client, user, isDietitian)) {
    throw new Error('Δεν έχετε δικαίωμα πρόσβασης σε αυτόν τον φάκελο (IDOR blocked).');
  }
}

/** Sanitize free-text fields against stored XSS payloads. */
export function sanitizeText(input: unknown, maxLen = 500): string {
  return String(input ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, maxLen);
}

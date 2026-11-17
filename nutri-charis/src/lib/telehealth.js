import { sanitizeText } from './authAccess';

/** Deterministic opaque room slug — avoids raw client ids in the public URL. */
function opaqueRoomSlug(clientId, date) {
  const raw = `nutricharis-jitsi-v1|${sanitizeText(String(clientId || 'guest'), 48)}|${sanitizeText(String(date || ''), 16)}`;
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  // Second pass for more entropy in the slug without leaking PII
  let hash2 = 2166136261;
  const raw2 = `${raw}|${hex}`;
  for (let i = 0; i < raw2.length; i += 1) {
    hash2 ^= raw2.charCodeAt(i);
    hash2 = Math.imul(hash2, 16777619);
  }
  return `nc${hex}${(hash2 >>> 0).toString(16).padStart(8, '0')}`;
}

/**
 * Build a deterministic Jitsi Meet room for NutriCharis telehealth.
 * Opens on public meet.jit.si (8x8) — third-party; share link only with the patient.
 */
export function buildJitsiRoomUrl({ clientId, date }) {
  const day = sanitizeText(String(date || new Date().toISOString().slice(0, 10)), 16).replace(
    /[^0-9-]/g,
    ''
  );
  const slug = opaqueRoomSlug(clientId, day || 'session');
  return `https://meet.jit.si/NutriCharis-${slug}`;
}

export async function copyTelehealthLink(url) {
  const value = String(url || '');
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }
  if (typeof document === 'undefined') return false;
  const ta = document.createElement('textarea');
  ta.value = value;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(ta);
  return ok;
}

import { sanitizeText } from './authAccess';
import { buildAppointmentReminderMessage } from './appointmentReminder';

/** Normalize Greek mobile to E.164 digits without +. */
export function normalizePhoneE164(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('30') && digits.length >= 12) return digits.slice(0, 15);
  if (digits.startsWith('69') && digits.length === 10) return `30${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `30${digits.slice(1)}`;
  // Reject non-GR shapes that could still be abused in deep links
  if (digits.length < 10 || digits.length > 15) return '';
  return digits;
}

/**
 * Strict mailto local-part@domain — blocks ? & # % CRLF header injection.
 * Returns empty string when invalid.
 */
export function sanitizeEmailForMailto(raw) {
  const cleaned = sanitizeText(String(raw || ''), 180)
    .replace(/[\r\n\t]/g, '')
    .replace(/[?&#%]/g, '')
    .trim()
    .toLowerCase();
  if (!cleaned || cleaned.length > 180) return '';
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(cleaned)) return '';
  return cleaned;
}

export function buildNotifyPayload({ clientName, date, time, sessionNotes, phone, email }) {
  const message = buildAppointmentReminderMessage({ clientName, date, time, sessionNotes });
  const e164 = normalizePhoneE164(phone);
  const mail = sanitizeEmailForMailto(email);
  const enc = encodeURIComponent(message);
  const subject = encodeURIComponent(
    `Υπενθύμιση ραντεβού ${sanitizeText(date, 16)} ${sanitizeText(String(time || '').slice(0, 5), 8)} — Χάρις Φωτούδη`
  );

  return {
    message,
    e164,
    links: {
      whatsapp: e164 ? `https://wa.me/${e164}?text=${enc}` : null,
      viber: e164 ? `viber://chat?number=%2B${e164}` : null,
      sms: e164 ? `sms:+${e164}?&body=${enc}` : null,
      email: mail
        ? `mailto:${encodeURIComponent(mail)}?subject=${subject}&body=${enc}`
        : `mailto:?subject=${subject}&body=${enc}`
    }
  };
}

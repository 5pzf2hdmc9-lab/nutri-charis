import { sanitizeText } from './authAccess';

/**
 * Personalized Greek reminder for Viber / WhatsApp / SMS copy-paste.
 * Includes fasting / hydration prep for body-composition visits.
 */
export function buildAppointmentReminderMessage({ clientName, date, time, sessionNotes }) {
  const name = sanitizeText(clientName, 120) || 'σας';
  const d = sanitizeText(date, 32);
  const t = sanitizeText(String(time || '').slice(0, 5), 8);
  const notes = sanitizeText(sessionNotes, 200).toLowerCase();
  const isMeasure =
    /λιπομέτρ|μέτρησ|1η συνεδρ|ανθρωπομετρ|body|inbody|δερματοπτυχ/i.test(notes) ||
    !notes;

  const prep = isMeasure
    ? [
        '',
        'Οδηγίες προετοιμασίας μέτρησης:',
        '• Νηστικοί 3–4 ώρες πριν (νερό επιτρέπεται).',
        '• Καλή ενυδάτωση την προηγούμενη ημέρα — αποφύγετε αλκοόλ.',
        '• Αποφύγετε έντονη άσκηση το προηγούμενο 24ωρο.',
        '• Ελάτε με ελαφριά ρούχα (χωρίς μεταλλικά αξεσουάρ).'
      ].join('\n')
    : [
        '',
        'Οδηγίες προετοιμασίας:',
        '• Καλή ενυδάτωση.',
        '• Φέρτε τυχόν ενημερωμένες εξετάσεις ή ημερολόγιο διατροφής.'
      ].join('\n');

  return [
    `Καλησπέρα ${name}!`,
    '',
    `Υπενθύμιση ραντεβού στο διαιτολογικό γραφείο της Χάρις Φωτούδη.`,
    `Ημερομηνία: ${d}`,
    `Ώρα: ${t}`,
    prep,
    '',
    'Αν χρειαστείτε αλλαγή, απαντήστε σε αυτό το μήνυμα.',
    '— NutriCharis · Χάρις Φωτούδη'
  ].join('\n');
}

export async function copyTextToClipboard(text) {
  const value = String(text || '');
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

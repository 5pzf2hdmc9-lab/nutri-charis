import { sanitizeText } from './authAccess';

function pad(n) {
  return String(n).padStart(2, '0');
}

/** Local wall-clock → Google Calendar / ICS compact UTC-ish stamp (no Z = floating local). */
export function toCalendarStamp(dateStr, timeStr, durationMinutes = 60) {
  const d = sanitizeText(String(dateStr || ''), 16);
  const t = sanitizeText(String(timeStr || '10:00').slice(0, 5), 8) || '10:00';
  const [y, m, day] = d.split('-').map(Number);
  const [hh, mm] = t.split(':').map(Number);
  if (!y || !m || !day || Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const start = new Date(y, m - 1, day, hh, mm || 0, 0);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + Math.max(15, Number(durationMinutes) || 60) * 60 * 1000);
  const fmt = (dt) =>
    `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
  return { startStamp: fmt(start), endStamp: fmt(end), start, end };
}

export function buildGoogleCalendarUrl({
  title,
  details,
  location,
  date,
  time,
  durationMinutes = 60
}) {
  const stamps = toCalendarStamp(date, time, durationMinutes);
  if (!stamps) return null;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: sanitizeText(title, 160) || 'Ραντεβού NutriCharis',
    dates: `${stamps.startStamp}/${stamps.endStamp}`,
    details: sanitizeText(details, 800),
    location: sanitizeText(location, 200) || 'Διαιτολογικό γραφείο Χάρις Φωτούδη'
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsContent({
  title,
  details,
  location,
  date,
  time,
  durationMinutes = 60,
  uid
}) {
  const stamps = toCalendarStamp(date, time, durationMinutes);
  if (!stamps) return null;
  const now = new Date();
  const stampNow = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const safeUid = sanitizeText(uid || `nutricharis-${date}-${time}`, 120)
    .replace(/[\r\n]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._@-]/g, '');
  const escapeIcs = (s) =>
    sanitizeText(s, 800)
      .replace(/[\r\n]+/g, ' ')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NutriCharis//Practice//EL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${safeUid}@nutricharis`,
    `DTSTAMP:${stampNow}`,
    `DTSTART:${stamps.startStamp}`,
    `DTEND:${stamps.endStamp}`,
    `SUMMARY:${escapeIcs(title || 'Ραντεβού NutriCharis')}`,
    `DESCRIPTION:${escapeIcs(details || '')}`,
    `LOCATION:${escapeIcs(location || 'Διαιτολογικό γραφείο Χάρις Φωτούδη')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

export function downloadIcsFile(filename, icsBody) {
  if (typeof document === 'undefined' || !icsBody) return false;
  const blob = new Blob([icsBody], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = sanitizeText(filename || 'nutricharis-appointment.ics', 80) || 'appointment.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

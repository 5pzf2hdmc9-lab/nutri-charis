import { normalizeAppointmentStatus } from '../constants/appointments';

export function isAppointmentPast(appt, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const d = String(appt?.date || '');
  const t = String(appt?.time || '00:00').slice(0, 5);
  return d < today || (d === today && t < hm);
}

/** Practice-wide day board from visible appointments. */
export function practicePulse(appointments = [], now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 7);
  const weekEnd = horizon.toISOString().slice(0, 10);
  const pulse = { today: 0, week: 0, noshow: 0, unresolved: 0 };
  appointments.forEach((a) => {
    const d = String(a.date || '');
    const status = normalizeAppointmentStatus(a.status);
    const cancelled = status === 'Ακυρώθηκε';
    if (d === today && !cancelled) pulse.today += 1;
    if (d >= today && d <= weekEnd && !cancelled && status !== 'No-show') pulse.week += 1;
    if (d.startsWith(month) && status === 'No-show') pulse.noshow += 1;
    if (isAppointmentPast(a, now) && status === 'Προγραμματισμένο') pulse.unresolved += 1;
  });
  return pulse;
}

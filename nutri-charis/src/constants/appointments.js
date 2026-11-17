
export const APPOINTMENT_TYPES = [
  '1η Συνεδρία & Λιπομέτρηση',
  'Επανελέγχου & Παρακολούθηση',
  'Online Coaching Check-in',
  'Τακτική συνεδρία'
];

export const APPOINTMENT_STATUSES = ['Προγραμματισμένο', 'Ολοκληρωμένο', 'No-show', 'Ακυρώθηκε'];

export function normalizeAppointmentStatus(status) {
  return APPOINTMENT_STATUSES.includes(status) ? status : 'Προγραμματισμένο';
}

export function nextAppointmentStatus(status) {
  const current = normalizeAppointmentStatus(status);
  const i = APPOINTMENT_STATUSES.indexOf(current);
  return APPOINTMENT_STATUSES[(i + 1) % APPOINTMENT_STATUSES.length];
}

export function appointmentBadge(status) {
  const label = normalizeAppointmentStatus(status);
  if (label === 'Ολοκληρωμένο') return 'status-badge--info';
  if (label === 'No-show') return 'status-badge--warn';
  if (label === 'Ακυρώθηκε') return 'status-badge--danger';
  return 'status-badge--success';
}

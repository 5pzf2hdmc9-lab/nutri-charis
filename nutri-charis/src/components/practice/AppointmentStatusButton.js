import { appointmentBadge, normalizeAppointmentStatus } from '../../constants/appointments';

export default function AppointmentStatusButton({ status, onCycle }) {
  const label = normalizeAppointmentStatus(status);
  if (typeof onCycle !== 'function') {
    return <span className={`status-badge ${appointmentBadge(label)}`}>{label}</span>;
  }
  return (
    <button
      type="button"
      className={`status-badge ${appointmentBadge(label)}`}
      onClick={onCycle}
      title="Επόμενη έκβαση"
      style={{ cursor: 'pointer', font: 'inherit' }}
    >
      {label}
    </button>
  );
}

import EmptyState from '../ui/EmptyState';
import AppointmentStatusButton from '../../practice/AppointmentStatusButton';
import PracticePulse from '../../practice/PracticePulse';
import ReminderCopyButton from '../../practice/ReminderCopyButton';
import { APPOINTMENT_TYPES, normalizeAppointmentStatus } from '../../../constants/appointments';
import { sanitizeText } from '../../../lib/authAccess';
import { normalizePhoneE164 } from '../../../lib/notifyLinks';
import { usePlatform } from '../platformContext';

const FILTERS = [
  { id: 'upcoming', label: 'Επερχόμενα' },
  { id: 'past', label: 'Παρελθόντα' },
  { id: 'outcome', label: 'Χωρίς έκβαση' },
  { id: 'all', label: 'Όλα' }
];

export default function AppointmentsTab() {
  const { activeClientObj, activeTab, apptDate, apptFilter, apptNotes, apptTime, apptType, clients, filteredAppointments, handleAddAppointment, handleCycleAppointmentStatus, handleDeleteAppointment, isAdmin, setApptDate, setApptFilter, setApptNotes, setApptTime, setApptType, visibleAppointments } = usePlatform();
  const filterLabel = FILTERS.find((f) => f.id === apptFilter)?.label || 'Επερχόμενα';
  return (
activeTab === 'appointments' && (
          <section className="luxury-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '13px' }}>
              <div>
                <h3 className="font-display" style={{ margin: 0, fontSize: '17.5px', fontWeight: '800' }}>Πρόγραμμα Συνεδριών</h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '11.5px', color: '#94a3b8' }}>
                  {visibleAppointments.length} συνολικά · φίλτρο: {filterLabel}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }} role="group" aria-label="Φίλτρο ραντεβού">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`filter-chip ${apptFilter === f.id ? 'filter-chip--on' : 'filter-chip--off'}`}
                    onClick={() => setApptFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {isAdmin && activeClientObj && (
              <form onSubmit={handleAddAppointment} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '9px', marginBottom: '16px', background: 'rgba(5,9,8,0.75)', padding: '13px', borderRadius: '13px' }}>
                <div>
                  <label className="field-label" htmlFor="appt-date">Ημερομηνία</label>
                  <input id="appt-date" className="luxury-input" type="date" value={apptDate} onChange={(e) => setApptDate(e.target.value)} required />
                </div>
                <div>
                  <label className="field-label" htmlFor="appt-time">Ώρα</label>
                  <input id="appt-time" className="luxury-input" type="time" value={apptTime} onChange={(e) => setApptTime(e.target.value)} required />
                </div>
                <div>
                  <label className="field-label" htmlFor="appt-type">Τύπος συνεδρίας</label>
                  <select id="appt-type" className="luxury-input" value={apptType} onChange={(e) => setApptType(e.target.value)}>
                    {APPOINTMENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="appt-notes">Σημειώσεις (προαιρετικά)</label>
                  <input id="appt-notes" className="luxury-input" type="text" value={apptNotes} onChange={(e) => setApptNotes(e.target.value)} placeholder="π.χ. επανέλεγχος μετρήσεων" />
                </div>
                <button type="submit" className="btn-emerald" style={{ padding: '11px', fontSize: '12px', cursor: 'pointer', alignSelf: 'end' }}>
                  + Κλείσιμο ({String(activeClientObj.name || 'πελάτη').trim().split(/\s+/)[0] || 'πελάτη'})
                </button>
              </form>
            )}

            {isAdmin && (
              <PracticePulse
                appointments={visibleAppointments}
                onReviewOutcomes={() => setApptFilter('outcome')}
              />
            )}

            <div style={{ display: 'grid', gap: '9px' }}>
              {visibleAppointments.length === 0 ? (
                <EmptyState
                  glyph="◷"
                  title="Κανένα ραντεβού ακόμα"
                  hint={
                    isAdmin && activeClientObj
                      ? `Κλείστε την πρώτη συνεδρία για ${String(activeClientObj.name || 'πελάτη').trim().split(/\s+/)[0] || 'πελάτη'} — ημερομηνία, ώρα και τύπος σε ένα βήμα.`
                      : 'Τα προγραμματισμένα ραντεβού θα εμφανιστούν εδώ.'
                  }
                />
              ) : filteredAppointments.length === 0 ? (
                <EmptyState
                  glyph="⌕"
                  title={
                    apptFilter === 'outcome'
                      ? 'Όλες οι περασμένες συνεδρίες έχουν έκβαση'
                      : apptFilter === 'upcoming'
                        ? 'Δεν υπάρχουν επερχόμενα ραντεβού'
                        : 'Δεν υπάρχουν παρελθόντα ραντεβού'
                  }
                  hint="Αλλάξτε φίλτρο σε «Όλα» για ολόκληρο το ιστορικό συνεδριών."
                  actionLabel="Εμφάνιση όλων"
                  onAction={() => setApptFilter('all')}
                />
              ) : (
                filteredAppointments.map((a) => {
                  const cl = clients.find(
                    (c) =>
                      String(c.id) === String(a.client_id || a.client) ||
                      (c.name || '').trim().toLowerCase() === String(a.client_name || a.client || '').trim().toLowerCase()
                  );
                  const displayName =
                    sanitizeText(a.client_name || cl?.name || a.client || 'Συνεδρία Πελάτη', 120) ||
                    'Συνεδρία Πελάτη';
                  const waPhone = normalizePhoneE164(cl?.phone);
                  const waMsg = encodeURIComponent(
                    `Καλησπέρα ${displayName}! Υπενθύμιση για το ραντεβού μας στο διαιτολογικό γραφείο της Χάρις Φωτούδη στις ${sanitizeText(a.date, 16)} και ώρα ${sanitizeText(String(a.time || '').slice(0, 5), 8)}.`
                  );
                  const now = new Date();
                  const today = now.toISOString().slice(0, 10);
                  const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                  const d = String(a.date || '');
                  const t = String(a.time || '00:00').slice(0, 5);
                  const isPastRow = d < today || (d === today && t < hm);
                  const outcome = normalizeAppointmentStatus(a.status);
                  const openVisit = outcome === 'Προγραμματισμένο';
                  return (
                    <div key={a.id} style={{ background: 'rgba(5,9,8,0.75)', padding: '12px 14px', borderRadius: '13px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', opacity: outcome === 'Ακυρώθηκε' ? 0.72 : 1 }}>
                      <div>
                        <strong style={{ color: '#fff', fontSize: '13.5px' }}>{displayName}</strong>
                        <div className="font-mono-num" style={{ fontSize: '11.5px', color: '#34d399', marginTop: '2px' }}>
                          {a.date} · {a.time} — <span style={{ color: '#94a3b8' }}>{a.notes || 'Συνεδρία'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                        {isAdmin && !isPastRow && openVisit && (
                          <ReminderCopyButton
                            clientName={displayName}
                            date={a.date}
                            time={a.time}
                            sessionNotes={a.notes}
                          />
                        )}
                        {isAdmin && waPhone && !isPastRow && openVisit && (
                          <a
                            href={`https://wa.me/${waPhone}?text=${waMsg}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: '5px 10px',
                              borderRadius: '99px',
                              background: 'rgba(34, 197, 94, 0.18)',
                              border: '1px solid rgba(34, 197, 94, 0.4)',
                              color: '#86efac',
                              fontSize: '10.5px',
                              fontWeight: '800',
                              textDecoration: 'none'
                            }}
                          >
                            💬 WhatsApp
                          </a>
                        )}
                        <AppointmentStatusButton
                          status={outcome}
                          onCycle={isAdmin ? () => handleCycleAppointmentStatus(a.id) : undefined}
                        />
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAppointment(a.id)}
                            aria-label="Διαγραφή ραντεβού"
                            style={{ background: 'rgba(239,68,68,0.14)', border: 'none', color: '#fca5a5', borderRadius: '8px', padding: '5px 8px', fontSize: '11px', cursor: 'pointer' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )
  );
}

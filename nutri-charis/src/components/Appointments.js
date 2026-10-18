import React from 'react';

export default function Appointments({
  selectedClient,
  appDate,
  setAppDate,
  appTime,
  setAppTime,
  appType,
  setAppType,
  addAppointment,
  appointments,
  setAppointments
}) {
  return (
    <div>
      <div className="card add-form-card" style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', color: '#064e3b', fontSize: '18px', fontWeight: '700' }}>
          📅 Online Κράτηση / Νέο Ραντεβού για: <span style={{ color: '#059669' }}>{selectedClient}</span>
        </h3>
        <form onSubmit={addAppointment}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Ημερομηνία</label>
              <input className="form-control" type="date" value={appDate} onChange={(e) => setAppDate(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Ώρα</label>
              <input className="form-control" type="time" value={appTime} onChange={(e) => setAppTime(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Τύπος Συνεδρίας</label>
              <select className="form-control" value={appType} onChange={(e) => setAppType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <option>1η Συνεδρία & Λιπομέτρηση</option>
                <option>Επανελέγχου & Παρακολούθηση</option>
                <option>Online Coaching Check-in</option>
              </select>
            </div>
          </div>
          <button className="btn-primary" type="submit" style={{ marginTop: '16px', padding: '12px 28px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
            + Κράτηση Ραντεβού
          </button>
        </form>
      </div>

      <div className="card" style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginBottom: '16px', color: '#064e3b', fontSize: '18px', fontWeight: '700' }}>🕒 Πρόγραμμα Ραντεβού Γραφείου</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          {appointments.length === 0 ? <p style={{ color: '#64748b', fontSize: '14px' }}>Δεν υπάρχουν προγραμματισμένα ραντεβού.</p> : null}
          {appointments
            .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
            .map(a => (
              <div key={a.id} style={{ padding: '14px 18px', background: '#f8fafc', borderRadius: '12px', borderLeft: '5px solid #059669', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0', borderLeftWidth: '5px' }}>
                <div>
                  <strong style={{ fontSize: '15px', color: '#064e3b' }}>🗓️ {a.date} — ⏰ {a.time}</strong>
                  <div style={{ fontSize: '14px', fontWeight: '700', marginTop: '4px' }}>👤 {a.client}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>📌 {a.type}</div>
                </div>
                <button onClick={() => setAppointments(appointments.filter(x => x.id !== a.id))} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Διαγραφή</button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
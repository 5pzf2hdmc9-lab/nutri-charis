import React from 'react';

export default function Measurements({
  selectedClient,
  userRole,
  addMeasurement,
  mWeight,
  setMWeight,
  mFat,
  setMFat,
  clientMeasurements
}) {
  return (
    <div className="card" style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      <h3 style={{ marginBottom: '16px', color: '#064e3b', fontSize: '18px', fontWeight: '700' }}>
        📊 Ιστορικό Σώματος & Λιπομέτρησης: <span style={{ color: '#059669' }}>{selectedClient}</span>
      </h3>
      
      {userRole === 'admin' && (
        <form onSubmit={addMeasurement} className="no-print" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Βάρος (kg)</label>
              <input className="form-control" placeholder="π.χ. 67.5" type="number" step="0.1" value={mWeight} onChange={(e) => setMWeight(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Ποσοστό Λίπους (%)</label>
              <input className="form-control" placeholder="π.χ. 26.4" type="number" step="0.1" value={mFat} onChange={(e) => setMFat(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
          </div>
          <button className="btn-primary" type="submit" style={{ marginTop: '16px', padding: '12px 28px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
            + Αποθήκευση Μέτρησης
          </button>
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
        <thead>
          <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
            <th style={{ padding: '12px', color: '#334155' }}>Ημερομηνία</th>
            <th style={{ padding: '12px', color: '#334155' }}>Βάρος</th>
            <th style={{ padding: '12px', color: '#334155' }}>Λίπος</th>
          </tr>
        </thead>
        <tbody>
          {(!clientMeasurements[selectedClient] || clientMeasurements[selectedClient].length === 0) ? (
            <tr><td colSpan="3" style={{ padding: '20px', color: '#64748b', textAlign: 'center' }}>Δεν υπάρχουν μετρήσεις για αυτόν τον πελάτη.</td></tr>
          ) : (
            clientMeasurements[selectedClient].map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px', color: '#0f172a' }}>{m.date}</td>
                <td style={{ padding: '12px', fontWeight: '700', color: '#065f46' }}>{m.weight} kg</td>
                <td style={{ padding: '12px', color: '#0f172a' }}>{m.fat}%</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
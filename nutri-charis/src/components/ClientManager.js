import React from 'react';

export default function ClientManager({ 
  clients, 
  selectedClient, 
  setSelectedClient, 
  setActiveTab, 
  deleteClient, 
  startEditClient, 
  addClient, 
  clientName, 
  setClientName, 
  clientGoal, 
  setClientGoal, 
  clientPhone, 
  setClientPhone, 
  handleImageUpload 
}) {
  return (
    <div>
      <div className="card" style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', color: '#064e3b', fontSize: '18px', fontWeight: '700' }}>✨ Προσθήκη Νέου Πελάτη</h3>
        <form onSubmit={addClient}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Ονοματεπώνυμο</label>
              <input className="form-control" placeholder="π.χ. Μαρία Παπαδοπούλου" value={clientName} onChange={(e) => setClientName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Στόχος Διατροφής</label>
              <input className="form-control" placeholder="π.χ. Απώλεια Λίπους" value={clientGoal} onChange={(e) => setClientGoal(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Τηλέφωνο</label>
              <input className="form-control" placeholder="π.χ. 6912345678" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Φωτογραφία Προφίλ (Upload)</label>
            <input className="form-control" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, false)} style={{ background: 'white', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', width: '100%' }} />
          </div>
          <button className="btn-primary" type="submit" style={{ marginTop: '16px', padding: '12px 24px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
            + Δημιουργία Φακέλου
          </button>
        </form>
      </div>

      <div className="card" style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginBottom: '16px', color: '#064e3b', fontSize: '18px', fontWeight: '700' }}>📂 Κατάλογος Πελατών ({clients.length})</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          {clients.map(c => (
            <div key={c.id} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img src={c.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.name)}`} alt="avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <strong style={{ fontSize: '16px', color: '#0f172a' }}>{c.name}</strong>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                    🎯 {c.goal} {c.phone && `• 📞 ${c.phone}`}
                  </div>
                  <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px', fontWeight: '600' }}>
                    ⚖️ {c.weight || '--'}kg | 📏 {c.height || '--'}cm | 🎂 {c.age || '--'} ετών | 🔥 BMR: {c.bmr || '--'} | TDEE: {c.tdee || '--'} kcal
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setSelectedClient(c.name); setActiveTab('mealplanner'); }} style={{ padding: '8px 16px', fontSize: '12px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                  📋 Πλάνο
                </button>
                <button onClick={() => startEditClient(c)} style={{ padding: '8px 16px', fontSize: '12px', background: '#d97706', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                  ✏️ Επεξεργασία
                </button>
                <button onClick={() => deleteClient(c.id)} style={{ padding: '8px 16px', fontSize: '12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                  Διαγραφή
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
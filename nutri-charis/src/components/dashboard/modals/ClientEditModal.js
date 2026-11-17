import MultiChipGroup from '../ui/MultiChipGroup';
import { ACTIVITY_FACTORS, CALORIE_DELTAS } from '../../../constants/metabolismOptions';
import { usePlatform } from '../platformContext';

export default function ClientEditModal() {
  const { editAge, editGender, editGoal, editHeight, editName, editPhone, editQ, editWeight, editingClient, isAdmin, saveClientEdit, setEditAge, setEditGender, setEditGoal, setEditHeight, setEditName, setEditPhone, setEditQ, setEditWeight, setEditingClient, toggleEditArrayItem } = usePlatform();
  return (
editingClient && isAdmin && (
        <div
          className="no-print glass-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,

            zIndex: 350,
            overflowY: 'auto',
            padding: '16px 12px'
          }}
        >
          <div className="luxury-card" style={{ maxWidth: '720px', margin: '0 auto', padding: '20px', animation: 'fadeInSlide 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800' }}>✏️ Επεξεργασία Φακέλου — {editingClient.name}</h3>
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#cbd5e1', width: '32px', height: '32px', borderRadius: '9px', cursor: 'pointer', fontWeight: '800' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveClientEdit} style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Ονοματεπώνυμο</label>
                  <input className="luxury-input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Τηλέφωνο</label>
                  <input className="luxury-input" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Φύλο</label>
                  <select className="luxury-input" value={editGender} onChange={(e) => setEditGender(e.target.value)}>
                    <option value="female">Γυναίκα</option>
                    <option value="male">Άνδρας</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Ηλικία</label>
                  <input className="luxury-input" type="number" value={editAge} onChange={(e) => setEditAge(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Βάρος (kg)</label>
                  <input className="luxury-input" type="number" step="0.1" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Ύψος (cm)</label>
                  <input className="luxury-input" type="number" value={editHeight} onChange={(e) => setEditHeight(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Στόχος</label>
                  <input className="luxury-input" value={editGoal} onChange={(e) => setEditGoal(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Επίπεδο Δραστηριότητας</label>
                  <select className="luxury-input" value={editQ.activityLevel || 1.375} onChange={(e) => setEditQ({ ...editQ, activityLevel: parseFloat(e.target.value) })}>
                    {ACTIVITY_FACTORS.map((af) => (
                      <option key={af.value} value={af.value}>{af.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Εξίσωση BMR</label>
                  <select className="luxury-input" value={editQ.bmrFormula || 'mifflin'} onChange={(e) => setEditQ({ ...editQ, bmrFormula: e.target.value })}>
                    <option value="mifflin">Mifflin-St Jeor</option>
                    <option value="harris">Harris-Benedict</option>
                    <option value="katch">Katch-McArdle</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Θερμιδικό Δέλτα</label>
                  <select className="luxury-input" value={editQ.calorieDelta || 0} onChange={(e) => setEditQ({ ...editQ, calorieDelta: Number(e.target.value) })}>
                    {CALORIE_DELTAS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Πόσιμο Νερό</label>
                  <select className="luxury-input" value={editQ.waterIntake || '1.5 - 2 λίτρα'} onChange={(e) => setEditQ({ ...editQ, waterIntake: e.target.value })}>
                    <option value="Λιγότερο από 1 λίτρο">&lt; 1 λίτρο</option>
                    <option value="1 - 1.5 λίτρα">1 - 1.5 λίτρα</option>
                    <option value="1.5 - 2 λίτρα">1.5 - 2 λίτρα</option>
                    <option value="Πάνω από 2.5 λίτρα">2.5+ λίτρα</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '5px' }}>Προβλήματα Υγείας / Αλλεργίες</label>
                <MultiChipGroup
                  options={['Θυρεοειδής', 'Χοληστερίνη', 'Αναιμία / Σίδηρος', 'Πίεση', 'Ουρικό Οξύ', 'Χολή', 'Καρδιά', 'Αλλεργίες / Δυσανεξίες']}
                  values={editQ.healthConditions}
                  onToggle={(v) => toggleEditArrayItem('healthConditions', v)}
                />
                <input
                  className="luxury-input"
                  style={{ marginTop: '7px' }}
                  placeholder="Επιπλέον κλινικές σημειώσεις / γαστρεντερικά..."
                  value={editQ.healthOther || ''}
                  onChange={(e) => setEditQ({ ...editQ, healthOther: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Φάρμακα</label>
                  <input className="luxury-input" value={editQ.medications || ''} onChange={(e) => setEditQ({ ...editQ, medications: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Συμπληρώματα</label>
                  <input className="luxury-input" value={editQ.supplements || ''} onChange={(e) => setEditQ({ ...editQ, supplements: e.target.value })} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '5px' }}>Προτιμήσεις Φρούτων & Λαχανικών</label>
                <MultiChipGroup
                  options={['Μήλο', 'Μπανάνα', 'Πορτοκάλι', 'Μύρτιλα/Φράουλες', 'Ακτινίδιο', 'Αβοκάντο', 'Μπρόκολο', 'Σπανάκι', 'Ντομάτα/Αγγούρι', 'Γλυκοπατάτα']}
                  values={editQ.preferredFruits}
                  onToggle={(v) => toggleEditArrayItem('preferredFruits', v)}
                />
              </div>

              <div style={{ display: 'flex', gap: '9px', marginTop: '4px' }}>
                <button type="button" onClick={() => setEditingClient(null)} style={{ padding: '11px 15px', background: 'rgba(255,255,255,0.07)', color: '#cbd5e1', border: 'none', borderRadius: '11px', fontWeight: '700', cursor: 'pointer' }}>
                  Ακύρωση
                </button>
                <button type="submit" style={{ flex: 1, padding: '11px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '11px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer' }}>
                  ✓ Αποθήκευση Αλλαγών
                </button>
              </div>
            </form>
          </div>
        </div>
      )
  );
}

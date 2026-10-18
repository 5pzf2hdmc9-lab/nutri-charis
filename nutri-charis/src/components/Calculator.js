import React from 'react';

export default function Calculator({
  selectedClient,
  calcFormula,
  setCalcFormula,
  gender,
  setGender,
  age,
  setAge,
  weight,
  setWeight,
  height,
  setHeight,
  activity,
  setActivity,
  calculateBmr,
  activeClientObj
}) {
  return (
    <div className="card" style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      <h3 style={{ marginBottom: '8px', color: '#064e3b', fontSize: '18px', fontWeight: '700' }}>
        🧮 Υπολογιστής BMR & Ημερήσιων Θερμίδων για: <span style={{ color: '#059669' }}>{selectedClient}</span>
      </h3>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px' }}>Τα αποτελέσματα αποθηκεύονται αυτόματα στο προφίλ του πελάτη!</p>

      <div className="form-group" style={{ marginBottom: '18px' }}>
        <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Εξίσωση Υπολογισμού</label>
        <select className="form-control" value={calcFormula} onChange={(e) => setCalcFormula(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '700', color: '#064e3b' }}>
          <option value="mifflin">Mifflin-St Jeor (Συνιστάται από ADA / Academy of Nutrition)</option>
          <option value="harris">Revised Harris-Benedict (1984)</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="form-group">
          <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Φύλο</label>
          <select className="form-control" value={gender} onChange={(e) => setGender(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <option value="female">Γυναίκα</option>
            <option value="male">Άνδρας</option>
          </select>
        </div>
        <div className="form-group">
          <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Ηλικία (έτη)</label>
          <input className="form-control" type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
        </div>
        <div className="form-group">
          <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Βάρος (kg)</label>
          <input className="form-control" type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
        </div>
        <div className="form-group">
          <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Ύψος (cm)</label>
          <input className="form-control" type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
        </div>
      </div>

      <div className="form-group" style={{ marginTop: '16px' }}>
        <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Επίπεδο Δραστηριότητας (PAL)</label>
        <select className="form-control" value={activity} onChange={(e) => setActivity(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <option value={1.2}>Καθιστική ζωή (1.2)</option>
          <option value={1.375}>Ελαφριά άσκηση 1-3/εβδ (1.375)</option>
          <option value={1.55}>Μέτρια άσκηση 3-5/εβδ (1.55)</option>
          <option value={1.725}>Έντονη άσκηση 6-7/εβδ (1.725)</option>
        </select>
      </div>

      <button onClick={calculateBmr} style={{ marginTop: '20px', padding: '12px 24px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
        💾 Υπολογισμός & Αποθήκευση στο Προφίλ
      </button>

      {activeClientObj?.bmr && (
        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#047857', fontWeight: 'bold' }}>Βασικός Μεταβολισμός (BMR)</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#064e3b', marginTop: '4px' }}>{activeClientObj.bmr} kcal</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#047857', fontWeight: 'bold' }}>Θερμίδες Συντήρησης (TDEE)</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#064e3b', marginTop: '4px' }}>{activeClientObj.tdee} kcal</div>
          </div>
        </div>
      )}
    </div>
  );
}
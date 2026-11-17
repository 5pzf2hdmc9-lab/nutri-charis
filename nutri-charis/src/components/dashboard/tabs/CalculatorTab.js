import { ACTIVITY_FACTORS } from '../../../constants/metabolismOptions';
import { usePlatform } from '../platformContext';

export default function CalculatorTab() {
  const { activeClientObj, activeFormula, activeTab, calcActivity, calcAge, calcBodyFat, calcGender, calcHeight, calcResult, calcWeight, handleSwitchClientFormula, isAdmin, setCalcActivity, setCalcAge, setCalcBodyFat, setCalcGender, setCalcHeight, setCalcWeight } = usePlatform();
  return (
activeTab === 'calculator' && (
          <section className="luxury-card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '17.5px', fontWeight: '800' }}>⚡ Μεταβολικός Υπολογιστής (Mifflin, Harris & Katch-McArdle)</h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '11.5px', color: '#94a3b8' }}>
              Συγκρίνετε τις 3 εξισώσεις και εφαρμόστε την επιθυμητή στον φάκελο του πελάτη με 1 κλικ.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '9px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Φύλο</label>
                <select className="luxury-input" value={calcGender} onChange={(e) => setCalcGender(e.target.value)}>
                  <option value="female">Γυναίκα</option>
                  <option value="male">Άνδρας</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Ηλικία</label>
                <input className="luxury-input" type="number" value={calcAge} onChange={(e) => setCalcAge(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Βάρος (kg)</label>
                <input className="luxury-input" type="number" step="0.1" value={calcWeight} onChange={(e) => setCalcWeight(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Ύψος (cm)</label>
                <input className="luxury-input" type="number" value={calcHeight} onChange={(e) => setCalcHeight(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>% Λίπος (Katch)</label>
                <input className="luxury-input" type="number" step="0.1" placeholder="π.χ. 22" value={calcBodyFat} onChange={(e) => setCalcBodyFat(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Δραστηριότητα</label>
                <select className="luxury-input" style={{ fontSize: '12.5px' }} value={calcActivity} onChange={(e) => setCalcActivity(parseFloat(e.target.value))}>
                  {ACTIVITY_FACTORS.map((af) => (
                    <option key={af.value} value={af.value}>{af.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px' }}>
              {[
                { key: 'mifflin', title: 'Mifflin-St Jeor (Κλινικό)', accent: '#34d399', data: calcResult.mifflin },
                { key: 'harris', title: 'Harris-Benedict (Revised)', accent: '#fbbf24', data: calcResult.harris },
                { key: 'katch', title: `Katch-McArdle (LBM ${calcResult.katch.lbm}kg)`, accent: '#38bdf8', data: calcResult.katch }
              ].map((eq) => (
                <div
                  key={eq.key}
                  style={{
                    background: 'rgba(5, 9, 8, 0.85)',
                    padding: '16px',
                    borderRadius: '15px',
                    border: activeFormula === eq.key ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: eq.accent }}>{eq.title}</span>
                    {activeFormula === eq.key && (
                      <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', padding: '2px 8px', borderRadius: '99px', fontWeight: '700' }}>
                        Ενεργή
                      </span>
                    )}
                  </div>

                  <div className="font-mono-num" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '7px', textAlign: 'center', marginBottom: '10px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '9px 4px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>BMR</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{eq.data.bmr}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '9px 4px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>TDEE</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#fbbf24' }}>{eq.data.tdee}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '9px 4px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>BMI</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#38bdf8' }}>{eq.data.bmi}</div>
                    </div>
                  </div>

                  {isAdmin && activeClientObj && (
                    <button
                      type="button"
                      onClick={() => handleSwitchClientFormula(eq.key)}
                      style={{
                        width: '100%',
                        padding: '9px',
                        borderRadius: '10px',
                        border: activeFormula === eq.key ? '1px solid #10b981' : 'none',
                        background: activeFormula === eq.key ? 'rgba(16, 185, 129, 0.18)' : '#10b981',
                        color: activeFormula === eq.key ? '#6ee7b7' : '#fff',
                        fontWeight: '800',
                        fontSize: '11.5px',
                        cursor: 'pointer'
                      }}
                    >
                      {activeFormula === eq.key
                        ? `✓ Ενεργή για ${activeClientObj.name}`
                        : `Εφαρμογή στον/στην ${activeClientObj.name}`}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )
  );
}

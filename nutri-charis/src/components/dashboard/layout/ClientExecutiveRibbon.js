import { CALORIE_DELTAS } from '../../../constants/metabolismOptions';
import { usePlatform } from '../platformContext';

export default function ClientExecutiveRibbon() {
  const { activeCalorieDelta, activeClientObj, activeFormula, activeTargetKcal, activeTdee, clientMetabolism, handleChangeCalorieDelta, handleSwitchClientFormula, isAdmin, latestBodyFat } = usePlatform();
  return (
activeClientObj && (
          <section
            className="luxury-card"
            style={{
              padding: '15px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '13px',
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(245,158,11,0.2))',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  fontWeight: '800',
                  color: '#6ee7b7',
                  flexShrink: 0
                }}
              >
                {(activeClientObj.name || 'Π').slice(0, 2).toUpperCase()}
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800' }}>{activeClientObj.name}</h2>
                  <span style={{ fontSize: '11px', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '99px' }}>
                    {activeClientObj.gender === 'male' ? 'Άνδρας' : 'Γυναίκα'} • {activeClientObj.age}ε • {activeClientObj.weight}kg • {activeClientObj.height}cm • BMI{' '}
                    <strong style={{ color: '#38bdf8' }}>{clientMetabolism.mifflin.bmi}</strong>
                    {latestBodyFat !== null && (
                      <>
                        {' '}• Λίπος <strong style={{ color: '#fbbf24' }}>{latestBodyFat}%</strong>
                      </>
                    )}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#34d399', marginTop: '3px', fontWeight: '600' }}>
                  🎯 {activeClientObj.goal || 'Ισορροπημένη διατροφή'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {isAdmin && (
                <>
                  <div style={{ background: 'rgba(5, 9, 8, 0.75)', padding: '3px', borderRadius: '11px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '2px' }}>
                    {[
                      { id: 'mifflin', label: 'Mifflin' },
                      { id: 'harris', label: 'Harris' },
                      { id: 'katch', label: 'Katch' }
                    ].map((eq) => (
                      <button
                        key={eq.id}
                        type="button"
                        onClick={() => handleSwitchClientFormula(eq.id)}
                        style={{
                          padding: '5px 8px',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '10.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          background: activeFormula === eq.id ? '#10b981' : 'transparent',
                          color: activeFormula === eq.id ? '#fff' : '#94a3b8'
                        }}
                      >
                        {eq.label}
                      </button>
                    ))}
                  </div>

                  <select
                    value={activeCalorieDelta}
                    onChange={(e) => handleChangeCalorieDelta(e.target.value)}
                    title="Θερμιδικός Στόχος επί του TDEE"
                    style={{
                      background: 'rgba(5, 9, 8, 0.85)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      color: '#fbbf24',
                      borderRadius: '10px',
                      padding: '6px 9px',
                      fontSize: '11px',
                      fontWeight: '800',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {CALORIE_DELTAS.map((d) => (
                      <option key={d.value} value={d.value} style={{ background: '#0b1210' }}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '6px 10px', borderRadius: '11px', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700' }}>TDEE</div>
                  <div className="font-mono-num" style={{ fontSize: '13.5px', fontWeight: '800', color: '#e2e8f0' }}>{activeTdee}</div>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.14)', padding: '6px 10px', borderRadius: '11px', border: '1px solid rgba(16, 185, 129, 0.4)', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#6ee7b7', fontWeight: '700' }}>ΣΤΟΧΟΣ</div>
                  <div className="font-mono-num" style={{ fontSize: '13.5px', fontWeight: '800', color: '#34d399' }}>{activeTargetKcal} kcal</div>
                </div>
              </div>
            </div>
          </section>
        )
  );
}

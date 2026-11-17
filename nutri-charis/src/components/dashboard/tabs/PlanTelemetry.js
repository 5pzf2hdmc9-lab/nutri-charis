import WeeklyEnergySvgChart from '../charts/WeeklyEnergySvgChart';
import WeeklyDayMacrosTable from '../../plan/WeeklyDayMacrosTable';
import { DAYS } from '../../../constants/dietPlan';
import { computeMacroTargets } from '../../../lib/macroTargets';
import { FDA_MICROS, fdaPercent, resolveFdaDv } from '../../../lib/nutrition-math';
import { usePlatform } from '../platformContext';

export default function PlanTelemetry() {
  const { activeBmr, activeClientObj, activeTargetKcal, activeTdee, dayNutrition, enableAllFdaMicros, fdaLoading, handleExactFdaAnalysis, isAdmin, selectedDay, selectedMicros, setSelectedDay, toggleTrackedMicro, weeklyStats } = usePlatform();
  const dvProfile = { gender: activeClientObj?.gender, age: activeClientObj?.age };
  const kcalPct = Math.min(100, Math.round((dayNutrition.kcal / Math.max(1, activeTargetKcal)) * 100));
  const macroTotalKcal = Math.max(1, dayNutrition.protein * 4 + dayNutrition.carbs * 4 + dayNutrition.fat * 9);
  const pPct = Math.round(((dayNutrition.protein * 4) / macroTotalKcal) * 100);
  const cPct = Math.round(((dayNutrition.carbs * 4) / macroTotalKcal) * 100);
  const fPct = Math.round(((dayNutrition.fat * 9) / macroTotalKcal) * 100);
  const proteinPerKg = activeClientObj?.weight
    ? (dayNutrition.protein / Math.max(1, Number(activeClientObj.weight))).toFixed(1)
    : '0.0';
  return (
            <section className="luxury-card" style={{ padding: '18px 20px', display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="font-display" style={{ fontSize: '14px', fontWeight: '800', color: '#ecfdf5' }}>Διατροφική Τηλεμετρία</span>
                  <span className="status-badge status-badge--success">{selectedDay}</span>
                </div>

                <div className="no-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '5px', overflowX: 'auto', maxWidth: '100%' }}>
                  {DAYS.map((day) => {
                    const isSel = selectedDay === day;
                    return (
                      <button
                        key={day}
                        type="button"
                        className="day-pill"
                        onClick={() => setSelectedDay(day)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '9px',
                          fontSize: '11px',
                          fontWeight: isSel ? '800' : '600',
                          border: isSel ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.08)',
                          background: isSel ? '#10b981' : 'rgba(255,255,255,0.04)',
                          color: isSel ? '#fff' : '#cbd5e1',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleExactFdaAnalysis}
                      disabled={fdaLoading}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '9px',
                        fontSize: '11px',
                        fontWeight: '800',
                        border: '1px solid rgba(245, 158, 11, 0.45)',
                        background: 'rgba(245, 158, 11, 0.16)',
                        color: '#fbbf24',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {fdaLoading ? 'Ανάλυση…' : 'FDA AI'}
                    </button>
                  )}
                </div>
              </div>

              <WeeklyEnergySvgChart
                weeklyStats={weeklyStats}
                targetKcal={activeTargetKcal}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
              />

              <WeeklyDayMacrosTable
                weeklyStats={weeklyStats}
                targetKcal={activeTargetKcal}
                weightKg={activeClientObj?.weight}
                bmr={activeBmr}
                tdee={activeTdee}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
              />

              {/* ZONE 1: 5 CORE METRICS */}
              <div className="telemetry-core-grid">
                <div style={{ background: 'rgba(5, 9, 8, 0.75)', padding: '11px 12px', borderRadius: '13px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '700' }}>ΘΕΡΜΙΔΕΣ</div>
                  <div className="font-mono-num" style={{ fontSize: '17px', fontWeight: '800', color: '#34d399', margin: '2px 0' }}>
                    {dayNutrition.kcal} <span style={{ fontSize: '10.5px' }}>kcal</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${kcalPct}%`, height: '100%', background: '#10b981' }} />
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '4px' }}>{kcalPct}% στόχου ({activeTargetKcal})</div>
                </div>

                <div style={{ background: 'rgba(5, 9, 8, 0.75)', padding: '11px 12px', borderRadius: '13px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '700' }}>ΠΡΩΤΕΪΝΗ</div>
                  <div className="font-mono-num" style={{ fontSize: '17px', fontWeight: '800', color: '#38bdf8', margin: '2px 0' }}>
                    {dayNutrition.protein} <span style={{ fontSize: '10.5px' }}>g</span>
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '5px' }}>{pPct}% • {proteinPerKg} g/kg</div>
                </div>

                <div style={{ background: 'rgba(5, 9, 8, 0.75)', padding: '11px 12px', borderRadius: '13px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '700' }}>ΥΔΑΤΑΝΘΡΑΚΕΣ</div>
                  <div className="font-mono-num" style={{ fontSize: '17px', fontWeight: '800', color: '#fbbf24', margin: '2px 0' }}>
                    {dayNutrition.carbs} <span style={{ fontSize: '10.5px' }}>g</span>
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '5px' }}>{cPct}% θερμίδων</div>
                </div>

                <div style={{ background: 'rgba(5, 9, 8, 0.75)', padding: '11px 12px', borderRadius: '13px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '700' }}>ΛΙΠΑΡΑ</div>
                  <div className="font-mono-num metric-fat" style={{ fontSize: '17px', fontWeight: '800', margin: '2px 0' }}>
                    {dayNutrition.fat} <span style={{ fontSize: '10.5px' }}>g</span>
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '5px' }}>{fPct}% θερμίδων</div>
                </div>

                <div style={{ background: 'rgba(5, 9, 8, 0.75)', padding: '11px 12px', borderRadius: '13px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '700' }}>ΦΥΤΙΚΕΣ ΙΝΕΣ</div>
                  <div className="font-mono-num" style={{ fontSize: '17px', fontWeight: '800', color: '#a3e635', margin: '2px 0' }}>
                    {dayNutrition.micros?.fiber ?? 0} <span style={{ fontSize: '10.5px' }}>g</span>
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b', marginTop: '5px' }}>
                    Στόχος {computeMacroTargets({ targetKcal: activeTargetKcal, weightKg: activeClientObj?.weight }).fiber}g · Νερό {dayNutrition.totalWater}ml
                  </div>
                </div>
              </div>

              {/* ZONE 2: SELECTED FDA MICRONUTRIENTS (27 official DVs, sex/age % bars) */}
              {selectedMicros.length > 0 && (
                <div className="telemetry-micro-grid">
                  {FDA_MICROS.filter((m) => selectedMicros.includes(m.key)).map((m) => {
                    const val = dayNutrition.micros?.[m.key] ?? 0;
                    const dv = resolveFdaDv(m.key, dvProfile);
                    const pct = fdaPercent(val, dv);
                    return (
                      <div key={m.key} style={{ background: 'rgba(5, 9, 8, 0.75)', padding: '10px 12px', borderRadius: '13px', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ fontSize: '9.5px', color: m.color, fontWeight: '800' }}>{m.label}</div>
                        <div className="font-mono-num" style={{ fontSize: '16.5px', fontWeight: '800', color: '#fff', margin: '2px 0' }}>
                          {val} <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>{m.unit}</span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: m.color }} />
                        </div>
                        <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>
                          {pct}% DV · {dv}{m.unit} ({activeClientObj?.gender === 'male' ? 'Α' : 'Γ'} {activeClientObj?.age || '—'}ε)
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {isAdmin && (
                <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: '700' }}>FDA Πάνελ (27 DV):</span>
                    <span className="status-badge status-badge--info">{FDA_MICROS.length} μικροθρεπτικά</span>
                    <button
                      type="button"
                      className="filter-chip filter-chip--on"
                      onClick={enableAllFdaMicros}
                      style={{ padding: '4px 8px', fontSize: '10px' }}
                    >
                      Εμφάνιση όλων
                    </button>
                  </div>
                  {selectedMicros.length === 0 ? (
                    <div className="empty-state" role="status" style={{ minHeight: 0, padding: '12px 10px' }}>
                      <p className="empty-state__title font-display" style={{ fontSize: 12 }}>Κανένα μικροθρεπτικό ενεργό</p>
                      <p className="empty-state__hint">Επιλέξτε chips ή πατήστε «Εμφάνιση όλων» για τα 27 FDA DV.</p>
                    </div>
                  ) : null}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                    {FDA_MICROS.map((m) => {
                      const active = selectedMicros.includes(m.key);
                      return (
                        <button
                          key={m.key}
                          type="button"
                          className={`filter-chip ${active ? 'filter-chip--on' : 'filter-chip--off'}`}
                          onClick={() => toggleTrackedMicro(m.key)}
                          style={{ padding: '4px 8px', fontSize: '10px', fontWeight: active ? 700 : 500 }}
                        >
                          {active ? '✓ ' : '+ '}
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
  );
}

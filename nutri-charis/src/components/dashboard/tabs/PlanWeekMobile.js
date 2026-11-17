import { DAYS, MEAL_TYPES } from '../../../constants/dietPlan';
import { cleanMealText } from '../../../lib/mealText';
import { usePlatform } from '../platformContext';

export default function PlanWeekMobile() {
  const { activeClientObj, completedMeals, isAdmin, selectedDay, setEditingCell, setSelectedDay, toggleMealComplete } = usePlatform();
  return (
              <div className="mobile-slides-view" style={{ gap: '10px', width: '100%', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const idx = DAYS.indexOf(selectedDay);
                      setSelectedDay(DAYS[(idx - 1 + DAYS.length) % DAYS.length]);
                    }}
                    style={{ padding: '7px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#e2e8f0', fontSize: '12px', fontWeight: '700' }}
                  >
                    ← Προηγ.
                  </button>
                  <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#34d399' }}>{selectedDay}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const idx = DAYS.indexOf(selectedDay);
                      setSelectedDay(DAYS[(idx + 1) % DAYS.length]);
                    }}
                    style={{ padding: '7px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#e2e8f0', fontSize: '12px', fontWeight: '700' }}
                  >
                    Επόμ. →
                  </button>
                </div>

                {MEAL_TYPES.map((m) => {
                  const cleanVal = cleanMealText(activeClientObj.meal_plan?.[selectedDay]?.[m.key] || '');
                  const isChecked = completedMeals[`${activeClientObj.id}_${selectedDay}_${m.key}`];
                  return (
                    <div
                      key={m.key}
                      onClick={() => {
                        if (isAdmin) setEditingCell({ day: selectedDay, type: m.key, text: cleanVal });
                        else if (cleanVal) toggleMealComplete(selectedDay, m.key);
                      }}
                      style={{
                        width: '100%',
                        minWidth: 0,
                        background: isChecked ? 'rgba(16, 185, 129, 0.14)' : 'rgba(5, 9, 8, 0.85)',
                        border: isChecked ? '1px solid rgba(52, 211, 153, 0.55)' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '15px',
                        padding: '13px 14px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <span style={{ width: '9px', height: '9px', borderRadius: '99px', background: m.accent }} />
                          <strong style={{ fontSize: '13.5px', color: '#fff' }}>{m.label}</strong>
                        </div>
                        <span style={{ fontSize: '10.5px', fontWeight: '800', color: isAdmin ? '#34d399' : isChecked ? '#34d399' : '#94a3b8' }}>
                          {isAdmin ? '✏️ Επεξεργασία' : isChecked ? '✓ Ολοκληρώθηκε' : '○ Τσεκ'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12.5px', lineHeight: '1.5', color: cleanVal ? '#e2e8f0' : '#64748b', wordBreak: 'break-word' }}>
                        {cleanVal || (isAdmin ? '+ Πατήστε για προσθήκη γεύματος' : 'Δεν έχει οριστεί γεύμα')}
                      </div>
                    </div>
                  );
                })}
              </div>
  );
}

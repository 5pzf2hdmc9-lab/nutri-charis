import { DAYS, MEAL_TYPES } from '../../../constants/dietPlan';
import { cleanMealText } from '../../../lib/mealText';
import { usePlatform } from '../platformContext';

export default function PlanWeekMatrix() {
  const { activeClientObj, completedMeals, isAdmin, selectedDay, setEditingCell, setSelectedDay, toggleMealComplete } = usePlatform();
  return (
              <div className="desktop-matrix-view" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '1020px', borderCollapse: 'separate', borderSpacing: '6px', tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '11%', padding: '10px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: '800', letterSpacing: '0.06em' }}>
                        ΓΕΥΜΑ
                      </th>
                      {DAYS.map((day) => {
                        const isSelected = selectedDay === day;
                        return (
                          <th
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            style={{
                              width: '12.7%',
                              padding: '10px 8px',
                              borderRadius: '11px',
                              background: isSelected ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255,255,255,0.03)',
                              border: isSelected ? '1px solid rgba(52, 211, 153, 0.45)' : '1px solid rgba(255,255,255,0.05)',
                              color: isSelected ? '#6ee7b7' : '#cbd5e1',
                              fontSize: '11.5px',
                              fontWeight: '800',
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                              cursor: 'pointer'
                            }}
                          >
                            {day}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {MEAL_TYPES.map((m) => (
                      <tr key={m.key}>
                        <td
                          style={{
                            padding: '12px 10px',
                            borderRadius: '13px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            verticalAlign: 'top'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '99px', background: m.accent }} />
                            <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#f8fafc' }}>{m.label}</span>
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', fontWeight: '700' }}>{m.badge}</div>
                        </td>

                        {DAYS.map((day) => {
                          const cleanVal = cleanMealText(activeClientObj.meal_plan?.[day]?.[m.key] || '');
                          const isChecked = completedMeals[`${activeClientObj.id}_${day}_${m.key}`];
                          return (
                            <td
                              key={day}
                              className="meal-cell-card"
                              onClick={() => {
                                if (isAdmin) setEditingCell({ day, type: m.key, text: cleanVal });
                                else if (cleanVal) toggleMealComplete(day, m.key);
                              }}
                              style={{
                                padding: '12px',
                                borderRadius: '13px',
                                background: isChecked
                                  ? 'rgba(16, 185, 129, 0.14)'
                                  : cleanVal
                                  ? 'rgba(9, 15, 13, 0.85)'
                                  : 'rgba(255,255,255,0.015)',
                                border: isChecked
                                  ? '1px solid rgba(52, 211, 153, 0.5)'
                                  : cleanVal
                                  ? '1px solid rgba(255,255,255,0.08)'
                                  : '1px dashed rgba(255,255,255,0.08)',
                                verticalAlign: 'top',
                                fontSize: '12px',
                                lineHeight: '1.5',
                                color: cleanVal ? '#e2e8f0' : '#475569',
                                minHeight: '84px'
                              }}
                            >
                              {cleanVal ? (
                                <div>
                                  {!isAdmin && (
                                    <div style={{ fontSize: '10.5px', fontWeight: '800', color: isChecked ? '#34d399' : '#64748b', marginBottom: '4px' }}>
                                      {isChecked ? '✓ Ολοκληρώθηκε' : '○ Πατήστε για τσεκ'}
                                    </div>
                                  )}
                                  {cleanVal}
                                </div>
                              ) : isAdmin ? (
                                '+ Προσθήκη γεύματος'
                              ) : (
                                '—'
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
  );
}

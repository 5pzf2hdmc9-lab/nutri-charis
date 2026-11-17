import { DAYS } from '../../../constants/dietPlan';
import { usePlatform } from '../platformContext';

export default function PlanWeekToolbar() {
  const { activeClientObj, aiFullWeekLoading, cloneTargetDay, handleCloneDay, handleGenerateFullWeekAi, handleSendWeeklyPlanWhatsApp, isAdmin, selectedDay, setCloneTargetDay, setShowPdfModal, setShowShoppingModal, setShowTemplatesModal } = usePlatform();
  return (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: '800' }}>
                    📅 Πρόγραμμα Διατροφής ({activeClientObj.name})
                  </h3>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    {isAdmin
                      ? 'Πατήστε οποιοδήποτε γεύμα για επεξεργασία, διαγραφή ή αποθήκευση.'
                      : 'Πατήστε ✓ σε κάθε γεύμα που ολοκληρώνετε μέσα στην ημέρα.'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={handleGenerateFullWeekAi}
                        disabled={aiFullWeekLoading}
                        style={{
                          padding: '7px 11px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, rgba(16,185,129,0.28), rgba(5,150,105,0.22))',
                          border: '1px solid rgba(52, 211, 153, 0.55)',
                          color: '#6ee7b7',
                          fontSize: '11px',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        {aiFullWeekLoading ? '⏳ Δημιουργία 7 Ημερών...' : '✨ Αυτόματο Πλάνο 7 Ημερών'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowTemplatesModal(true)}
                        style={{
                          padding: '7px 11px',
                          borderRadius: '10px',
                          background: 'rgba(245, 158, 11, 0.14)',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                          color: '#fbbf24',
                          fontSize: '11px',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        Βιβλιοθήκη Προτύπων
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '3px 7px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>Copy {selectedDay.slice(0, 3)} →</span>
                        <select
                          value={cloneTargetDay}
                          onChange={(e) => setCloneTargetDay(e.target.value)}
                          style={{ background: 'transparent', border: 'none', color: '#34d399', fontWeight: '800', fontSize: '11px', outline: 'none' }}
                        >
                          {DAYS.filter((d) => d !== selectedDay).map((d) => (
                            <option key={d} value={d} style={{ background: '#0b1210' }}>{d}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleCloneDay}
                          style={{ padding: '3px 7px', borderRadius: '6px', border: 'none', background: '#10b981', color: '#fff', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}
                        >
                          OK
                        </button>
                      </div>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowShoppingModal(true)}
                    className="status-badge status-badge--success"
                    style={{
                      padding: '7px 12px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      letterSpacing: 0
                    }}
                  >
                    Δημιουργία Λίστας Σούπερ Μάρκετ
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleSendWeeklyPlanWhatsApp}
                      style={{
                        padding: '7px 11px',
                        borderRadius: '10px',
                        background: 'rgba(34, 197, 94, 0.16)',
                        border: '1px solid rgba(34, 197, 94, 0.45)',
                        color: '#86efac',
                        fontSize: '11px',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      📲 WhatsApp
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowPdfModal(true)}
                    style={{
                      padding: '7px 11px',
                      borderRadius: '10px',
                      background: 'rgba(56, 189, 248, 0.14)',
                      border: '1px solid rgba(56, 189, 248, 0.45)',
                      color: '#7dd3fc',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    Προεπισκόπηση Excel
                  </button>

                  <button
                    type="button"
                    className="btn-emerald"
                    onClick={() => {
                      document.body.classList.add('print-mode-clinical');
                      document.body.classList.remove('print-mode-excel');
                      let pageStyle = document.getElementById('clinical-print-page-style');
                      if (!pageStyle) {
                        pageStyle = document.createElement('style');
                        pageStyle.id = 'clinical-print-page-style';
                        pageStyle.textContent = '@page { size: A4 portrait; margin: 12mm; }';
                        document.head.appendChild(pageStyle);
                      }
                      window.setTimeout(() => {
                        window.print();
                        document.body.classList.remove('print-mode-clinical');
                        pageStyle?.remove();
                      }, 80);
                    }}
                    style={{
                      padding: '7px 12px',
                      fontSize: '11px',
                      fontWeight: '800',
                      borderRadius: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    Εξαγωγή Διαιτολογίου (PDF)
                  </button>
                </div>
              </div>
  );
}

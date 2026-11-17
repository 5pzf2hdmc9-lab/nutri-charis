import { DAYS, MEAL_TYPES } from '../../../constants/dietPlan';
import { cleanMealText } from '../../../lib/mealText';
import { usePlatform } from '../platformContext';

export default function PlanAiStudio() {
  const { aiCustomPrompt, aiDay, aiLoading, aiMealType, aiOptions, customIdeaCategory, customIdeaText, deleteSavedIdea, handleGenerateAiMeals, handleSelectMealOption, ideaFilter, isAdmin, saveIdeaToLibrary, savedIdeas, setAiCustomPrompt, setAiDay, setAiMealType, setCustomIdeaCategory, setCustomIdeaText, setIdeaFilter } = usePlatform();
  return (
isAdmin && (
              <div className="studio-two-col">
                <section className="luxury-card" style={{ padding: '18px 20px' }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '15.5px', fontWeight: '800' }}>
                    ✨ AI Κλινικές Προτάσεις Γευμάτων
                  </h3>
                  <p style={{ margin: '0 0 11px 0', fontSize: '11.5px', color: '#94a3b8' }}>
                    3 καθαρές προτάσεις με γραμμάρια βασισμένες στον φάκελο.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <select className="luxury-input" value={aiDay} onChange={(e) => setAiDay(e.target.value)}>
                      {DAYS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <select className="luxury-input" value={aiMealType} onChange={(e) => setAiMealType(e.target.value)}>
                      {MEAL_TYPES.map((m) => (
                        <option key={m.key} value={m.key}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '7px' }}>
                    <input
                      className="luxury-input"
                      type="text"
                      value={aiCustomPrompt}
                      onChange={(e) => setAiCustomPrompt(e.target.value)}
                      placeholder="Οδηγία (π.χ. νηστίσιμο)..."
                    />
                    <button
                      type="button"
                      onClick={handleGenerateAiMeals}
                      disabled={aiLoading}
                      style={{
                        padding: '0 14px',
                        borderRadius: '11px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        border: 'none',
                        fontWeight: '800',
                        fontSize: '11.5px',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer'
                      }}
                    >
                      {aiLoading ? '⏳...' : '✨ 3 Προτάσεις'}
                    </button>
                  </div>

                  {aiOptions.length > 0 && (
                    <div style={{ marginTop: '11px', display: 'grid', gap: '8px' }}>
                      {aiOptions.map((opt, idx) => (
                        <div key={idx} style={{ background: 'rgba(5, 9, 8, 0.85)', padding: '11px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '6px' }}>
                            <strong style={{ fontSize: '12px', color: '#34d399' }}>{opt.title}</strong>
                            <span className="font-mono-num" style={{ fontSize: '10.5px', color: '#fbbf24', flexShrink: 0 }}>
                              {opt.kcal} kcal • P:{opt.protein}g
                            </span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#e2e8f0', lineHeight: '1.45', marginBottom: '8px' }}>
                            {cleanMealText(opt.meal)}
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleSelectMealOption(aiDay, aiMealType, opt.meal)}
                              style={{ padding: '6px 10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '10.5px', fontWeight: '800', cursor: 'pointer' }}
                            >
                              + Εισαγωγή ({aiDay.slice(0, 3)})
                            </button>
                            <button
                              type="button"
                              onClick={() => saveIdeaToLibrary(opt.meal, aiMealType)}
                              style={{ padding: '6px 9px', background: 'rgba(245, 158, 11, 0.16)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '8px', fontSize: '10.5px', fontWeight: '700', cursor: 'pointer' }}
                            >
                              ⭐ Ιδέες
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="luxury-card" style={{ padding: '18px 20px' }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '15.5px', fontWeight: '800' }}>
                    ⭐ Βιβλιοθήκη Ιδεών Γευμάτων
                  </h3>
                  <p style={{ margin: '0 0 10px 0', fontSize: '11.5px', color: '#94a3b8' }}>
                    Εισαγωγή με 1 κλικ στο {aiDay} • {aiMealType}.
                  </p>

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '9px', flexWrap: 'wrap' }}>
                    <input
                      className="luxury-input"
                      style={{ flex: 1, minWidth: '130px' }}
                      type="text"
                      value={customIdeaText}
                      onChange={(e) => setCustomIdeaText(e.target.value)}
                      placeholder="Νέα ιδέα με γραμμάρια..."
                    />
                    <select
                      className="luxury-input"
                      style={{ width: '110px' }}
                      value={customIdeaCategory}
                      onChange={(e) => setCustomIdeaCategory(e.target.value)}
                    >
                      <option value="Πρωινό">Πρωινό</option>
                      <option value="Σνακ">Σνακ</option>
                      <option value="Μεσημεριανό">Μεσημεριανό</option>
                      <option value="Βραδινό">Βραδινό</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (!customIdeaText.trim()) return;
                        saveIdeaToLibrary(customIdeaText, customIdeaCategory);
                        setCustomIdeaText('');
                      }}
                      style={{ padding: '8px 12px', borderRadius: '10px', background: '#f59e0b', color: '#050807', border: 'none', fontWeight: '800', fontSize: '11.5px', cursor: 'pointer' }}
                    >
                      + Save
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '5px', marginBottom: '9px', flexWrap: 'wrap' }}>
                    {['Όλα', 'Πρωινό', 'Σνακ', 'Μεσημεριανό', 'Βραδινό'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setIdeaFilter(cat)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '99px',
                          fontSize: '10px',
                          fontWeight: '700',
                          border: 'none',
                          cursor: 'pointer',
                          background: ideaFilter === cat ? '#34d399' : 'rgba(255,255,255,0.06)',
                          color: ideaFilter === cat ? '#050807' : '#94a3b8'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'grid', gap: '7px' }}>
                    {savedIdeas
                      .filter((i) => ideaFilter === 'Όλα' || i.category === ideaFilter)
                      .map((idea) => (
                        <div key={idea.id} style={{ background: 'rgba(5,9,8,0.75)', padding: '9px 10px', borderRadius: '11px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '7px' }}>
                          <div style={{ fontSize: '11.5px', color: '#e2e8f0', lineHeight: '1.4', minWidth: 0 }}>
                            <span style={{ fontSize: '9.5px', color: '#fbbf24', fontWeight: '800', marginRight: '5px' }}>[{idea.category}]</span>
                            {idea.text}
                          </div>
                          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => handleSelectMealOption(aiDay, aiMealType, idea.text)}
                              style={{ padding: '5px 7px', background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '7px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}
                            >
                              + {aiDay.slice(0, 3)}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSavedIdea(idea.id)}
                              style={{ padding: '5px 7px', background: 'rgba(239, 68, 68, 0.14)', color: '#fca5a5', border: 'none', borderRadius: '7px', fontSize: '10px', cursor: 'pointer' }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </section>
              </div>
            )
  );
}

import GdprConsentFields from '../../GdprConsentFields';
import EmptyState from '../ui/EmptyState';
import { PRACTICE_STUBS } from '../../../constants/practiceStubs';
import { calculateMetabolism } from '../../../lib/nutrition-math';
import { usePlatform } from '../platformContext';

export default function ClientsTab() {
  const { activeClientObj, activeTab, art9Accepted, clientSearch, clients, filteredClients, gdprAccepted, handleCreateClient, handleDeleteClient, isAdmin, newClientAge, newClientArt9, newClientEmail, newClientGdpr, newClientGender, newClientGoal, newClientHeight, newClientName, newClientPhone, newClientTerms, newClientWeight, setActiveClientId, setActiveTab, setArt9Accepted, setClientSearch, setGdprAccepted, setLegalDoc, setNewClientAge, setNewClientArt9, setNewClientEmail, setNewClientGdpr, setNewClientGender, setNewClientGoal, setNewClientHeight, setNewClientName, setNewClientPhone, setNewClientTerms, setNewClientWeight, setShowNewClientForm, setTermsAccepted, showNewClientForm, termsAccepted } = usePlatform();
  return (
activeTab === 'clients' && isAdmin && (
          <section className="luxury-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17.5px', fontWeight: '800' }}>👥 Μητρώο Πελατών ({clients.length})</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#94a3b8' }}>Αναζητήστε ή δημιουργήστε νέο κλινικό φάκελο.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%', maxWidth: '380px' }}>
                <input
                  className="luxury-input"
                  style={{ flex: 1 }}
                  placeholder="🔍 Αναζήτηση πελάτη..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(!showNewClientForm)}
                  style={{ padding: '10px 14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '11px', fontWeight: '800', fontSize: '12px', whiteSpace: 'nowrap', cursor: 'pointer' }}
                >
                  {showNewClientForm ? '✕' : '+ Νέος'}
                </button>
              </div>
            </div>

            {showNewClientForm && (
              <form
                onSubmit={handleCreateClient}
                style={{
                  background: 'rgba(5,9,8,0.82)',
                  padding: '15px',
                  borderRadius: '14px',
                  border: '1px solid rgba(16,185,129,0.35)',
                  marginBottom: '16px',
                  display: 'grid',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '9px' }}>
                  <div>
                    <label className="field-label" htmlFor="nc-name">Ονοματεπώνυμο *</label>
                    <input id="nc-name" className="luxury-input" required placeholder="π.χ. Μαρία Παπαδοπούλου" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="nc-email">Email</label>
                    <input id="nc-email" className="luxury-input" type="email" placeholder="name@example.com" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="nc-phone">Τηλέφωνο</label>
                    <input id="nc-phone" className="luxury-input" type="tel" placeholder="69…" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="nc-gender">Φύλο</label>
                    <select id="nc-gender" className="luxury-input" value={newClientGender} onChange={(e) => setNewClientGender(e.target.value)}>
                      <option value="female">Γυναίκα</option>
                      <option value="male">Άνδρας</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="nc-age">Ηλικία</label>
                    <input id="nc-age" className="luxury-input" type="number" min={5} max={115} value={newClientAge} onChange={(e) => setNewClientAge(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="nc-weight">Βάρος (kg)</label>
                    <input id="nc-weight" className="luxury-input" type="number" min={25} max={350} step="0.1" value={newClientWeight} onChange={(e) => setNewClientWeight(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="nc-height">Ύψος (cm)</label>
                    <input id="nc-height" className="luxury-input" type="number" min={90} max={240} value={newClientHeight} onChange={(e) => setNewClientHeight(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="nc-goal">Στόχος</label>
                    <input id="nc-goal" className="luxury-input" placeholder="π.χ. Απώλεια λίπους" value={newClientGoal} onChange={(e) => setNewClientGoal(e.target.value)} />
                  </div>
                </div>
                <GdprConsentFields
                  gdprAccepted={newClientGdpr}
                  setGdprAccepted={setNewClientGdpr}
                  art9Accepted={newClientArt9}
                  setArt9Accepted={setNewClientArt9}
                  termsAccepted={newClientTerms}
                  setTermsAccepted={setNewClientTerms}
                  onOpenLegal={setLegalDoc}
                />
                <button type="submit" className="btn-emerald" style={{ padding: '11px', cursor: 'pointer' }}>
                  ✓ Δημιουργία Φακέλου
                </button>
              </form>
            )}

            {clients.length === 0 && !showNewClientForm && (
              <EmptyState
                icon="👥"
                title="Κενό μητρώο πελατών"
                body="Ξεκινήστε με τον πρώτο κλινικό φάκελο — ανθρωπομετρικά, συγκαταθέσεις GDPR και στόχος σε ένα βήμα."
                actionLabel="+ Νέος Πελάτης"
                onAction={() => setShowNewClientForm(true)}
              />
            )}

            {clients.length > 0 && filteredClients.length === 0 && (
              <EmptyState
                icon="🔍"
                title="Κανένα αποτέλεσμα αναζήτησης"
                body={`Δεν βρέθηκε πελάτης για «${clientSearch.trim()}». Δοκιμάστε όνομα, email ή τηλέφωνο.`}
                actionLabel="Καθαρισμός φίλτρου"
                onAction={() => setClientSearch('')}
              />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '11px' }}>
              {filteredClients.map((c) => {
                const isCurrent = c.id === activeClientObj?.id;
                const met = calculateMetabolism({
                  gender: c.gender,
                  age: c.age,
                  weight: c.weight,
                  height: c.height,
                  activity: c.questionnaire?.activityLevel || 1.375
                });
                const f = c.questionnaire?.bmrFormula || 'mifflin';
                const target = (met[f]?.tdee || met.mifflin.tdee) + Number(c.questionnaire?.calorieDelta || 0);
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveClientId(c.id);
                      setActiveTab('plan');
                    }}
                    style={{
                      background: isCurrent ? 'rgba(16, 185, 129, 0.12)' : 'rgba(5, 9, 8, 0.75)',
                      border: isCurrent ? '1.5px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '14px',
                      padding: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <strong style={{ fontSize: '14.5px', color: '#fff' }}>{c.name}</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <span className="font-mono-num" style={{ fontSize: '11px', color: '#34d399', fontWeight: '800' }}>
                          {target} kcal
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClient(e, c)}
                          title="Διαγραφή Φακέλου"
                          style={{ background: 'rgba(239,68,68,0.14)', border: 'none', color: '#fca5a5', borderRadius: '7px', padding: '3px 6px', fontSize: '11px', cursor: 'pointer' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>
                      {c.gender === 'male' ? 'Άνδρας' : 'Γυναίκα'} • {c.age} ετών • {c.weight}kg • {c.height}cm
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1' }}>🎯 {c.goal || '—'}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#e2e8f0' }}>Εργαλεία Πρακτικής</h4>
                <span className="stub-chip">Μερικά live · μερικά stub</span>
              </div>
              <p style={{ margin: '0 0 10px 0', fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.5 }}>
                SOAP notes, πακέτα/πληρωμές και 1-click υπενθυμίσεις είναι live στον φάκελο πελάτη και στα ραντεβού. Τα παρακάτω παραμένουν stubs χωρίς ψεύτικο backend.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '9px' }}>
                {PRACTICE_STUBS.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      padding: '12px 13px',
                      borderRadius: '12px',
                      background: 'rgba(5,9,8,0.65)',
                      border: '1px dashed rgba(148,163,184,0.28)',
                      opacity: 0.92
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '12px', color: '#cbd5e1' }}>{s.title}</strong>
                      <span className="stub-chip">N/A</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.45 }}>{s.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )
  );
}

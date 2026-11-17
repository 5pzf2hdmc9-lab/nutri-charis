import GdprDataActions from '../../GdprDataActions';
import BillingPackagesPanel from '../../practice/BillingPackagesPanel';
import SoapNotesPanel from '../../practice/SoapNotesPanel';
import { usePlatform } from '../platformContext';

export default function ProfileTab() {
  const { activeClientObj, activeFormula, activeTab, activeTargetKcal, appointments, clientMetabolism, handlePermanentDeleteClient, isAdmin, measurements, openClientEditModal, profileSubTab, session, setProfileSubTab } = usePlatform();
  return (
activeTab === 'profile' && activeClientObj && (
          <section className="luxury-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17.5px', fontWeight: '800' }}>📂 Κλινικός Φάκελος — {activeClientObj.name}</h3>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '3px' }}>
                  Εξίσωση:{' '}
                  <strong style={{ color: '#34d399' }}>
                    {activeFormula === 'mifflin' ? 'Mifflin-St Jeor' : activeFormula === 'harris' ? 'Harris-Benedict' : 'Katch-McArdle'}
                  </strong>{' '}
                  • Συντελεστής Άσκησης: <strong style={{ color: '#fbbf24' }}>{activeClientObj.questionnaire?.activityLevel || 1.375}</strong>
                </div>
              </div>
              {isAdmin && profileSubTab === 'overview' && (
                <button
                  type="button"
                  onClick={() => openClientEditModal(activeClientObj)}
                  style={{ padding: '9px 14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '11px', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}
                >
                  ✏️ Επεξεργασία Φακέλου
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }} role="tablist" aria-label="Ενότητες φακέλου">
              {[
                { id: 'overview', label: 'Επισκόπηση' },
                { id: 'soap', label: 'Ιστορικό & SOAP Notes' },
                { id: 'billing', label: 'Πακέτα & Πληρωμές' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={profileSubTab === tab.id}
                  className={`filter-chip ${profileSubTab === tab.id ? 'filter-chip--on' : 'filter-chip--off'}`}
                  onClick={() => setProfileSubTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {profileSubTab === 'overview' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '11px' }}>
                  {[
                    { title: 'Στοιχεία Επικοινωνίας', body: `Email: ${activeClientObj.email || '—'} • Τηλ: ${activeClientObj.phone || '—'}` },
                    { title: 'Ανθρωπομετρικά & Στόχος', body: `Ηλικία: ${activeClientObj.age} • Βάρος: ${activeClientObj.weight}kg • Ύψος: ${activeClientObj.height}cm • BMI: ${clientMetabolism.mifflin.bmi} • Ημερήσιος Στόχος: ${activeTargetKcal} kcal` },
                    { title: 'Υγεία & Αλλεργίες', body: `${(activeClientObj.questionnaire?.healthConditions || []).join(', ') || 'Κανένα αναφερόμενο'} ${activeClientObj.questionnaire?.healthOther || ''}` },
                    { title: 'Φάρμακα & Συμπληρώματα', body: `Φάρμακα: ${activeClientObj.questionnaire?.medications || '—'} | Συμπληρώματα: ${activeClientObj.questionnaire?.supplements || '—'}` },
                    { title: 'Γαστρεντερικό & Νερό', body: `Στομάχι: ${activeClientObj.questionnaire?.stomachBloating || '—'} | Νερό: ${activeClientObj.questionnaire?.waterIntake || '1.5 - 2 λίτρα'}` },
                    { title: 'Διατροφικές Προτιμήσεις', body: `Φρούτα: ${(activeClientObj.questionnaire?.preferredFruits || []).join(', ') || 'Όλα'} | Λαχανικά: ${(activeClientObj.questionnaire?.preferredVegetables || []).join(', ') || 'Όλα'}` }
                  ].map((box) => (
                    <div key={box.title} style={{ background: 'rgba(5,9,8,0.75)', padding: '14px', borderRadius: '13px', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ fontSize: '10.5px', color: '#34d399', fontWeight: '800', marginBottom: '5px', textTransform: 'uppercase' }}>{box.title}</div>
                      <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: '1.5' }}>{box.body}</div>
                    </div>
                  ))}
                </div>

                <GdprDataActions
                  client={activeClientObj}
                  appointments={appointments}
                  measurements={measurements}
                  onPermanentDelete={handlePermanentDeleteClient}
                  disabled={!isAdmin && String(activeClientObj.user_id || '') !== String(session?.user?.id || '')}
                />
              </>
            )}

            {profileSubTab === 'soap' && (
              <SoapNotesPanel client={activeClientObj} isAdmin={isAdmin} />
            )}

            {profileSubTab === 'billing' && (
              <BillingPackagesPanel client={activeClientObj} isAdmin={isAdmin} />
            )}
          </section>
        )
  );
}

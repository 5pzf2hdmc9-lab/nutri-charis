import GdprConsentFields from '../../GdprConsentFields';
import MedicalFooter from '../../MedicalFooter';
import BrandLogo from '../ui/BrandLogo';
import { ACTIVITY_FACTORS } from '../../../constants/metabolismOptions';
import { usePlatform } from '../platformContext';

export default function AuthFormColumn() {
  const { art9Accepted, authActivity, authAge, authAllergies, authEmail, authError, authGender, authGoal, authHeight, authMode, authName, authPassword, authPhone, authSubmitting, authSuccess, authWeight, gdprAccepted, handleAuthSubmit, setArt9Accepted, setAuthActivity, setAuthAge, setAuthAllergies, setAuthEmail, setAuthError, setAuthGender, setAuthGoal, setAuthHeight, setAuthMode, setAuthName, setAuthPassword, setAuthPhone, setAuthSuccess, setAuthWeight, setGdprAccepted, setLegalDoc, setShowPassword, setTermsAccepted, showPassword, termsAccepted } = usePlatform();
  return (
        <div className="auth-form-column">
          <div className="luxury-card glass-elevated auth-form-rise" style={{ width: '100%', maxWidth: '440px', padding: '28px 26px' }}>
            <div className="auth-mobile-brand">
              <BrandLogo size={40} />
              <div>
                <div className="font-display" style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                  Χάρις Φωτούδη
                </div>
                <div style={{ fontSize: '12px', color: '#34d399', fontWeight: 700 }}>NutriCharis</div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h2 className="font-display" style={{ margin: '0 0 6px 0', fontSize: '21px', fontWeight: 800 }}>
                {authMode === 'login'
                  ? 'Σύνδεση'
                  : authMode === 'register'
                  ? 'Εγγραφή πελάτη'
                  : 'Επαναφορά κωδικού'}
              </h2>
              <div style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.45 }}>
                {authMode === 'login'
                  ? 'Είσοδος στο διατροφολογικό γραφείο.'
                  : authMode === 'register'
                  ? 'Δημιουργία φακέλου με ρητή συγκατάθεση GDPR.'
                  : 'Θα λάβετε σύνδεσμο επαναφοράς στο email σας.'}
              </div>
            </div>

            {authError && (
              <div role="alert" className="status-badge status-badge--danger" style={{ display: 'block', borderRadius: 12, padding: '11px 14px', marginBottom: 14 }}>
                {authError}
              </div>
            )}

            {authSuccess && (
              <div role="status" className="status-badge status-badge--success" style={{ display: 'block', borderRadius: 12, padding: '11px 14px', marginBottom: 14 }}>
                {authSuccess}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} style={{ display: 'grid', gap: '11px' }}>
              {authMode === 'register' && (
                <>
                  <div className="auth-pair-grid">
                    <div>
                      <label className="field-label" htmlFor="auth-name">Ονοματεπώνυμο *</label>
                      <input id="auth-name" className="luxury-input" type="text" required value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Μαρία Παπαδοπούλου" />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="auth-phone">Τηλέφωνο</label>
                      <input id="auth-phone" className="luxury-input" type="tel" value={authPhone} onChange={(e) => setAuthPhone(e.target.value)} placeholder="69..." />
                    </div>
                  </div>

                  <div className="auth-metric-grid">
                    <div>
                      <label className="field-label" htmlFor="auth-gender">Φύλο</label>
                      <select id="auth-gender" className="luxury-input" style={{ padding: '9px 7px', fontSize: '12.5px' }} value={authGender} onChange={(e) => setAuthGender(e.target.value)}>
                        <option value="female">Γυναίκα</option>
                        <option value="male">Άνδρας</option>
                      </select>
                    </div>
                    <div>
                      <label className="field-label" htmlFor="auth-age">Ηλικία</label>
                      <input id="auth-age" className="luxury-input font-mono-num" style={{ padding: '9px 8px', fontSize: '12.5px' }} type="number" min={5} max={115} required value={authAge} onChange={(e) => setAuthAge(e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="auth-weight">Κιλά</label>
                      <input id="auth-weight" className="luxury-input font-mono-num" style={{ padding: '9px 8px', fontSize: '12.5px' }} type="number" min={25} max={350} step="0.1" required value={authWeight} onChange={(e) => setAuthWeight(e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="auth-height">Ύψος</label>
                      <input id="auth-height" className="luxury-input font-mono-num" style={{ padding: '9px 8px', fontSize: '12.5px' }} type="number" min={90} max={240} required value={authHeight} onChange={(e) => setAuthHeight(e.target.value)} />
                    </div>
                  </div>

                  <div className="auth-pair-grid">
                    <div>
                      <label className="field-label" htmlFor="auth-goal">Στόχος</label>
                      <input id="auth-goal" className="luxury-input" type="text" value={authGoal} onChange={(e) => setAuthGoal(e.target.value)} placeholder="π.χ. Απώλεια βάρους" />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="auth-activity">Δραστηριότητα</label>
                      <select id="auth-activity" className="luxury-input" style={{ fontSize: '12.5px' }} value={authActivity} onChange={(e) => setAuthActivity(parseFloat(e.target.value))}>
                        {ACTIVITY_FACTORS.map((af) => (
                          <option key={af.value} value={af.value}>{af.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="field-label" htmlFor="auth-allergies">Αλλεργίες / Υγεία (προαιρετικό)</label>
                    <input id="auth-allergies" className="luxury-input" type="text" value={authAllergies} onChange={(e) => setAuthAllergies(e.target.value)} placeholder="π.χ. Θυρεοειδής, δυσανεξία στη λακτόζη..." />
                  </div>
                </>
              )}

              <div>
                <label className="field-label" htmlFor="auth-email">Email *</label>
                <input id="auth-email" className="luxury-input" type="email" required autoComplete="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="name@example.com" />
              </div>

              {authMode !== 'forgot' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="field-label" htmlFor="auth-password" style={{ marginBottom: 0 }}>Κωδικός Πρόσβασης *</label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot');
                          setAuthError('');
                          setAuthSuccess('');
                        }}
                        style={{ background: 'none', border: 'none', color: '#34d399', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                      >
                        Ξέχασα τον κωδικό μου;
                      </button>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="auth-password"
                      className="luxury-input"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                      required
                      minLength={6}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ paddingRight: '70px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        fontWeight: '700'
                      }}
                    >
                      {showPassword ? 'Απόκρυψη' : 'Προβολή'}
                    </button>
                  </div>
                </div>
              )}

              {authMode === 'register' && (
                <GdprConsentFields
                  gdprAccepted={gdprAccepted}
                  setGdprAccepted={setGdprAccepted}
                  art9Accepted={art9Accepted}
                  setArt9Accepted={setArt9Accepted}
                  termsAccepted={termsAccepted}
                  setTermsAccepted={setTermsAccepted}
                  onOpenLegal={setLegalDoc}
                />
              )}

              <button
                type="submit"
                className="btn-emerald"
                disabled={authSubmitting}
                style={{
                  marginTop: '4px',
                  padding: '13px',
                  opacity: authSubmitting ? 0.65 : 1,
                  cursor: authSubmitting ? 'wait' : 'pointer'
                }}
              >
                {authSubmitting
                  ? 'Παρακαλώ περιμένετε…'
                  : authMode === 'login'
                  ? 'Είσοδος στην Πλατφόρμα →'
                  : authMode === 'register'
                  ? 'Δημιουργία Φακέλου & Είσοδος →'
                  : 'Αποστολή Link Επαναφοράς →'}
              </button>
            </form>

            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12.5px', color: '#94a3b8' }}>
              {authMode === 'forgot' ? (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  style={{ background: 'none', border: 'none', color: '#34d399', fontWeight: '700', cursor: 'pointer' }}
                >
                  ← Επιστροφή στη Σύνδεση
                </button>
              ) : (
                <div>
                  {authMode === 'login' ? 'Νέος πελάτης; ' : 'Έχετε ήδη λογαριασμό; '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'register' : 'login');
                      setAuthError('');
                      setAuthSuccess('');
                    }}
                    style={{ background: 'none', border: 'none', color: '#34d399', fontWeight: '700', cursor: 'pointer' }}
                  >
                    {authMode === 'login' ? 'Εγγραφή & Ιστορικό' : 'Σύνδεση'}
                  </button>
                </div>
              )}
            </div>
            <div style={{ marginTop: '16px' }}>
              <MedicalFooter compact onOpenLegal={setLegalDoc} />
            </div>
          </div>
        </div>
  );
}

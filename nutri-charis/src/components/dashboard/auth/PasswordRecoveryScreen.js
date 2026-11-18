import LegalModal from '../../LegalModal';
import MedicalFooter from '../../MedicalFooter';
import BrandLogo from '../ui/BrandLogo';
import { getPasswordStrength } from '../../../lib/passwordStrength';
import { usePlatform } from '../platformContext';

export default function PasswordRecoveryScreen() {
  const { authError, confirmPasswordInput, handlePasswordUpdateSubmit, legalDoc, newPasswordInput, passwordUpdating, setConfirmPasswordInput, setLegalDoc, setNewPasswordInput } = usePlatform();
    const strength = getPasswordStrength(newPasswordInput);
    const passwordsMatch =
      confirmPasswordInput.length > 0 && newPasswordInput === confirmPasswordInput;
  return (
      <div
        className="glass-modal-backdrop"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        <div className="luxury-card glass-elevated" style={{ width: '100%', maxWidth: '440px', padding: '28px', animation: 'fadeInSlide 0.28s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <BrandLogo size={42} />
            <div>
              <h2 className="font-display" style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>
                Ορισμός Νέου Κωδικού
              </h2>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                NutriCharis • Ασφαλής επαναφορά πρόσβασης
              </div>
            </div>
          </div>
          <p style={{ margin: '0 0 16px 0', fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.55 }}>
            Ορίστε νέο κωδικό. Μετά την αποθήκευση θα συνδεθείτε αυτόματα στην πλατφόρμα.
          </p>
          {authError && (
            <div role="alert" className="status-badge status-badge--danger" style={{ display: 'block', marginBottom: '12px', borderRadius: '11px', padding: '10px 14px' }}>
              {authError}
            </div>
          )}
          <form onSubmit={handlePasswordUpdateSubmit} style={{ display: 'grid', gap: '13px' }}>
            <div>
              <label className="field-label" htmlFor="recovery-password">
                Νέος Κωδικός *
              </label>
              <input
                id="recovery-password"
                className="luxury-input"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Τουλάχιστον 6 χαρακτήρες"
                disabled={passwordUpdating}
              />
              {newPasswordInput.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div
                    style={{
                      height: '6px',
                      borderRadius: '99px',
                      background: 'rgba(255,255,255,0.08)',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: `${strength.pct}%`,
                        height: '100%',
                        background: strength.color,
                        transition: 'width 0.25s ease, background 0.25s ease'
                      }}
                    />
                  </div>
                  <div style={{ marginTop: '5px', fontSize: '11px', color: strength.color, fontWeight: 700 }}>
                    Ισχύς: {strength.label}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="field-label" htmlFor="recovery-confirm">
                Επιβεβαίωση Κωδικού *
              </label>
              <input
                id="recovery-confirm"
                className="luxury-input"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPasswordInput}
                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                placeholder="Επαναλάβετε τον νέο κωδικό"
                disabled={passwordUpdating}
              />
              {confirmPasswordInput.length > 0 && (
                <div
                  style={{
                    marginTop: '5px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: passwordsMatch ? '#34d399' : '#f87171'
                  }}
                >
                  {passwordsMatch ? '✓ Οι κωδικοί ταιριάζουν' : 'Οι κωδικοί δεν ταιριάζουν ακόμη'}
                </div>
              )}
            </div>
            <button
              type="submit"
              className="btn-emerald"
              disabled={passwordUpdating || newPasswordInput.length < 6 || !passwordsMatch}
              style={{
                padding: '13px',
                opacity: passwordUpdating || newPasswordInput.length < 6 || !passwordsMatch ? 0.55 : 1,
                cursor: passwordUpdating || newPasswordInput.length < 6 || !passwordsMatch ? 'not-allowed' : 'pointer'
              }}
            >
              {passwordUpdating ? 'Αποθήκευση…' : '✓ Αποθήκευση Νέου Κωδικού'}
            </button>
          </form>
          <div style={{ marginTop: '14px' }}>
            <MedicalFooter compact onOpenLegal={setLegalDoc} />
          </div>
          {legalDoc && <LegalModal docKey={legalDoc} onClose={() => setLegalDoc(null)} />}
        </div>
      </div>
  );
}

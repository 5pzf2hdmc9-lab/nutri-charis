import BrandLogo from '../ui/BrandLogo';

export default function AuthBrandPanel() {
  return (
        <div
          className="auth-brand-panel"
          style={{
            padding: '56px 52px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRight: '1px solid rgba(255,255,255,0.07)',
            background: 'linear-gradient(165deg, rgba(6, 28, 20, 0.92) 0%, rgba(5, 8, 7, 0.98) 100%)'
          }}
        >
          <div className="auth-brand-reveal" style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '540px' }}>
            <BrandLogo size={58} />
            <div>
              <div
                className="font-display"
                style={{ fontSize: 'clamp(34px, 4.2vw, 48px)', fontWeight: 800, color: '#fff', lineHeight: 1.05, margin: 0 }}
              >
                Χάρις Φωτούδη
              </div>
              <div
                style={{
                  marginTop: '10px',
                  fontSize: '15px',
                  color: '#34d399',
                  fontWeight: 700,
                  letterSpacing: '0.04em'
                }}
              >
                NutriCharis
              </div>
            </div>
            <h1
              className="font-display"
              style={{
                fontSize: 'clamp(20px, 2.2vw, 26px)',
                lineHeight: 1.35,
                fontWeight: 700,
                margin: 0,
                color: '#e2e8f0',
                maxWidth: '420px'
              }}
            >
              Κλινικός σχεδιασμός διατροφής με ακρίβεια.
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14.5px', lineHeight: 1.65, margin: 0, maxWidth: '400px' }}>
              Μεταβολικός υπολογισμός, FDA μικροθρεπτικά και ασφαλής φάκελος πελάτη — σε ένα clinical OS.
            </p>
          </div>

          <div className="auth-brand-meta auth-brand-reveal" style={{ animationDelay: '0.12s' }}>
            BMR · FDA micros · GDPR / Art.9
          </div>
        </div>
  );
}

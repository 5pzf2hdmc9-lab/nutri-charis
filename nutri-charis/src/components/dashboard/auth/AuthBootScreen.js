import BrandLogo from '../ui/BrandLogo';

export default function AuthBootScreen() {
  return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Φόρτωση NutriCharis"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '18px'
        }}
      >
        <BrandLogo size={52} className="boot-logo-pulse" />
        <div className="boot-spinner" aria-hidden />
        <div
          className="font-display"
          style={{ fontSize: '15px', color: '#e2e8f0', fontWeight: 800, letterSpacing: '-0.02em' }}
        >
          Χάρις Φωτούδη
        </div>
        <div style={{ fontSize: '11.5px', color: '#34d399', fontWeight: 700, letterSpacing: '0.08em' }}>
          NUTRICHARIS
        </div>
      </div>
  );
}

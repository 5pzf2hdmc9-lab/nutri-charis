import { buildNavTabs } from './navTabs';
import BrandLogo from '../ui/BrandLogo';
import { usePlatform } from '../platformContext';

export default function DashboardHeader() {
  const { activeClientObj, activeTab, clients, handleLogout, isAdmin, setActiveClientId, setActiveTab, setShowApiKeyModal } = usePlatform();
  const navTabs = buildNavTabs(isAdmin, clients.length);
  return (
      <header
        className="no-print"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 90,
          width: '100%',
          background: 'rgba(5, 8, 7, 0.9)',
          backdropFilter: 'blur(22px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)'
        }}
      >
        <div style={{ maxWidth: '1460px', margin: '0 auto', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
            <BrandLogo size={34} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="font-display" style={{ fontSize: '15px', fontWeight: '800', color: '#fff', whiteSpace: 'nowrap' }}>
                  Χάρις Φωτούδη
                </span>
                <span className="status-badge status-badge--info" style={{ fontSize: '9px', padding: '2px 6px' }}>
                  NutriCharis
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#34d399', fontWeight: '600' }}>
                Clinical Nutrition OS · Solo
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {isAdmin && clients.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '5px 8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <select
                  className="shell-select"
                  aria-label="Ενεργός πελάτης"
                  value={activeClientObj?.id != null ? String(activeClientObj.id) : ''}
                  onChange={(e) => setActiveClientId(e.target.value)}
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id} style={{ background: '#0b1210', color: '#fff' }}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isAdmin && (
              <button
                type="button"
                aria-label="Πληροφορίες υπηρεσίας AI"
                onClick={() => setShowApiKeyModal(true)}
                style={{
                  padding: '6px 9px',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: '9px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                AI
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="btn-ghost-danger"
              aria-label="Αποσύνδεση"
              style={{
                padding: '6px 9px',
                fontSize: '11px',
                fontWeight: '700'
              }}
            >
              Αποσύνδεση
            </button>
          </div>
        </div>

        {/* Desktop Navigation Bar */}
        <div className="desktop-top-tabs" style={{ maxWidth: '1460px', margin: '0 auto', padding: '0 22px 12px 22px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {navTabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '12px',
                  border: active ? '1px solid rgba(52, 211, 153, 0.5)' : '1px solid rgba(255,255,255,0.06)',
                  background: active
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.28) 0%, rgba(5, 150, 105, 0.18) 100%)'
                    : 'rgba(255,255,255,0.03)',
                  color: active ? '#ecfdf5' : '#94a3b8',
                  fontWeight: active ? '800' : '600',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>
  );
}

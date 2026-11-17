import { buildNavTabs } from './navTabs';
import { usePlatform } from '../platformContext';

export default function MobileNavDock() {
  const { activeTab, clients, isAdmin, setActiveTab } = usePlatform();
  const navTabs = buildNavTabs(isAdmin, clients.length);
  return (
      <nav
        className="mobile-bottom-dock no-print"
        style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          right: '10px',
          zIndex: 250,
          background: 'rgba(8, 14, 12, 0.94)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(52, 211, 153, 0.28)',
          borderRadius: '18px',
          padding: '5px 4px',
          justifyContent: 'space-around',
          alignItems: 'center',
          boxShadow: '0 14px 35px rgba(0, 0, 0, 0.85)'
        }}
      >
        {navTabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: '6px 2px',
                borderRadius: '12px',
                border: 'none',
                background: active ? 'rgba(16, 185, 129, 0.22)' : 'transparent',
                color: active ? '#34d399' : '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '15px', lineHeight: 1 }}>{tab.icon}</span>
              <span style={{ fontSize: '9.5px', fontWeight: active ? '800' : '600', whiteSpace: 'nowrap' }}>{tab.short}</span>
            </button>
          );
        })}
      </nav>
  );
}

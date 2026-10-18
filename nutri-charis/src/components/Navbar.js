import React from 'react';

export default function Navbar({ activeTab, setActiveTab, userRole, setUserRole }) {
  return (
    <header style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '16px 32px', 
      background: '#ffffff', 
      borderBottom: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img 
          src="/charis-funny.png"
          alt="Charis Logo" 
          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #059669' }} 
        />
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>
            NutriCharis <span style={{ color: '#059669' }}>SaaS</span>
          </h1>
          <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Clinical Nutrition Suite 🌿</p>
        </div>
      </div>

      <nav style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
        {userRole === 'admin' && (
          <button 
            onClick={() => setActiveTab('clients')}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'clients' ? '#ffffff' : 'transparent', color: activeTab === 'clients' ? '#0f172a' : '#64748b', fontWeight: '600', fontSize: '13px', cursor: 'pointer', boxShadow: activeTab === 'clients' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            👥 Πελάτες
          </button>
        )}
        {userRole === 'admin' && (
          <button 
            onClick={() => setActiveTab('appointments')}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'appointments' ? '#ffffff' : 'transparent', color: activeTab === 'appointments' ? '#0f172a' : '#64748b', fontWeight: '600', fontSize: '13px', cursor: 'pointer', boxShadow: activeTab === 'appointments' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            📅 Ραντεβού
          </button>
        )}
        <button 
          onClick={() => setActiveTab('mealplanner')}
          style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'mealplanner' ? '#ffffff' : 'transparent', color: activeTab === 'mealplanner' ? '#0f172a' : '#64748b', fontWeight: '600', fontSize: '13px', cursor: 'pointer', boxShadow: activeTab === 'mealplanner' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
          📋 Διαιτολόγιο & AI
        </button>
        {userRole === 'admin' && (
          <button 
            onClick={() => setActiveTab('calc')}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'calc' ? '#ffffff' : 'transparent', color: activeTab === 'calc' ? '#0f172a' : '#64748b', fontWeight: '600', fontSize: '13px', cursor: 'pointer', boxShadow: activeTab === 'calc' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            🧮 BMR / TDEE
          </button>
        )}
        <button 
          onClick={() => setActiveTab('measurements')}
          style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'measurements' ? '#ffffff' : 'transparent', color: activeTab === 'measurements' ? '#0f172a' : '#64748b', fontWeight: '600', fontSize: '13px', cursor: 'pointer', boxShadow: activeTab === 'measurements' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
          📊 Σώμα
        </button>
      </nav>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button 
          onClick={() => { setUserRole(userRole === 'admin' ? 'client' : 'admin'); setActiveTab('mealplanner'); }}
          style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '20px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', cursor: 'pointer', fontWeight: '600' }}>
          {userRole === 'admin' ? '👑 Admin Mode' : '👤 Client Mode'}
        </button>
      </div>
    </header>
  );
}
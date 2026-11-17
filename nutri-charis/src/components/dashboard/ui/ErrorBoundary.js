import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(err) {
    return { hasError: true, errorMsg: err?.message || 'Απρόσμενο σφάλμα' };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="luxury-card" style={{ maxWidth: '460px', padding: '32px', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 10px 0', color: '#34d399' }}>Ασφαλής Επαναφορά</h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>{this.state.errorMsg}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{ padding: '12px 22px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
            >
              Ανανέωση Εφαρμογής
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

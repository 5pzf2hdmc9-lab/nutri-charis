import React from 'react';

/**
 * Explicit GDPR Art.9 + terms checkboxes (required for health/biometric processing).
 */
export default function GdprConsentFields({
  gdprAccepted,
  setGdprAccepted,
  art9Accepted,
  setArt9Accepted,
  termsAccepted,
  setTermsAccepted,
  onOpenLegal,
  variant = 'dark'
}) {
  const textColor = variant === 'light' ? '#334155' : '#cbd5e1';
  const linkColor = variant === 'light' ? '#047857' : '#34d399';
  const labelStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '11px',
    color: textColor,
    lineHeight: 1.45,
    cursor: 'pointer'
  };
  const inlineLink = {
    background: 'none',
    border: 'none',
    color: linkColor,
    fontWeight: 800,
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'underline',
    fontSize: 'inherit'
  };

  return (
    <div style={{ display: 'grid', gap: '10px', marginTop: '4px' }}>
      <label style={labelStyle}>
        <input
          type="checkbox"
          checked={!!gdprAccepted}
          onChange={(e) => setGdprAccepted(e.target.checked)}
          required
          style={{ marginTop: '2px', accentColor: '#10b981' }}
        />
        <span>
          Αποδέχομαι την{' '}
          <button type="button" onClick={() => onOpenLegal?.('privacy')} style={inlineLink}>
            Πολιτική Απορρήτου (GDPR)
          </button>{' '}
          και την επεξεργασία των προσωπικών μου δεδομένων.
        </span>
      </label>

      <label style={labelStyle}>
        <input
          type="checkbox"
          checked={!!art9Accepted}
          onChange={(e) => setArt9Accepted(e.target.checked)}
          required
          style={{ marginTop: '2px', accentColor: '#10b981' }}
        />
        <span>
          Παρέχω <strong>ρητή συγκατάθεση Άρθρου 9 GDPR</strong> για επεξεργασία ευαίσθητων δεδομένων υγείας
          και βιομετρικών/ανθρωπομετρικών στοιχείων (βάρος, ύψος, λίπος, παθήσεις, διαιτολόγιο) αποκλειστικά
          για διαιτολογική παρακολούθηση.
        </span>
      </label>

      <label style={labelStyle}>
        <input
          type="checkbox"
          checked={!!termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          required
          style={{ marginTop: '2px', accentColor: '#10b981' }}
        />
        <span>
          Αποδέχομαι τους{' '}
          <button type="button" onClick={() => onOpenLegal?.('terms')} style={inlineLink}>
            Όρους Χρήσης
          </button>{' '}
          και την{' '}
          <button type="button" onClick={() => onOpenLegal?.('cookies')} style={inlineLink}>
            Πολιτική Cookies/Storage
          </button>
          .
        </span>
      </label>
    </div>
  );
}

import { usePlatform } from '../platformContext';

export default function GeminiApiKeyModal() {
  const { isAdmin, setShowApiKeyModal, showApiKeyModal } = usePlatform();
  if (!showApiKeyModal || !isAdmin) return null;
  return (
    <div
      className="no-print glass-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 350,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '14px'
      }}
      onClick={() => setShowApiKeyModal(false)}
    >
      <div
        className="luxury-card"
        style={{ width: '100%', maxWidth: '420px', padding: '22px', animation: 'fadeInSlide 0.2s ease' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-server-title"
      >
        <h3 id="ai-server-title" style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: '800' }}>
          Υπηρεσία AI
        </h3>
        <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '14px' }}>
          Το Gemini τρέχει μόνο στον server με <strong>GEMINI_API_KEY</strong> (Vercel). Δεν εισάγεται και δεν
          αποθηκεύεται κλειδί σε αυτόν τον browser. Η κλήση απαιτεί συνεδρία διαιτολόγου.
        </p>
        <button
          type="button"
          onClick={() => setShowApiKeyModal(false)}
          className="btn-emerald"
          style={{ width: '100%', padding: '11px', borderRadius: '11px', fontWeight: '800', cursor: 'pointer' }}
        >
          Κλείσιμο
        </button>
      </div>
    </div>
  );
}

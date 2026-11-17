import React, { useEffect } from 'react';
import { formatShoppingListText } from '../../lib/shoppingList';

/**
 * Grouped supermarket list modal — copy-ready for client share.
 */
export default function ShoppingListModal({ open, clientName, shoppingList = [], onClose, onCopied }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const copyList = () => {
    const txt = formatShoppingListText(shoppingList, clientName);
    const clip = navigator.clipboard;
    if (!clip?.writeText) {
      onCopied?.('Η αντιγραφή δεν υποστηρίζεται σε αυτό το περιβάλλον.');
      return;
    }
    clip.writeText(txt).then(
      () => onCopied?.('Η λίστα αντιγράφηκε!'),
      () => onCopied?.('Αποτυχία αντιγραφής — επιτρέψτε πρόσβαση στο πρόχειρο.')
    );
  };

  return (
    <div
      className="no-print glass-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 360,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shopping-list-title"
      onClick={onClose}
    >
      <div
        className="luxury-card glass-elevated"
        style={{ width: '100%', maxWidth: 540, maxHeight: '85vh', overflowY: 'auto', padding: 20, animation: 'fadeInSlide 0.22s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
          <div>
            <h3 id="shopping-list-title" className="font-display" style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: '#f8fafc' }}>
              Λίστα Σούπερ Μάρκετ
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#94a3b8', lineHeight: 1.45 }}>
              Ομαδοποίηση υλικών εβδομάδας ανά κατηγορία
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Κλείσιμο"
            style={{
              width: 32,
              height: 32,
              padding: 0,
              borderRadius: 9,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#cbd5e1',
              fontWeight: 800,
              fontSize: 14,
              lineHeight: 1,
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            ×
          </button>
        </div>

        {shoppingList.length === 0 ? (
          <div className="empty-state" role="status">
            <div className="empty-state__glyph" aria-hidden="true">▣</div>
            <p className="empty-state__title font-display">Κενή λίστα</p>
            <p className="empty-state__hint">Προσθέστε γεύματα στο εβδομαδιαίο πρόγραμμα.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {shoppingList.map((grp) => (
              <div
                key={grp.category}
                style={{
                  background: 'rgba(5,9,8,0.75)',
                  padding: '11px 13px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.07)'
                }}
              >
                <div className="field-label" style={{ color: '#34d399', marginBottom: 6 }}>{grp.category}</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#e2e8f0', lineHeight: 1.55 }}>
                  {grp.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
            <button type="button" className="btn-emerald" onClick={copyList} style={{ padding: 12, fontSize: 12.5 }}>
              Αντιγραφή Λίστας (WhatsApp / Viber / SMS)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

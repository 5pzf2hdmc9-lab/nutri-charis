import { useEffect } from 'react';
import { mergeWeekTemplates } from '../../../constants/dietPlan';
import EmptyState from '../ui/EmptyState';
import ExchangeLibrary from './ExchangeLibrary';
import { usePlatform } from '../platformContext';

function templateDays(tpl) {
  const days = tpl?.plan ? Object.keys(tpl.plan).length : 0;
  return days ? `${days} ημέρες` : 'Χωρίς ημέρες';
}

export default function WeekTemplatesModal() {
  const {
    activeClientObj,
    handleApplyWeekTemplate,
    handleSaveCurrentWeekAsTemplate,
    isAdmin,
    newTemplateName,
    setNewTemplateName,
    setShowTemplatesModal,
    showTemplatesModal,
    weekTemplates
  } = usePlatform();

  const open = Boolean(showTemplatesModal && isAdmin && activeClientObj);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setShowTemplatesModal(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setShowTemplatesModal]);

  if (!open) return null;

  const library = mergeWeekTemplates(weekTemplates);
  const close = () => setShowTemplatesModal(false);

  return (
    <div
      className="no-print glass-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 365,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '14px'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="week-templates-title"
      onClick={close}
    >
      <div
        className="luxury-card glass-elevated"
        style={{ width: '100%', maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto', padding: '20px', animation: 'fadeInSlide 0.2s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
          <div>
            <h3 id="week-templates-title" className="font-display" style={{ margin: 0, fontSize: '16.5px', fontWeight: 800, color: '#f8fafc' }}>
              Βιβλιοθήκη Προτύπων & Ισοδυνάμων
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.45 }}>
              Κλινικά πρωτόκολλα σε ένα βήμα · ελληνικά ισοδύναμα τροφίμων
            </p>
          </div>
          <button type="button" className="modal-close" onClick={close} aria-label="Κλείσιμο">
            ×
          </button>
        </div>

        <form onSubmit={handleSaveCurrentWeekAsTemplate} style={{ marginBottom: 14 }}>
          <label className="field-label" htmlFor="tpl-name">
            Νέο πρότυπο από την τρέχουσα εβδομάδα
          </label>
          <div className="template-save-row">
            <input
              id="tpl-name"
              className="luxury-input"
              placeholder="π.χ. Μεσογειακό 1600"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              required
              autoComplete="off"
            />
            <button
              type="submit"
              className="btn-emerald"
              style={{ padding: '11px 14px', borderRadius: 11, fontWeight: 800, fontSize: 12, whiteSpace: 'nowrap', cursor: 'pointer' }}
            >
              Αποθήκευση
            </button>
          </div>
        </form>

        <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
          {library.length === 0 ? (
            <EmptyState
              glyph="◇"
              title="Κενή βιβλιοθήκη"
              body="Αποθηκεύστε την τρέχουσα εβδομάδα για να την εφαρμόσετε ξανά."
            />
          ) : (
            library.map((tpl) => (
              <div key={tpl.id} className="template-row">
                <div style={{ minWidth: 0 }}>
                  <strong className="template-row__name">{tpl.name}</strong>
                  <div className="font-mono-num" style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
                    {templateDays(tpl)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyWeekTemplate(tpl)}
                  className="btn-emerald"
                  style={{ padding: '7px 12px', borderRadius: 9, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}
                >
                  Εφαρμογή
                </button>
              </div>
            ))
          )}
        </div>

        <ExchangeLibrary />
      </div>
    </div>
  );
}

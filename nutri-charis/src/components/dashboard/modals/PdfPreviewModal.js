import PrintableExcelSheet from '../print/PrintableExcelSheet';
import { usePlatform } from '../platformContext';

export default function PdfPreviewModal() {
  const { activeClientObj, pdfTheme, setPdfTheme, setShowPdfModal, showPdfModal } = usePlatform();
  return (
showPdfModal && activeClientObj && (
        <div
          className="glass-modal-backdrop no-print"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 400,
            overflowY: 'auto',
            padding: '14px'
          }}
        >
          <div style={{ maxWidth: '1320px', margin: '0 auto', animation: 'fadeInSlide 0.2s ease' }}>
            <div
              className="no-print luxury-card"
              style={{
                padding: '13px 16px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '14.5px', fontWeight: '800' }}>📄 Προεπισκόπηση PDF</span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setPdfTheme('green')}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '9px',
                    border: 'none',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    background: pdfTheme === 'green' ? '#10b981' : 'rgba(255,255,255,0.08)',
                    color: '#fff'
                  }}
                >
                  🌿 Πράσινο
                </button>
                <button
                  type="button"
                  onClick={() => setPdfTheme('blue')}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '9px',
                    border: 'none',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    background: pdfTheme === 'blue' ? '#0284c7' : 'rgba(255,255,255,0.08)',
                    color: '#fff'
                  }}
                >
                  🌊 Μπλε
                </button>
                <button
                  type="button"
                  onClick={() => {
                    document.body.classList.remove('print-mode-clinical');
                    document.body.classList.add('print-mode-excel');
                    window.setTimeout(() => {
                      window.print();
                      document.body.classList.remove('print-mode-excel');
                    }, 80);
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '9px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  Εκτύπωση Excel / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowPdfModal(false)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '9px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#e2e8f0',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <PrintableExcelSheet
              id="printable-excel-sheet-modal"
              theme={pdfTheme}
              clientObj={activeClientObj}
              mealPlan={activeClientObj.meal_plan || {}}
            />
          </div>
        </div>
      )
  );
}

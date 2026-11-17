import { usePlatform } from '../platformContext';

export default function MealCellEditModal() {
  const { editingCell, handleSaveManualCellEdit, handleSelectMealOption, isAdmin, saveIdeaToLibrary, setEditingCell } = usePlatform();
  return (
editingCell && isAdmin && (
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
        >
          <div className="luxury-card" style={{ width: '100%', maxWidth: '460px', padding: '20px', animation: 'fadeInSlide 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#34d399', fontWeight: '800', textTransform: 'uppercase' }}>{editingCell.day}</div>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '17px', fontWeight: '800' }}>{editingCell.type}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#cbd5e1', width: '32px', height: '32px', borderRadius: '9px', cursor: 'pointer', fontWeight: '800' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualCellEdit} style={{ display: 'grid', gap: '11px' }}>
              <textarea
                className="luxury-input"
                rows={4}
                value={editingCell.text}
                onChange={(e) => setEditingCell({ ...editingCell, text: e.target.value })}
                placeholder="π.χ. 150γρ κοτόπουλο ψητό, 150γρ ρύζι μπασμάτι & πράσινη σαλάτα"
                style={{ resize: 'vertical', lineHeight: '1.5' }}
              />
              <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  style={{ flex: 1, minWidth: '120px', padding: '11px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '11px', fontWeight: '800', fontSize: '12.5px', cursor: 'pointer' }}
                >
                  ✓ Αποθήκευση
                </button>
                {editingCell.text.trim() && (
                  <button
                    type="button"
                    onClick={() => saveIdeaToLibrary(editingCell.text, editingCell.type)}
                    style={{ padding: '11px 12px', background: 'rgba(245, 158, 11, 0.16)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '11px', fontWeight: '700', fontSize: '11.5px', cursor: 'pointer' }}
                  >
                    ⭐ Ιδέες
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    await handleSelectMealOption(editingCell.day, editingCell.type, '');
                    setEditingCell(null);
                  }}
                  style={{ padding: '11px 12px', background: 'rgba(239, 68, 68, 0.16)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '11px', fontWeight: '700', fontSize: '11.5px', cursor: 'pointer' }}
                >
                  🗑️
                </button>
              </div>
            </form>
          </div>
        </div>
      )
  );
}

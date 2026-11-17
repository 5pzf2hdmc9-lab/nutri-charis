import { practicePulse } from '../../lib/practicePulse';

export default function PracticePulse({ appointments, onReviewOutcomes }) {
  const pulse = practicePulse(appointments || []);
  const tiles = [
    { label: 'Σήμερα', value: pulse.today, hint: 'συνεδρίες στο γραφείο' },
    { label: '7 ημέρες', value: pulse.week, hint: 'ανοιχτό πρόγραμμα' },
    { label: 'No-show μήνα', value: pulse.noshow, hint: 'καταγεγραμμένες απουσίες' },
    { label: 'Χωρίς έκβαση', value: pulse.unresolved, hint: 'παρελθόν ακόμη «προγραμματισμένο»' }
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 14 }}>
      {tiles.map((tile) => (
        <div key={tile.label} style={{ background: 'rgba(5,9,8,0.75)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 12px' }}>
          <div className="field-label">{tile.label}</div>
          <div className="font-mono-num" style={{ fontSize: 20, fontWeight: 800, color: '#6ee7b7' }}>{tile.value}</div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>{tile.hint}</div>
        </div>
      ))}
      {pulse.unresolved > 0 && typeof onReviewOutcomes === 'function' ? (
        <button type="button" className="btn-emerald" onClick={onReviewOutcomes} style={{ gridColumn: '1 / -1', padding: '8px 12px', fontSize: 12 }}>
          Κλείστε έκβαση στις {pulse.unresolved} περασμένες συνεδρίες
        </button>
      ) : null}
    </div>
  );
}

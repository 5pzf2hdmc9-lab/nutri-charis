import React, { useState } from 'react';
import { BIOMARKER_DEFS, biomarkerStatus, toneClass } from '../../lib/biomarkerRanges';

const emptyForm = () => ({
  date: new Date().toISOString().slice(0, 10),
  ferritin: '',
  vitD: '',
  b12: '',
  hba1c: '',
  cholesterol: ''
});

/**
 * Blood biomarker log with colour-coded reference bands.
 * Persists via onSave(historyArray) into client questionnaire.lab_history.
 */
export default function BiomarkerPanel({ history = [], isAdmin, onSave }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const onChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin || typeof onSave !== 'function') return;
    setSaving(true);
    setError('');
    try {
      const row = { date: form.date, id: `${Date.now()}` };
      BIOMARKER_DEFS.forEach((d) => {
        const n = form[d.key] === '' ? null : Number(form[d.key]);
        row[d.key] = Number.isFinite(n) ? n : null;
      });
      const hasAny = BIOMARKER_DEFS.some((d) => row[d.key] != null);
      if (!hasAny) throw new Error('Συμπληρώστε τουλάχιστον έναν δείκτη.');
      const next = [row, ...(Array.isArray(history) ? history : [])].slice(0, 40);
      await onSave(next);
      setForm(emptyForm());
    } catch (err) {
      setError(err?.message || 'Αποτυχία αποθήκευσης.');
    } finally {
      setSaving(false);
    }
  };

  const latest = history[0] || null;

  return (
    <div style={{ display: 'grid', gap: 12, marginTop: 8 }}>
      <div>
        <div className="font-display" style={{ fontSize: 13, fontWeight: 800, color: '#e2e8f0' }}>
          Αιματολογικοί Δείκτες
        </div>
        <p style={{ margin: '3px 0 0', fontSize: 11, color: '#94a3b8' }}>
          Φερριτίνη · Vit D · B12 · HbA1c · Χοληστερίνη — ενδεικτικά φυσιολογικά όρια
        </p>
      </div>

      {latest && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
          {BIOMARKER_DEFS.map((def) => {
            const st = biomarkerStatus(def, latest[def.key]);
            return (
              <div key={def.key} className="luxury-card" style={{ padding: '10px 12px' }}>
                <div className="field-label">{def.label}</div>
                <div className="font-mono-num" style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
                  {latest[def.key] != null ? latest[def.key] : '—'}{' '}
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>{def.unit}</span>
                </div>
                <span className={`status-badge ${toneClass(st.tone)}`} style={{ marginTop: 6, display: 'inline-block' }}>
                  {st.label}
                </span>
                <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 4 }}>
                  Όρια {def.low}–{def.high} {def.unit}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isAdmin && (
        <form
          onSubmit={handleSubmit}
          className="luxury-card"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 8,
            padding: 12
          }}
        >
          <div>
            <label className="field-label" htmlFor="lab-date">Ημερομηνία</label>
            <input id="lab-date" className="luxury-input" type="date" required value={form.date} onChange={onChange('date')} />
          </div>
          {BIOMARKER_DEFS.map((d) => (
            <div key={d.key}>
              <label className="field-label" htmlFor={`lab-${d.key}`}>
                {d.label} ({d.unit})
              </label>
              <input
                id={`lab-${d.key}`}
                className="luxury-input font-mono-num"
                type="number"
                step="0.1"
                value={form[d.key]}
                onChange={onChange(d.key)}
                placeholder={`${d.low}–${d.high}`}
              />
            </div>
          ))}
          <button type="submit" className="btn-emerald" disabled={saving} style={{ padding: 11, fontSize: 12, alignSelf: 'end' }}>
            {saving ? 'Αποθήκευση…' : 'Καταγραφή δεικτών'}
          </button>
        </form>
      )}

      {error ? (
        <div role="alert" className="status-badge status-badge--danger" style={{ display: 'block', borderRadius: 11, padding: '10px 12px' }}>
          {error}
        </div>
      ) : null}

      {history.length === 0 ? (
        <div className="empty-state" role="status">
          <div className="empty-state__glyph" aria-hidden="true">⊕</div>
          <p className="empty-state__title font-display">Χωρίς εργαστηριακά</p>
          <p className="empty-state__hint">Καταγράψτε φερριτίνη, Vit D, B12, HbA1c ή χοληστερίνη.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {history.slice(0, 8).map((row) => (
            <div
              key={row.id || row.date}
              style={{
                background: 'rgba(5,9,8,0.6)',
                padding: '10px 12px',
                borderRadius: 11,
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px 12px',
                alignItems: 'center'
              }}
            >
              <span className="font-mono-num" style={{ fontSize: 11.5, color: '#94a3b8' }}>{row.date}</span>
              {BIOMARKER_DEFS.map((d) => {
                if (row[d.key] == null) return null;
                const st = biomarkerStatus(d, row[d.key]);
                return (
                  <span key={d.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#cbd5e1' }}>
                    <span className="font-mono-num">
                      {d.label}: {row[d.key]}
                    </span>
                    <span className={`status-badge ${toneClass(st.tone)}`} style={{ padding: '1px 6px', fontSize: 9 }}>
                      {st.label}
                    </span>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

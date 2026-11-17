import React from 'react';

const CIRC = [
  { key: 'neck', label: 'Λαιμός' },
  { key: 'chest', label: 'Στήθος' },
  { key: 'arm', label: 'Βραχίονας' },
  { key: 'hip', label: 'Ισχίο' },
  { key: 'thigh', label: 'Μηρός' },
  { key: 'calf', label: 'Γάμπα' }
];

const FOLDS = [
  { key: 'triceps', label: 'Τρικέφαλος' },
  { key: 'biceps', label: 'Δικέφαλος' },
  { key: 'subscapular', label: 'Υποπλάτιος' },
  { key: 'suprailiac', label: 'Υπερλαγόνιος' },
  { key: 'abdominal', label: 'Κοιλιακός' },
  { key: 'thighFold', label: 'Μηρός' },
  { key: 'calfFold', label: 'Γάμπα' },
  { key: 'chestFold', label: 'Θωρακική' }
];

const FIELD_TOTAL = CIRC.length + FOLDS.length;

function filledCount(values) {
  return [...CIRC, ...FOLDS].filter(({ key }) => {
    const raw = values?.[key];
    return raw !== '' && raw != null && Number.isFinite(Number(raw));
  }).length;
}

function FieldGrid({ title, unit, fields, values, onChange, disabled }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="section-kicker">{title}</div>
      <div className="anthro-grid">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="field-label" htmlFor={`anthro-${f.key}`}>
              {f.label} ({unit})
            </label>
            <input
              id={`anthro-${f.key}`}
              className="luxury-input font-mono-num"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              disabled={disabled}
              value={values[f.key] ?? ''}
              onChange={(e) => onChange(f.key, e.target.value)}
              placeholder="—"
              autoComplete="off"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Circumferences (cm) + skinfolds (mm), logged with each measurement. */
export default function AnthropometricsPanel({ isAdmin, values = {}, onChange }) {
  const setField = (key, raw) => {
    onChange({ ...values, [key]: raw });
  };
  const filled = filledCount(values);

  return (
    <section className="clinical-inset" style={{ marginTop: 12, marginBottom: 14 }} aria-labelledby="anthro-title">
      <div className="clinical-inset__head">
        <div>
          <h4 id="anthro-title" className="font-display clinical-inset__title">
            Περιφέρειες & Δερματοπτυχές
          </h4>
          <p className="clinical-inset__hint">
            Προαιρετικά με κάθε μέτρηση. cm = περιφέρεια · mm = δερματοπτυχή.
          </p>
        </div>
        <span className={`status-badge font-mono-num ${filled ? 'status-badge--success' : 'status-badge--info'}`}>
          {filled}/{FIELD_TOTAL}
        </span>
      </div>
      <FieldGrid title="Περιφέρειες" unit="cm" fields={CIRC} values={values} onChange={setField} disabled={!isAdmin} />
      <FieldGrid title="Δερματοπτυχές" unit="mm" fields={FOLDS} values={values} onChange={setField} disabled={!isAdmin} />
    </section>
  );
}

export function buildAnthroPayload(values = {}) {
  const out = { circ: {}, folds: {} };
  CIRC.forEach(({ key }) => {
    const n = Number(values[key]);
    if (values[key] !== '' && Number.isFinite(n) && n > 0) out.circ[key] = n;
  });
  FOLDS.forEach(({ key }) => {
    const n = Number(values[key]);
    if (values[key] !== '' && Number.isFinite(n) && n > 0) out.folds[key] = n;
  });
  if (!Object.keys(out.circ).length && !Object.keys(out.folds).length) return {};
  return out;
}

export function formatAnthroChips(anthro) {
  if (!anthro || typeof anthro !== 'object') return [];
  const chips = [];
  CIRC.forEach(({ key, label }) => {
    const v = anthro.circ?.[key];
    if (v == null || v === '') return;
    chips.push({ key: `c-${key}`, text: `${label} · ${v} cm`, tone: 'info' });
  });
  FOLDS.forEach(({ key, label }) => {
    const v = anthro.folds?.[key];
    if (v == null || v === '') return;
    chips.push({ key: `f-${key}`, text: `${label} · ${v} mm`, tone: 'success' });
  });
  return chips;
}

export function AnthroChipRow({ anthro, limit = 8 }) {
  const chips = formatAnthroChips(anthro);
  if (!chips.length) return null;
  const shown = chips.slice(0, limit);
  const rest = chips.length - shown.length;
  return (
    <div className="chip-row" aria-label="Περιφέρειες και δερματοπτυχές">
      {shown.map((c) => (
        <span key={c.key} className={`status-badge status-badge--${c.tone}`}>
          {c.text}
        </span>
      ))}
      {rest > 0 ? <span className="stub-chip">+{rest}</span> : null}
    </div>
  );
}

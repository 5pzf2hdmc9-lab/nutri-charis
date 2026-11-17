import { buildAnthroPayload } from './AnthropometricsPanel';
import { deriveAnthroIndices, hasAnthroInsight } from '../../lib/anthropometry';

const TONE = { ok: 'success', warn: 'warn', danger: 'danger', under: 'info', over: 'warn' };

function latestMeasurement(rows) {
  return [...(rows || [])].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))[0] || null;
}

function Metric({ label, value, hint, badge, tone = 'info' }) {
  return (
    <div style={{ background: 'rgba(5,9,8,0.75)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 12px' }}>
      <div className="field-label">{label}</div>
      <div className="font-mono-num" style={{ fontSize: 16, fontWeight: 800, color: '#ecfdf5', marginTop: 2 }}>{value}</div>
      {badge ? (
        <span className={`status-badge status-badge--${TONE[tone] || 'info'}`} style={{ marginTop: 6 }}>{badge}</span>
      ) : null}
      {hint ? <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{hint}</div> : null}
    </div>
  );
}

function IndexGrid({ indices }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
      {indices.sumMm != null && (
        <Metric label="Σ δερματοπτυχών" value={`${indices.sumMm} mm`} hint="Άθροισμα καταχωρημένων πτυχών" />
      )}
      {indices.dw && (
        <Metric label="Λίπος DW" value={`${indices.dw.bodyFat}%`} hint={indices.dw.method} badge="Εξίσωση" tone="info" />
      )}
      {indices.jp && (
        <Metric label="Λίπος JP3" value={`${indices.jp.bodyFat}%`} hint={indices.jp.method} badge="Εξίσωση" tone="info" />
      )}
      {indices.navy && (
        <Metric label="Λίπος Navy" value={`${indices.navy.bodyFat}%`} hint={indices.navy.method} badge="Περιφέρειες" tone="info" />
      )}
      {indices.whr && (
        <Metric label="WHR μέση/ισχίο" value={indices.whr.ratio.toFixed(2)} badge={indices.whr.label} tone={indices.whr.tone} />
      )}
      {indices.whtr && (
        <Metric label="WHtR μέση/ύψος" value={indices.whtr.ratio.toFixed(2)} badge={indices.whtr.label} tone={indices.whtr.tone} />
      )}
    </div>
  );
}

function Block({ title, indices }) {
  if (!hasAnthroInsight(indices)) return null;
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div className="field-label">{title}</div>
      <IndexGrid indices={indices} />
    </div>
  );
}

/** Live + latest derived body-comp indices. Equation estimates are labeled as such. */
export default function AnthroIndices({ client, draftValues, draftWaist, measurements }) {
  if (!client) return null;
  const profile = {
    age: client.age,
    gender: client.gender,
    heightCm: client.height
  };
  const draft = deriveAnthroIndices({
    ...profile,
    anthro: buildAnthroPayload(draftValues || {}),
    waist: draftWaist
  });
  const last = latestMeasurement(measurements);
  const saved = last
    ? deriveAnthroIndices({ ...profile, anthro: last.anthro || {}, waist: last.waist })
    : null;
  const showDraft = hasAnthroInsight(draft);
  const showSaved = saved && hasAnthroInsight(saved);

  return (
    <section className="clinical-inset" style={{ marginBottom: 14 }} aria-label="Κλινικοί δείκτες σύστασης">
      <h4 className="font-display clinical-inset__title">Κλινικοί δείκτες σύστασης</h4>
      <p className="clinical-inset__hint" style={{ marginBottom: 10 }}>
        Durnin–Womersley, Jackson–Pollock 3, US Navy, WHR και WHtR. Εκτίμηση εξίσωσης — όχι DEXA.
      </p>
      {!showDraft && !showSaved ? (
        <div className="empty-state" role="status" style={{ minHeight: 0, padding: '14px 12px' }}>
          <p className="empty-state__title font-display" style={{ fontSize: 13 }}>Λείπουν σημεία για εξίσωση</p>
          <p className="empty-state__hint">
            4 πτυχές (δικέφαλος, τρικέφαλος, υποπλάτιος, υπερλαγόνιος) για DW, ή λαιμός + μέση για Navy.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <Block title="Τρέχουσα καταχώρηση" indices={draft} />
          <Block title={last?.date ? `Τελευταία μέτρηση · ${last.date}` : 'Τελευταία μέτρηση'} indices={saved || {}} />
        </div>
      )}
    </section>
  );
}

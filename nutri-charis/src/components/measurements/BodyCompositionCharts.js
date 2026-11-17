import React, { useMemo } from 'react';

function seriesPoints(data, field, W = 700, H = 130, padX = 40, padY = 22) {
  const vals = data.map((d) => Number(d[field])).filter((n) => Number.isFinite(n));
  if (vals.length < 2) return null;
  const min = Math.min(...vals) - (Math.abs(Math.min(...vals)) * 0.02 || 1);
  const max = Math.max(...vals) + (Math.abs(Math.max(...vals)) * 0.02 || 1);
  const span = Math.max(0.1, max - min);
  const indexed = data
    .map((d, idx) => ({ idx, v: Number(d[field]), date: d.date }))
    .filter((p) => Number.isFinite(p.v));
  const n = indexed.length;
  const points = indexed.map((p, i) => {
    const x = padX + (i / Math.max(1, n - 1)) * (W - padX * 2);
    const y = H - padY - ((p.v - min) / span) * (H - padY * 2);
    return { x, y, v: p.v, date: p.date };
  });
  return { points, polyline: points.map((p) => `${p.x},${p.y}`).join(' '), min, max };
}

function LineChart({ title, color, data, field, unit }) {
  const series = useMemo(() => seriesPoints(data, field), [data, field]);
  if (!series) {
    return (
      <div className="empty-state" role="status" style={{ minHeight: 120, padding: '16px 12px' }}>
        <div className="empty-state__glyph" aria-hidden="true" style={{ width: 36, height: 36, fontSize: 14, marginBottom: 8 }}>
          ⌁
        </div>
        <p className="empty-state__title font-display" style={{ fontSize: 12.5 }}>{title}</p>
        <p className="empty-state__hint" style={{ fontSize: 11 }}>
          Χρειάζονται ≥2 μετρήσεις με {unit} για διάγραμμα.
        </p>
      </div>
    );
  }

  return (
    <div
      className="luxury-card"
      style={{
        padding: 14,
        borderColor: `${color}44`,
        boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.08), 0 16px 32px -16px rgba(0,0,0,0.55)`
      }}
    >
      <div className="field-label" style={{ color, marginBottom: 6 }}>{title}</div>
      <svg viewBox="0 0 700 130" style={{ width: '100%', height: 118 }} role="img" aria-label={title}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={series.polyline}
        />
        {series.points.map((p, i) => (
          <g key={`${p.date}-${i}`}>
            <circle cx={p.x} cy={p.y} r="4.5" fill="#050807" stroke={color} strokeWidth="2" />
            <text
              x={p.x}
              y={p.y - 9}
              fill="#e2e8f0"
              fontSize="10"
              fontWeight="700"
              textAnchor="middle"
              className="font-mono-num"
            >
              {p.v}
              {unit}
            </text>
            <text x={p.x} y="122" fill="#64748b" fontSize="9.5" textAnchor="middle">
              {String(p.date || '').slice(5)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/**
 * Responsive SVG progress charts: weight, body fat %, muscle mass, waist.
 */
export default function BodyCompositionCharts({ data = [] }) {
  const sorted = useMemo(
    () => [...data].sort((a, b) => String(a.date).localeCompare(String(b.date))),
    [data]
  );

  return (
    <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
      <div className="font-display" style={{ fontSize: 13, fontWeight: 800, color: '#e2e8f0' }}>
        Εξέλιξη Σύστασης Σώματος
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
        <LineChart title="Βάρος" color="#34d399" data={sorted} field="weight" unit="kg" />
        <LineChart title="Ποσοστό Λίπους" color="#fbbf24" data={sorted} field="body_fat" unit="%" />
        <LineChart title="Μυϊκή Μάζα" color="#38bdf8" data={sorted} field="muscle_mass" unit="kg" />
        <LineChart title="Περίμετρος Μέσης" color="#86efac" data={sorted} field="waist" unit="cm" />
      </div>
    </div>
  );
}

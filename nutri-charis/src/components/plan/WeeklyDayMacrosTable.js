import React from 'react';
import { computeMacroTargets, macroDelta, statusTone } from '../../lib/macroTargets';

const COLS = [
  { key: 'kcal', label: 'Θερμίδες', unit: 'kcal', color: '#34d399' },
  { key: 'protein', label: 'Πρωτεΐνη', unit: 'g', color: '#38bdf8' },
  { key: 'carbs', label: 'Υδατάνθρακες', unit: 'g', color: '#fbbf24' },
  { key: 'fat', label: 'Λιπαρά', unit: 'g', color: '#fb7185' },
  { key: 'fiber', label: 'Ίνες', unit: 'g', color: '#a3e635' }
];

function toneBadge(tone) {
  if (tone === 'under') return 'status-badge--info';
  if (tone === 'over') return 'status-badge--warn';
  return 'status-badge--success';
}

function toneColor(tone) {
  if (tone === 'under') return '#94a3b8';
  if (tone === 'over') return '#fde68a';
  return '#34d399';
}

/**
 * Live Mon–Sun macros vs BMR/TDEE-derived targets. Click a day to select it.
 */
export default function WeeklyDayMacrosTable({
  weeklyStats = [],
  targetKcal,
  weightKg,
  bmr,
  tdee,
  selectedDay,
  onSelectDay
}) {
  const targets = computeMacroTargets({ targetKcal, weightKg });
  const rows = Array.isArray(weeklyStats) ? weeklyStats : [];

  return (
    <div className="luxury-card" style={{ padding: '13px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <div>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 800, color: '#e2e8f0' }}>
            Ζωντανά Μακροθρεπτικά · 7 Ημέρες
          </div>
          <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
            Σύγκριση με στόχο {targets.kcal} kcal (BMR {bmr || '—'} · TDEE {tdee || '—'})
          </div>
        </div>
        <div className="font-mono-num" style={{ fontSize: 10.5, color: '#64748b', textAlign: 'right' }}>
          Στόχοι: P {targets.protein}g · C {targets.carbs}g · F {targets.fat}g · Ίνες {targets.fiber}g
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="empty-state" role="status" style={{ padding: '22px 14px' }}>
          <div className="empty-state__glyph" aria-hidden="true">▦</div>
          <p className="empty-state__title font-display">Χωρίς ημερήσια δεδομένα</p>
          <p className="empty-state__hint">Προσθέστε γεύματα στο εβδομαδιαίο πρόγραμμα για ζωντανά macros.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: 640, borderCollapse: 'separate', borderSpacing: '0 6px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', fontSize: 10, color: '#64748b', fontWeight: 800, padding: '0 8px' }}>ΗΜΕΡΑ</th>
                {COLS.map((c) => (
                  <th key={c.key} style={{ textAlign: 'right', fontSize: 10, color: c.color, fontWeight: 800, padding: '0 8px' }}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const active = row.day === selectedDay;
                const vals = {
                  kcal: row.kcal || 0,
                  protein: row.protein || 0,
                  carbs: row.carbs || 0,
                  fat: row.fat || 0,
                  fiber: row.micros?.fiber ?? 0
                };
                return (
                  <tr
                    key={row.day}
                    onClick={() => onSelectDay?.(row.day)}
                    style={{
                      cursor: onSelectDay ? 'pointer' : 'default',
                      background: active ? 'rgba(16, 185, 129, 0.14)' : 'rgba(255,255,255,0.03)'
                    }}
                  >
                    <td
                      style={{
                        padding: '9px 10px',
                        borderRadius: '10px 0 0 10px',
                        fontSize: 12,
                        fontWeight: 800,
                        color: active ? '#6ee7b7' : '#cbd5e1',
                        borderLeft: active ? '3px solid #10b981' : '3px solid transparent'
                      }}
                    >
                      {row.day}
                    </td>
                    {COLS.map((c, idx) => {
                      const d = macroDelta(vals[c.key], targets[c.key]);
                      const tone = statusTone(d.pct);
                      const last = idx === COLS.length - 1;
                      return (
                        <td
                          key={c.key}
                          className="font-mono-num"
                          style={{
                            padding: '9px 10px',
                            textAlign: 'right',
                            borderRadius: last ? '0 10px 10px 0' : 0,
                            fontSize: 12,
                            fontWeight: 800,
                            color: toneColor(tone)
                          }}
                        >
                        {Number.isFinite(vals[c.key]) ? vals[c.key] : '—'}
                        <span style={{ fontSize: 9, color: '#64748b', fontWeight: 600, marginLeft: 3 }}>
                          /{targets[c.key]}
                        </span>
                          <div style={{ marginTop: 3 }}>
                            <span className={`status-badge ${toneBadge(tone)}`} style={{ padding: '1px 6px', fontSize: 9 }}>
                              {d.pct}%
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

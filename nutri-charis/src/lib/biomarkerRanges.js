/** Adult lab reference bands for colour cues (not diagnosis). */
export const BIOMARKER_DEFS = [
  {
    key: 'ferritin',
    label: 'Φερριτίνη',
    unit: 'ng/mL',
    low: 30,
    high: 400,
    warnLow: 15,
    warnHigh: 500
  },
  {
    key: 'vitD',
    label: 'Βιταμίνη D',
    unit: 'ng/mL',
    low: 30,
    high: 100,
    warnLow: 20,
    warnHigh: 150
  },
  {
    key: 'b12',
    label: 'Βιταμίνη B12',
    unit: 'pg/mL',
    low: 200,
    high: 900,
    warnLow: 150,
    warnHigh: 1100
  },
  {
    key: 'hba1c',
    label: 'HbA1c',
    unit: '%',
    low: 4.0,
    high: 5.6,
    warnLow: 3.5,
    warnHigh: 6.4
  },
  {
    key: 'cholesterol',
    label: 'Χοληστερίνη',
    unit: 'mg/dL',
    low: 0,
    high: 200,
    warnLow: 0,
    warnHigh: 240
  }
];

export function biomarkerStatus(def, raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return { tone: 'empty', label: '—' };
  if (n < def.warnLow || n > def.warnHigh) return { tone: 'danger', label: 'Εκτός ορίων' };
  if (n < def.low || n > def.high) return { tone: 'warn', label: 'Οριακό' };
  return { tone: 'ok', label: 'Φυσιολογικό' };
}

export function toneClass(tone) {
  if (tone === 'ok') return 'status-badge--success';
  if (tone === 'warn') return 'status-badge--warn';
  if (tone === 'danger') return 'status-badge--danger';
  return 'status-badge--info';
}

/** Athlisis-class indices from circumferences (cm) and skinfolds (mm). */

function pos(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function siri(density) {
  if (!Number.isFinite(density) || density <= 0.9 || density >= 1.15) return null;
  const bf = 495 / density - 450;
  if (!Number.isFinite(bf) || bf < 2 || bf > 60) return null;
  return round1(bf);
}

const DW = {
  male: [
    { max: 19, a: 1.162, b: 0.063 },
    { max: 29, a: 1.1631, b: 0.0632 },
    { max: 39, a: 1.1422, b: 0.0544 },
    { max: 49, a: 1.162, b: 0.07 },
    { max: 200, a: 1.1715, b: 0.0779 }
  ],
  female: [
    { max: 19, a: 1.1549, b: 0.0678 },
    { max: 29, a: 1.1599, b: 0.0717 },
    { max: 39, a: 1.1423, b: 0.0632 },
    { max: 49, a: 1.1333, b: 0.0612 },
    { max: 200, a: 1.1339, b: 0.0645 }
  ]
};

const FOLD_KEYS = ['triceps', 'biceps', 'subscapular', 'suprailiac', 'abdominal', 'thighFold', 'calfFold', 'chestFold'];

export function sumSkinfolds(folds = {}) {
  const vals = FOLD_KEYS.map((k) => pos(folds[k])).filter((n) => n != null);
  if (!vals.length) return null;
  return round1(vals.reduce((a, b) => a + b, 0));
}

/** Durnin–Womersley 1974, 4 sites → Siri %BF. */
export function durninWomersley({ folds = {}, age, gender }) {
  const sites = ['biceps', 'triceps', 'subscapular', 'suprailiac'].map((k) => pos(folds[k]));
  const ageN = pos(age);
  if (sites.some((v) => v == null) || !ageN) return null;
  const L = Math.log10(sites.reduce((a, b) => a + b, 0));
  const table = gender === 'male' ? DW.male : DW.female;
  const row = table.find((r) => ageN <= r.max) || table[table.length - 1];
  const bodyFat = siri(row.a - row.b * L);
  return bodyFat == null ? null : { bodyFat, method: 'Durnin–Womersley 4' };
}

/** Jackson–Pollock 3-site. Men: chest + abdomen + thigh. Women: triceps + suprailiac + thigh. */
export function jacksonPollock3({ folds = {}, age, gender }) {
  const ageN = pos(age);
  if (!ageN) return null;
  if (gender === 'male') {
    const parts = [pos(folds.chestFold), pos(folds.abdominal), pos(folds.thighFold)];
    if (parts.some((v) => v == null)) return null;
    const sum = parts.reduce((a, b) => a + b, 0);
    const density = 1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * ageN;
    const bodyFat = siri(density);
    return bodyFat == null ? null : { bodyFat, method: 'Jackson–Pollock 3' };
  }
  const parts = [pos(folds.triceps), pos(folds.suprailiac), pos(folds.thighFold)];
  if (parts.some((v) => v == null)) return null;
  const sum = parts.reduce((a, b) => a + b, 0);
  const density = 1.0994921 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * ageN;
  const bodyFat = siri(density);
  return bodyFat == null ? null : { bodyFat, method: 'Jackson–Pollock 3' };
}

export function waistHipRatio(waist, hip, gender) {
  const w = pos(waist);
  const h = pos(hip);
  if (!w || !h) return null;
  const ratio = Math.round((w / h) * 100) / 100;
  const cut = gender === 'male' ? 0.9 : 0.85;
  const high = gender === 'male' ? 1 : 0.95;
  const tone = ratio >= high ? 'danger' : ratio >= cut ? 'warn' : 'ok';
  const label = tone === 'ok' ? 'Εντός ορίου WHO' : tone === 'warn' ? 'Αυξημένος κίνδυνος WHO' : 'Υψηλός κίνδυνος WHO';
  return { ratio, tone, label };
}

export function waistHeightRatio(waist, heightCm) {
  const w = pos(waist);
  const h = pos(heightCm);
  if (!w || !h) return null;
  const ratio = Math.round((w / h) * 100) / 100;
  const tone = ratio >= 0.6 ? 'danger' : ratio >= 0.5 ? 'warn' : 'ok';
  const label = ratio >= 0.5 ? 'Πάνω από 0,50' : 'Κάτω από 0,50';
  return { ratio, tone, label };
}

/** Hodgdon & Beckett US Navy. Inputs are cm; coefficients expect inches. */
export function navyBodyFat({ gender, heightCm, neck, waist, hip }) {
  const h = pos(heightCm);
  const n = pos(neck);
  const w = pos(waist);
  if (!h || !n || !w) return null;
  const inch = (cm) => cm / 2.54;
  let bf;
  if (gender === 'male') {
    if (w <= n) return null;
    bf = 86.01 * Math.log10(inch(w - n)) - 70.041 * Math.log10(inch(h)) + 36.76;
  } else {
    const hp = pos(hip);
    if (!hp || w + hp <= n) return null;
    bf = 163.205 * Math.log10(inch(w + hp - n)) - 97.684 * Math.log10(inch(h)) - 78.387;
  }
  if (!Number.isFinite(bf) || bf < 2 || bf > 60) return null;
  return { bodyFat: round1(bf), method: 'US Navy' };
}

export function deriveAnthroIndices({ anthro = {}, waist, age, gender, heightCm }) {
  const g = gender === 'male' ? 'male' : 'female';
  const folds = anthro.folds || {};
  const circ = anthro.circ || {};
  return {
    sumMm: sumSkinfolds(folds),
    dw: durninWomersley({ folds, age, gender: g }),
    jp: jacksonPollock3({ folds, age, gender: g }),
    whr: waistHipRatio(waist, circ.hip, g),
    whtr: waistHeightRatio(waist, heightCm),
    navy: navyBodyFat({ gender: g, heightCm, neck: circ.neck, waist, hip: circ.hip })
  };
}

export function hasAnthroInsight(indices) {
  if (!indices) return false;
  return Boolean(indices.sumMm || indices.dw || indices.jp || indices.whr || indices.whtr || indices.navy);
}

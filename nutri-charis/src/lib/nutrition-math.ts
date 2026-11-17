// @ts-nocheck — Zod 4 typings require TypeScript 5+; CRA pins TS 4.9 via react-scripts.
import { z } from 'zod';

/**
 * Official FDA Daily Values — 27 micronutrients (vitamins + minerals/choline).
 * Base `dv` = adult Nutrition Facts reference; use resolveFdaDv() for sex/age bars.
 */
export const FDA_MICROS = [
  { key: 'vitA', label: 'Βιταμίνη A', unit: 'mcg', dv: 900, color: '#fbbf24' },
  { key: 'vitC', label: 'Βιταμίνη C', unit: 'mg', dv: 90, color: '#facc15' },
  { key: 'vitD', label: 'Βιταμίνη D', unit: 'mcg', dv: 20, color: '#38bdf8' },
  { key: 'vitE', label: 'Βιταμίνη E', unit: 'mg', dv: 15, color: '#a3e635' },
  { key: 'vitK', label: 'Βιταμίνη K', unit: 'mcg', dv: 120, color: '#4ade80' },
  { key: 'thiamin', label: 'Θειαμίνη B1', unit: 'mg', dv: 1.2, color: '#fb923c' },
  { key: 'riboflavin', label: 'Ριβοφλαβίνη B2', unit: 'mg', dv: 1.3, color: '#fdba74' },
  { key: 'niacin', label: 'Νιασίνη B3', unit: 'mg', dv: 16, color: '#f97316' },
  { key: 'vitB6', label: 'Βιταμίνη B6', unit: 'mg', dv: 1.7, color: '#fb7185' },
  { key: 'folate', label: 'Φυλλικό B9', unit: 'mcg', dv: 400, color: '#f59e0b' },
  { key: 'vitB12', label: 'Βιταμίνη B12', unit: 'mcg', dv: 2.4, color: '#0ea5e9' },
  { key: 'biotin', label: 'Βιοτίνη B7', unit: 'mcg', dv: 30, color: '#14b8a6' },
  { key: 'pantothenic', label: 'Παντοθενικό B5', unit: 'mg', dv: 5, color: '#67e8f9' },
  { key: 'calcium', label: 'Ασβέστιο', unit: 'mg', dv: 1300, color: '#60a5fa' },
  { key: 'iron', label: 'Σίδηρος', unit: 'mg', dv: 18, color: '#f87171' },
  { key: 'phosphorus', label: 'Φώσφορος', unit: 'mg', dv: 1250, color: '#7dd3fc' },
  { key: 'iodine', label: 'Ιώδιο', unit: 'mcg', dv: 150, color: '#22d3ee' },
  { key: 'magnesium', label: 'Μαγνήσιο', unit: 'mg', dv: 420, color: '#2dd4bf' },
  { key: 'zinc', label: 'Ψευδάργυρος', unit: 'mg', dv: 11, color: '#14b8a6' },
  { key: 'selenium', label: 'Σελήνιο', unit: 'mcg', dv: 55, color: '#34d399' },
  { key: 'copper', label: 'Χαλκός', unit: 'mg', dv: 0.9, color: '#86efac' },
  { key: 'manganese', label: 'Μαγγάνιο', unit: 'mg', dv: 2.3, color: '#a7f3d0' },
  { key: 'chromium', label: 'Χρώμιο', unit: 'mcg', dv: 35, color: '#6ee7b7' },
  { key: 'molybdenum', label: 'Μολυβδαίνιο', unit: 'mcg', dv: 45, color: '#5eead4' },
  { key: 'chloride', label: 'Χλώριο', unit: 'mg', dv: 2300, color: '#94a3b8' },
  { key: 'potassium', label: 'Κάλιο', unit: 'mg', dv: 4700, color: '#34d399' },
  { key: 'choline', label: 'Χολίνη', unit: 'mg', dv: 550, color: '#fcd34d' }
] as const;

export type FdaMicroKey = (typeof FDA_MICROS)[number]['key'];

const DEFAULT_SELECTED_MICROS: FdaMicroKey[] = [
  'vitA',
  'vitC',
  'vitD',
  'calcium',
  'iron',
  'magnesium',
  'potassium',
  'zinc'
];

export function getDefaultSelectedMicros(): FdaMicroKey[] {
  return [...DEFAULT_SELECTED_MICROS];
}

/**
 * Sex/age–aware Daily Value for live % bars (FDA label base + RDA-style adjustments).
 */
export function resolveFdaDv(
  key: FdaMicroKey | string,
  profile: { gender?: string; age?: number } = {}
): number {
  const micro = FDA_MICROS.find((m) => m.key === key);
  if (!micro) return 0;
  const gender = profile.gender === 'male' ? 'male' : 'female';
  const age = clampNum(profile.age, 5, 115, 30);
  const base = micro.dv;

  switch (key) {
    case 'iron':
      if (gender === 'male') return 8;
      if (age > 50) return 8;
      return 18;
    case 'magnesium':
      return gender === 'male' ? 420 : 320;
    case 'zinc':
      return gender === 'male' ? 11 : 8;
    case 'vitA':
      return gender === 'male' ? 900 : 700;
    case 'vitC':
      return gender === 'male' ? 90 : 75;
    case 'vitK':
      return gender === 'male' ? 120 : 90;
    case 'thiamin':
      return gender === 'male' ? 1.2 : 1.1;
    case 'riboflavin':
      return gender === 'male' ? 1.3 : 1.1;
    case 'niacin':
      return gender === 'male' ? 16 : 14;
    case 'vitB6':
      if (age > 50) return gender === 'male' ? 1.7 : 1.5;
      return gender === 'male' ? 1.3 : 1.3;
    case 'choline':
      return gender === 'male' ? 550 : 425;
    case 'chromium':
      if (age > 50) return gender === 'male' ? 30 : 20;
      return gender === 'male' ? 35 : 25;
    case 'calcium':
      if (age < 19) return 1300;
      if (age > 50) return 1200;
      return 1000;
    case 'phosphorus':
      return age < 19 ? 1250 : 700;
    default:
      return base;
  }
}

const metabolismInputSchema = z.object({
  gender: z.union([z.literal('male'), z.literal('female')]).default('female'),
  age: z.coerce.number().finite().min(5).max(115).default(30),
  weight: z.coerce.number().finite().min(25).max(350).default(65),
  height: z.coerce.number().finite().min(90).max(240).default(165),
  activity: z.coerce.number().finite().min(1.1).max(2.4).default(1.375),
  bodyFat: z.union([z.coerce.number().finite().min(3).max(70), z.null(), z.literal('')]).optional()
});

export type MetabolismInput = z.infer<typeof metabolismInputSchema>;

export type MetabolismResult = {
  mifflin: { bmr: number; tdee: number; bmi: number };
  harris: { bmr: number; tdee: number; bmi: number };
  katch: { bmr: number; tdee: number; bmi: number; lbm: number; bfUsed: number };
};

/** Safe numeric clamp — never returns NaN/Infinity when fallback is finite. */
export function clampNum(
  val: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  const n = typeof val === 'number' ? val : parseFloat(String(val ?? ''));
  if (Number.isNaN(n) || !Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Strict range parse for form validation.
 * Returns NaN for non-numeric OR out-of-range (no silent clamp).
 */
export function parseStrictNum(val: unknown, min: number, max: number): number {
  const n = typeof val === 'number' ? val : parseFloat(String(val ?? ''));
  if (Number.isNaN(n) || !Number.isFinite(n) || n < min || n > max) return Number.NaN;
  return n;
}

function safeRound(n: number): number {
  if (!Number.isFinite(n) || Number.isNaN(n)) return 0;
  return Math.round(n);
}

function safeFixed(n: number, digits: number): number {
  if (!Number.isFinite(n) || Number.isNaN(n)) return 0;
  return Number(n.toFixed(digits));
}

/**
 * BMR engines: Mifflin-St Jeor, Revised Harris-Benedict (1984), Katch-McArdle.
 * All inputs validated with Zod; guarded against NaN / division by zero.
 */
export function calculateMetabolism(raw: Partial<MetabolismInput> = {}): MetabolismResult {
  const parsed = metabolismInputSchema.safeParse(raw);
  const data = parsed.success
    ? parsed.data
    : {
        gender: 'female' as const,
        age: 30,
        weight: 65,
        height: 165,
        activity: 1.375,
        bodyFat: null
      };

  const w = clampNum(data.weight, 25, 350, 65);
  const h = clampNum(data.height, 90, 240, 165);
  const a = clampNum(data.age, 5, 115, 30);
  const act = clampNum(data.activity, 1.1, 2.4, 1.375);
  const bfRaw = data.bodyFat;
  const bf =
    bfRaw !== null && bfRaw !== undefined && bfRaw !== '' && !Number.isNaN(Number(bfRaw))
      ? clampNum(bfRaw, 3, 70, 26)
      : null;

  const mifflinBmr =
    data.gender === 'male' ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;

  const harrisBmr =
    data.gender === 'male'
      ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * a
      : 447.593 + 9.247 * w + 3.098 * h - 4.33 * a;

  const estBf = bf !== null ? bf : data.gender === 'male' ? 18 : 26;
  const lbm = safeFixed(w * (1 - estBf / 100), 1);
  const katchBmr = 370 + 21.6 * lbm;
  const heightM = h / 100;
  const bmi = heightM > 0 ? safeFixed(w / (heightM * heightM), 1) : 0;

  return {
    mifflin: { bmr: safeRound(mifflinBmr), tdee: safeRound(mifflinBmr * act), bmi },
    harris: { bmr: safeRound(harrisBmr), tdee: safeRound(harrisBmr * act), bmi },
    katch: { bmr: safeRound(katchBmr), tdee: safeRound(katchBmr * act), bmi, lbm, bfUsed: estBf }
  };
}

/** % of FDA Daily Value, clamped 0–999, never NaN. */
export function fdaPercent(amount: unknown, dailyValue: number): number {
  const a = Number(amount);
  const dv = Number(dailyValue);
  if (!Number.isFinite(a) || !Number.isFinite(dv) || dv <= 0) return 0;
  return Math.min(999, Math.max(0, Math.round((a / dv) * 100)));
}

/** Validate / sanitize AI or heuristic micro totals against FDA keys. */
export function sanitizeMicroTotals(raw: unknown): Record<FdaMicroKey, number> {
  const empty = Object.fromEntries(FDA_MICROS.map((m) => [m.key, 0])) as Record<FdaMicroKey, number>;
  if (!raw || typeof raw !== 'object') return empty;
  const out = { ...empty };
  const obj = raw as Record<string, unknown>;
  for (const m of FDA_MICROS) {
    const n = Number(obj[m.key]);
    out[m.key] = Number.isFinite(n) && n >= 0 ? n : 0;
  }
  return out;
}

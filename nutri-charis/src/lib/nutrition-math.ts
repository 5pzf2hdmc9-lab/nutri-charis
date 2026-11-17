// @ts-nocheck — Zod 4 typings require TypeScript 5+; CRA pins TS 4.9 via react-scripts.
import { z } from 'zod';

/** FDA Daily Values for 11 tracked micronutrients (adult reference). */
export const FDA_MICROS = [
  { key: 'potassium', label: 'Κάλιο (K)', unit: 'mg', dv: 4700, color: '#34d399' },
  { key: 'iron', label: 'Σίδηρος (Fe)', unit: 'mg', dv: 18, color: '#f87171' },
  { key: 'calcium', label: 'Ασβέστιο (Ca)', unit: 'mg', dv: 1300, color: '#60a5fa' },
  { key: 'fiber', label: 'Φυτικές Ίνες', unit: 'g', dv: 28, color: '#fbbf24' },
  { key: 'magnesium', label: 'Μαγνήσιο (Mg)', unit: 'mg', dv: 420, color: '#a78bfa' },
  { key: 'sodium', label: 'Νάτριο (Na)', unit: 'mg', dv: 2300, color: '#fb923c' },
  { key: 'vitC', label: 'Βιταμίνη C', unit: 'mg', dv: 90, color: '#facc15' },
  { key: 'vitD', label: 'Βιταμίνη D', unit: 'mcg', dv: 20, color: '#38bdf8' },
  { key: 'vitB12', label: 'Βιταμίνη B12', unit: 'mcg', dv: 2.4, color: '#f472b6' },
  { key: 'zinc', label: 'Ψευδάργυρος (Zn)', unit: 'mg', dv: 11, color: '#2dd4bf' },
  { key: 'omega3', label: 'Ωμέγα-3', unit: 'g', dv: 1.6, color: '#818cf8' }
] as const;

export type FdaMicroKey = (typeof FDA_MICROS)[number]['key'];

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

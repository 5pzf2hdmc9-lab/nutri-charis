import { clampNum } from './nutrition-math';

/**
 * Clinical macro targets from TDEE/target kcal + body weight.
 * Protein ~1.6 g/kg (floor 25% kcal), fat ~30% kcal, carbs remainder, fiber FDA 28g.
 */
export function computeMacroTargets({ targetKcal, weightKg, fiberDv = 28 } = {}) {
  const kcal = Math.max(1000, Math.round(Number(targetKcal) || 1800));
  const w = clampNum(weightKg, 25, 350, 65);
  const proteinFromKg = Math.round(w * 1.6);
  const proteinFromKcal = Math.round((kcal * 0.25) / 4);
  const protein = Math.max(proteinFromKg, proteinFromKcal);
  const fat = Math.round((kcal * 0.3) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const fiber = clampNum(fiberDv, 15, 50, 28);
  return { kcal, protein, carbs, fat, fiber, bmrRef: null };
}

/** Delta vs target: positive = over, negative = under. */
export function macroDelta(actual, target) {
  const a = Number(actual) || 0;
  const t = Math.max(1, Number(target) || 1);
  return {
    value: Math.round(a - t),
    pct: Math.round((a / t) * 100)
  };
}

export function statusTone(pct, { low = 85, high = 115 } = {}) {
  if (pct < low) return 'under';
  if (pct > high) return 'over';
  return 'ok';
}

import { clampNum, FDA_MICROS } from './nutrition-math';

const emptyMicros = () => Object.fromEntries(FDA_MICROS.map((m) => [m.key, 0]));

/**
 * Heuristic Greek food → macros + FDA micros (per 100g). Missing micros stay 0 until FDA AI fill.
 * Extra keys: Fb (fiber, zone-1 only), Na (sodium, not in official 27 DV panel).
 */
export function analyzeDayNutrition(dayPlan = {}, drinkingWaterStr = '1.5 - 2 λίτρα') {
  let kcal = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let foodWater = 0;
  let fiber = 0;
  const micros = emptyMicros();

  const rules = [
    { rx: /αυγ|egg/i, k: 145, p: 12.5, c: 1.1, f: 10, w: 75, Fb: 0, Na: 140, vitA: 160, vitC: 0, vitD: 2.0, vitE: 1.1, vitK: 0.3, thiamin: 0.04, riboflavin: 0.45, niacin: 0.1, vitB6: 0.14, folate: 44, vitB12: 1.1, biotin: 10, pantothenic: 1.4, calcium: 50, iron: 1.8, phosphorus: 190, iodine: 25, magnesium: 12, zinc: 1.3, selenium: 30, copper: 0.07, manganese: 0.03, chromium: 0.5, molybdenum: 5, chloride: 180, potassium: 130, choline: 250 },
    { rx: /κοτόπουλ|γαλοπούλ/i, k: 165, p: 31, c: 0, f: 3.6, w: 65, Fb: 0, Na: 74, vitA: 6, vitC: 0, vitD: 0.1, vitE: 0.3, vitK: 1.5, thiamin: 0.07, riboflavin: 0.12, niacin: 9.5, vitB6: 0.6, folate: 4, vitB12: 0.3, biotin: 2, pantothenic: 1.0, calcium: 15, iron: 1.0, phosphorus: 200, iodine: 7, magnesium: 29, zinc: 1.0, selenium: 22, copper: 0.05, manganese: 0.02, chromium: 1, molybdenum: 3, chloride: 90, potassium: 256, choline: 70 },
    { rx: /σολομ|σαρδέλ|σκουμπρ/i, k: 208, p: 20, c: 0, f: 13, w: 64, Fb: 0, Na: 59, vitA: 40, vitC: 0, vitD: 11.0, vitE: 2.5, vitK: 0.5, thiamin: 0.2, riboflavin: 0.35, niacin: 8, vitB6: 0.8, folate: 25, vitB12: 3.2, biotin: 5, pantothenic: 1.2, calcium: 12, iron: 0.8, phosphorus: 250, iodine: 50, magnesium: 29, zinc: 0.6, selenium: 36, copper: 0.05, manganese: 0.02, chromium: 1, molybdenum: 2, chloride: 80, potassium: 363, choline: 90 },
    { rx: /τόν|τσιπούρ|λαβράκ|ψάρι|μπακαλιάρ/i, k: 132, p: 26, c: 0, f: 2.5, w: 72, Fb: 0, Na: 75, vitA: 15, vitC: 0, vitD: 4.5, vitE: 0.8, vitK: 0.2, thiamin: 0.1, riboflavin: 0.15, niacin: 10, vitB6: 0.7, folate: 8, vitB12: 2.1, biotin: 3, pantothenic: 0.8, calcium: 25, iron: 1.1, phosphorus: 220, iodine: 40, magnesium: 32, zinc: 0.7, selenium: 40, copper: 0.04, manganese: 0.02, chromium: 1, molybdenum: 2, chloride: 95, potassium: 310, choline: 65 },
    { rx: /μοσχάρ|μπιφτέκ/i, k: 215, p: 26, c: 0, f: 12, w: 60, Fb: 0, Na: 72, vitA: 3, vitC: 0, vitD: 0.1, vitE: 0.3, vitK: 1.2, thiamin: 0.05, riboflavin: 0.2, niacin: 5.5, vitB6: 0.4, folate: 6, vitB12: 2.5, biotin: 2, pantothenic: 0.5, calcium: 18, iron: 2.6, phosphorus: 180, iodine: 5, magnesium: 21, zinc: 4.8, selenium: 25, copper: 0.08, manganese: 0.01, chromium: 2, molybdenum: 2, chloride: 90, potassium: 318, choline: 80 },
    { rx: /γιαούρτ/i, k: 73, p: 9.5, c: 4.0, f: 2.0, w: 82, Fb: 0, Na: 46, vitA: 25, vitC: 0.5, vitD: 0.1, vitE: 0.05, vitK: 0.2, thiamin: 0.04, riboflavin: 0.2, niacin: 0.2, vitB6: 0.05, folate: 12, vitB12: 0.5, biotin: 2, pantothenic: 0.5, calcium: 120, iron: 0.1, phosphorus: 140, iodine: 35, magnesium: 11, zinc: 0.6, selenium: 4, copper: 0.02, manganese: 0.01, chromium: 0.5, molybdenum: 4, chloride: 70, potassium: 141, choline: 15 },
    { rx: /cottage|ανθότυρ|φέτα|τυρί|κασέρι/i, k: 115, p: 12, c: 3.0, f: 6.0, w: 72, Fb: 0, Na: 320, vitA: 80, vitC: 0, vitD: 0.2, vitE: 0.2, vitK: 1.5, thiamin: 0.03, riboflavin: 0.3, niacin: 0.2, vitB6: 0.06, folate: 15, vitB12: 0.6, biotin: 2, pantothenic: 0.4, calcium: 140, iron: 0.2, phosphorus: 160, iodine: 20, magnesium: 10, zinc: 0.8, selenium: 8, copper: 0.03, manganese: 0.01, chromium: 0.5, molybdenum: 3, chloride: 400, potassium: 105, choline: 18 },
    { rx: /βρώμ/i, k: 375, p: 13, c: 66, f: 6.5, w: 10, Fb: 10.1, Na: 6, vitA: 0, vitC: 0, vitD: 0, vitE: 0.7, vitK: 2, thiamin: 0.5, riboflavin: 0.15, niacin: 1.1, vitB6: 0.12, folate: 32, vitB12: 0, biotin: 15, pantothenic: 1.0, calcium: 52, iron: 4.2, phosphorus: 410, iodine: 2, magnesium: 138, zinc: 3.6, selenium: 28, copper: 0.4, manganese: 3.6, chromium: 4, molybdenum: 40, chloride: 10, potassium: 360, choline: 32 },
    { rx: /ψωμ|φρυγαν|παξιμάδ|τορτίγ/i, k: 255, p: 9.5, c: 46, f: 3.2, w: 34, Fb: 6.5, Na: 420, vitA: 0, vitC: 0, vitD: 0, vitE: 0.4, vitK: 1, thiamin: 0.35, riboflavin: 0.2, niacin: 3.5, vitB6: 0.1, folate: 50, vitB12: 0, biotin: 2, pantothenic: 0.4, calcium: 95, iron: 2.5, phosphorus: 140, iodine: 8, magnesium: 75, zinc: 1.8, selenium: 18, copper: 0.2, manganese: 1.2, chromium: 2, molybdenum: 15, chloride: 500, potassium: 230, choline: 18 },
    { rx: /ρύζ|μακαρόν|ζυμαρ|κινόα|πλιγούρ/i, k: 130, p: 3.2, c: 28, f: 0.5, w: 68, Fb: 1.8, Na: 5, vitA: 0, vitC: 0, vitD: 0, vitE: 0.1, vitK: 0.2, thiamin: 0.08, riboflavin: 0.02, niacin: 1.2, vitB6: 0.08, folate: 10, vitB12: 0, biotin: 1, pantothenic: 0.3, calcium: 12, iron: 0.6, phosphorus: 60, iodine: 1, magnesium: 24, zinc: 0.6, selenium: 8, copper: 0.1, manganese: 0.5, chromium: 1, molybdenum: 10, chloride: 8, potassium: 55, choline: 6 },
    { rx: /πατάτ|γλυκοπατάτ/i, k: 88, p: 2.0, c: 20, f: 0.1, w: 77, Fb: 2.8, Na: 35, vitA: 8, vitC: 12, vitD: 0, vitE: 0.05, vitK: 2, thiamin: 0.08, riboflavin: 0.03, niacin: 1.2, vitB6: 0.3, folate: 16, vitB12: 0, biotin: 0.5, pantothenic: 0.3, calcium: 24, iron: 0.7, phosphorus: 55, iodine: 2, magnesium: 25, zinc: 0.3, selenium: 0.5, copper: 0.1, manganese: 0.15, chromium: 1, molybdenum: 5, chloride: 50, potassium: 390, choline: 13 },
    { rx: /φακ|ρεβίθ|φασόλ|όσπρ/i, k: 125, p: 8.8, c: 21, f: 0.8, w: 68, Fb: 7.6, Na: 12, vitA: 2, vitC: 1.5, vitD: 0, vitE: 0.1, vitK: 5, thiamin: 0.15, riboflavin: 0.07, niacin: 0.8, vitB6: 0.15, folate: 120, vitB12: 0, biotin: 2, pantothenic: 0.4, calcium: 35, iron: 3.1, phosphorus: 140, iodine: 2, magnesium: 42, zinc: 1.3, selenium: 3, copper: 0.3, manganese: 0.5, chromium: 3, molybdenum: 50, chloride: 20, potassium: 340, choline: 30 },
    { rx: /μπανάν/i, k: 89, p: 1.1, c: 23, f: 0.3, w: 75, Fb: 2.6, Na: 1, vitA: 3, vitC: 8.7, vitD: 0, vitE: 0.1, vitK: 0.5, thiamin: 0.03, riboflavin: 0.07, niacin: 0.7, vitB6: 0.4, folate: 20, vitB12: 0, biotin: 1, pantothenic: 0.3, calcium: 5, iron: 0.3, phosphorus: 22, iodine: 1, magnesium: 27, zinc: 0.2, selenium: 1, copper: 0.08, manganese: 0.3, chromium: 1, molybdenum: 2, chloride: 5, potassium: 358, choline: 10 },
    { rx: /μήλ|αχλάδ|πορτοκάλ|μανταρίν|ακτινίδ|μύρτιλ|φράουλ|μούρ/i, k: 54, p: 0.7, c: 13.5, f: 0.2, w: 85, Fb: 2.8, Na: 2, vitA: 15, vitC: 28, vitD: 0, vitE: 0.3, vitK: 4, thiamin: 0.03, riboflavin: 0.03, niacin: 0.3, vitB6: 0.05, folate: 20, vitB12: 0, biotin: 0.5, pantothenic: 0.2, calcium: 18, iron: 0.3, phosphorus: 18, iodine: 1, magnesium: 10, zinc: 0.1, selenium: 0.5, copper: 0.05, manganese: 0.1, chromium: 1, molybdenum: 2, chloride: 5, potassium: 145, choline: 6 },
    { rx: /σαλάτ|αγγούρ|ντομάτ|μπρόκολ|σπανάκ|κολοκυθ|καρότ|λαχαν/i, k: 26, p: 1.6, c: 4.8, f: 0.2, w: 92, Fb: 2.4, Na: 22, vitA: 280, vitC: 24, vitD: 0, vitE: 0.6, vitK: 140, thiamin: 0.05, riboflavin: 0.08, niacin: 0.5, vitB6: 0.12, folate: 55, vitB12: 0, biotin: 1, pantothenic: 0.3, calcium: 42, iron: 1.1, phosphorus: 40, iodine: 2, magnesium: 24, zinc: 0.3, selenium: 1, copper: 0.06, manganese: 0.25, chromium: 2, molybdenum: 5, chloride: 35, potassium: 245, choline: 12 },
    { rx: /αμύγδαλ|καρύδ|chia|λιναρόσπορ|φιστίκ|ταχίν/i, k: 580, p: 20, c: 20, f: 50, w: 5, Fb: 12, Na: 5, vitA: 1, vitC: 0, vitD: 0, vitE: 15, vitK: 5, thiamin: 0.2, riboflavin: 0.5, niacin: 2.5, vitB6: 0.2, folate: 50, vitB12: 0, biotin: 8, pantothenic: 0.5, calcium: 240, iron: 4.2, phosphorus: 450, iodine: 2, magnesium: 260, zinc: 3.2, selenium: 5, copper: 1.0, manganese: 2.2, chromium: 5, molybdenum: 20, chloride: 10, potassium: 680, choline: 40 },
    { rx: /αβοκάντ/i, k: 160, p: 2.0, c: 8.5, f: 14.7, w: 73, Fb: 6.7, Na: 7, vitA: 7, vitC: 10, vitD: 0, vitE: 2.1, vitK: 21, thiamin: 0.07, riboflavin: 0.13, niacin: 1.7, vitB6: 0.26, folate: 81, vitB12: 0, biotin: 2, pantothenic: 1.4, calcium: 12, iron: 0.6, phosphorus: 52, iodine: 1, magnesium: 29, zinc: 0.6, selenium: 0.4, copper: 0.19, manganese: 0.14, chromium: 1, molybdenum: 5, chloride: 12, potassium: 485, choline: 14 },
    { rx: /ελαιόλαδ/i, k: 884, p: 0, c: 0, f: 100, w: 0, Fb: 0, Na: 2, vitA: 0, vitC: 0, vitD: 0, vitE: 14, vitK: 60, thiamin: 0, riboflavin: 0, niacin: 0, vitB6: 0, folate: 0, vitB12: 0, biotin: 0, pantothenic: 0, calcium: 1, iron: 0.5, phosphorus: 0, iodine: 0, magnesium: 0, zinc: 0, selenium: 0, copper: 0, manganese: 0, chromium: 0, molybdenum: 0, chloride: 2, potassium: 1, choline: 0.3 }
  ];

  Object.values(dayPlan || {}).forEach((mealText) => {
    if (!mealText) return;
    mealText.split(/[,•\n+]+/).forEach((seg) => {
      const s = seg.trim();
      if (!s) return;
      const gMatch = s.match(/(\d+(?:[.,]\d+)?)\s*(?:γρ|gr|g|ml)\b/i);
      let grams = gMatch ? parseFloat(gMatch[1].replace(',', '.')) : null;
      if (!grams) {
        if (/αυγ/i.test(s)) {
          const count = parseFloat((s.match(/(\d+)/) || [1, 1])[1]);
          grams = count * 55;
        } else if (/φέτ/i.test(s)) {
          const count = parseFloat((s.match(/(\d+)/) || [1, 1])[1]);
          grams = count * 35;
        } else if (/ελαιόλαδ/i.test(s)) {
          grams = 10;
        } else {
          grams = 90;
        }
      }
      const mult = clampNum(grams, 1, 2000, 90) / 100;
      const matched = rules.find((r) => r.rx.test(s));
      if (matched) {
        kcal += matched.k * mult;
        protein += matched.p * mult;
        carbs += matched.c * mult;
        fat += matched.f * mult;
        foodWater += matched.w * mult;
        fiber += matched.Fb * mult;
        FDA_MICROS.forEach((m) => {
          micros[m.key] += (matched[m.key] || 0) * mult;
        });
      } else {
        kcal += 95 * mult;
        protein += 4 * mult;
        carbs += 11 * mult;
        fat += 3 * mult;
        foodWater += 55 * mult;
      }
    });
  });

  let drinkingMl = 1750;
  if (/Λιγότερο/i.test(drinkingWaterStr)) drinkingMl = 850;
  else if (/1\s*-\s*1\.5/i.test(drinkingWaterStr)) drinkingMl = 1250;
  else if (/Πάνω από/i.test(drinkingWaterStr)) drinkingMl = 2600;

  const roundedMicros = {};
  FDA_MICROS.forEach((m) => {
    const v = micros[m.key];
    roundedMicros[m.key] = m.unit === 'mg' && v >= 10 ? Math.round(v) : +Number(v).toFixed(2);
  });
  roundedMicros.fiber = +fiber.toFixed(1);

  return {
    kcal: Math.round(kcal),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    foodWater: Math.round(foodWater),
    drinkingWater: drinkingMl,
    totalWater: Math.round(foodWater + drinkingMl),
    micros: roundedMicros
  };
}

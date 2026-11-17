import { clampNum } from './nutrition-math';

export function analyzeDayNutrition(dayPlan = {}, drinkingWaterStr = '1.5 - 2 λίτρα') {
  let kcal = 0, protein = 0, carbs = 0, fat = 0, foodWater = 0;
  let potassium = 0, iron = 0, calcium = 0, fiber = 0, magnesium = 0, sodium = 0;
  let vitC = 0, vitD = 0, vitB12 = 0, zinc = 0, omega3 = 0;

  const rules = [
    { rx: /αυγ|egg/i, k: 145, p: 12.5, c: 1.1, f: 10, w: 75, K: 130, Fe: 1.8, Ca: 50, Fb: 0, Mg: 12, Na: 140, C: 0, D: 2.0, B12: 1.1, Zn: 1.3, O3: 0.1 },
    { rx: /κοτόπουλ|γαλοπούλ/i, k: 165, p: 31, c: 0, f: 3.6, w: 65, K: 256, Fe: 1.0, Ca: 15, Fb: 0, Mg: 29, Na: 74, C: 0, D: 0.1, B12: 0.3, Zn: 1.0, O3: 0.05 },
    { rx: /σολομ|σαρδέλ|σκουμπρ/i, k: 208, p: 20, c: 0, f: 13, w: 64, K: 363, Fe: 0.8, Ca: 12, Fb: 0, Mg: 29, Na: 59, C: 0, D: 11.0, B12: 3.2, Zn: 0.6, O3: 1.8 },
    { rx: /τόν|τσιπούρ|λαβράκ|ψάρι|μπακαλιάρ/i, k: 132, p: 26, c: 0, f: 2.5, w: 72, K: 310, Fe: 1.1, Ca: 25, Fb: 0, Mg: 32, Na: 75, C: 0, D: 4.5, B12: 2.1, Zn: 0.7, O3: 0.45 },
    { rx: /μοσχάρ|μπιφτέκ/i, k: 215, p: 26, c: 0, f: 12, w: 60, K: 318, Fe: 2.6, Ca: 18, Fb: 0, Mg: 21, Na: 72, C: 0, D: 0.1, B12: 2.5, Zn: 4.8, O3: 0.05 },
    { rx: /γιαούρτ/i, k: 73, p: 9.5, c: 4.0, f: 2.0, w: 82, K: 141, Fe: 0.1, Ca: 120, Fb: 0, Mg: 11, Na: 46, C: 0.5, D: 0.1, B12: 0.5, Zn: 0.6, O3: 0.02 },
    { rx: /cottage|ανθότυρ|φέτα|τυρί|κασέρι/i, k: 115, p: 12, c: 3.0, f: 6.0, w: 72, K: 105, Fe: 0.2, Ca: 140, Fb: 0, Mg: 10, Na: 320, C: 0, D: 0.2, B12: 0.6, Zn: 0.8, O3: 0.03 },
    { rx: /βρώμ/i, k: 375, p: 13, c: 66, f: 6.5, w: 10, K: 360, Fe: 4.2, Ca: 52, Fb: 10.1, Mg: 138, Na: 6, C: 0, D: 0, B12: 0, Zn: 3.6, O3: 0.1 },
    { rx: /ψωμ|φρυγαν|παξιμάδ|τορτίγ/i, k: 255, p: 9.5, c: 46, f: 3.2, w: 34, K: 230, Fe: 2.5, Ca: 95, Fb: 6.5, Mg: 75, Na: 420, C: 0, D: 0, B12: 0, Zn: 1.8, O3: 0.05 },
    { rx: /ρύζ|μακαρόν|ζυμαρ|κινόα|πλιγούρ/i, k: 130, p: 3.2, c: 28, f: 0.5, w: 68, K: 55, Fe: 0.6, Ca: 12, Fb: 1.8, Mg: 24, Na: 5, C: 0, D: 0, B12: 0, Zn: 0.6, O3: 0.01 },
    { rx: /πατάτ|γλυκοπατάτ/i, k: 88, p: 2.0, c: 20, f: 0.1, w: 77, K: 390, Fe: 0.7, Ca: 24, Fb: 2.8, Mg: 25, Na: 35, C: 12, D: 0, B12: 0, Zn: 0.3, O3: 0.01 },
    { rx: /φακ|ρεβίθ|φασόλ|όσπρ/i, k: 125, p: 8.8, c: 21, f: 0.8, w: 68, K: 340, Fe: 3.1, Ca: 35, Fb: 7.6, Mg: 42, Na: 12, C: 1.5, D: 0, B12: 0, Zn: 1.3, O3: 0.05 },
    { rx: /μπανάν/i, k: 89, p: 1.1, c: 23, f: 0.3, w: 75, K: 358, Fe: 0.3, Ca: 5, Fb: 2.6, Mg: 27, Na: 1, C: 8.7, D: 0, B12: 0, Zn: 0.2, O3: 0.03 },
    { rx: /μήλ|αχλάδ|πορτοκάλ|μανταρίν|ακτινίδ|μύρτιλ|φράουλ|μούρ/i, k: 54, p: 0.7, c: 13.5, f: 0.2, w: 85, K: 145, Fe: 0.3, Ca: 18, Fb: 2.8, Mg: 10, Na: 2, C: 28, D: 0, B12: 0, Zn: 0.1, O3: 0.04 },
    { rx: /σαλάτ|αγγούρ|ντομάτ|μπρόκολ|σπανάκ|κολοκυθ|καρότ|λαχαν/i, k: 26, p: 1.6, c: 4.8, f: 0.2, w: 92, K: 245, Fe: 1.1, Ca: 42, Fb: 2.4, Mg: 24, Na: 22, C: 24, D: 0, B12: 0, Zn: 0.3, O3: 0.03 },
    { rx: /αμύγδαλ|καρύδ|chia|λιναρόσπορ|φιστίκ|ταχίν/i, k: 580, p: 20, c: 20, f: 50, w: 5, K: 680, Fe: 4.2, Ca: 240, Fb: 12, Mg: 260, Na: 5, C: 0, D: 0, B12: 0, Zn: 3.2, O3: 1.4 },
    { rx: /αβοκάντ/i, k: 160, p: 2.0, c: 8.5, f: 14.7, w: 73, K: 485, Fe: 0.6, Ca: 12, Fb: 6.7, Mg: 29, Na: 7, C: 10, D: 0, B12: 0, Zn: 0.6, O3: 0.11 },
    { rx: /ελαιόλαδ/i, k: 884, p: 0, c: 0, f: 100, w: 0, K: 1, Fe: 0.5, Ca: 1, Fb: 0, Mg: 0, Na: 2, C: 0, D: 0, B12: 0, Zn: 0, O3: 0.7 }
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
        potassium += matched.K * mult;
        iron += matched.Fe * mult;
        calcium += matched.Ca * mult;
        fiber += matched.Fb * mult;
        magnesium += matched.Mg * mult;
        sodium += matched.Na * mult;
        vitC += matched.C * mult;
        vitD += matched.D * mult;
        vitB12 += matched.B12 * mult;
        zinc += matched.Zn * mult;
        omega3 += matched.O3 * mult;
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

  return {
    kcal: Math.round(kcal),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    foodWater: Math.round(foodWater),
    drinkingWater: drinkingMl,
    totalWater: Math.round(foodWater + drinkingMl),
    micros: {
      potassium: Math.round(potassium),
      iron: +iron.toFixed(1),
      calcium: Math.round(calcium),
      fiber: +fiber.toFixed(1),
      magnesium: Math.round(magnesium),
      sodium: Math.round(sodium),
      vitC: Math.round(vitC),
      vitD: +vitD.toFixed(1),
      vitB12: +vitB12.toFixed(1),
      zinc: +zinc.toFixed(1),
      omega3: +omega3.toFixed(2)
    }
  };
}

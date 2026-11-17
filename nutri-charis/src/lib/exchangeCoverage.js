import { GREEK_FOOD_EXCHANGES } from '../constants/dietPlan';

/** Distinctive stems, longest first so γλυκοπατάτα does not also count as πατάτα. */
const STEMS = {
  protein: ['κοτόπουλ', 'γαλοπούλ', 'σολομ', 'τόνο', 'αυγ', 'γιαούρτ', 'cottage', 'φακ'],
  carb: ['γλυκοπατάτ', 'ρύζι', 'κινόα', 'πατάτα', 'ψωμ', 'βρώμ', 'φρυγαν'],
  fat: ['ελαιόλαδ', 'αμύγδαλ', 'καρύδ', 'ταχίν', 'αβοκάντ'],
  veg: ['σαλάτ', 'μπρόκολ', 'αγγούρ', 'ντομάτ', 'ντοματ', 'σπανάκ', 'κολοκυθ']
};

export const EXCHANGE_TARGETS = { protein: 4, carb: 4, fat: 3, veg: 4 };

export const EXCHANGE_LABELS = {
  protein: 'Πρωτεΐνη',
  carb: 'Υδατάνθρακας',
  fat: 'Λιπαρά',
  veg: 'Λαχανικά'
};

function consume(blob, stem) {
  const i = blob.indexOf(stem);
  if (i < 0) return { hit: false, blob };
  return { hit: true, blob: `${blob.slice(0, i)} ${blob.slice(i + stem.length)}` };
}

/** Count Greek exchange foods present in one day's meal text. */
export function countDayExchanges(dayMeals = {}) {
  let blob = Object.values(dayMeals)
    .join(' ')
    .toLowerCase();
  const counts = { protein: 0, carb: 0, fat: 0, veg: 0 };
  Object.entries(STEMS).forEach(([group, stems]) => {
    stems.forEach((stem) => {
      const next = consume(blob, stem);
      blob = next.blob;
      if (next.hit) counts[group] += 1;
    });
  });
  return { counts, targets: EXCHANGE_TARGETS };
}

export function exchangeTone(count, target) {
  if (!target) return 'ok';
  if (count < target) return 'under';
  if (count > target + 1) return 'over';
  return 'ok';
}

export function exchangeCatalog() {
  return GREEK_FOOD_EXCHANGES;
}

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { FDA_MICROS, clampNum, parseStrictNum, calculateMetabolism, fdaPercent } from './lib/nutrition-math';
import { checkRateLimit, authRateKey, resetRateLimit } from './lib/rateLimit';
import { requireSessionUser, assertClientAccess, sanitizeText } from './lib/authAccess';
import LegalModal from './components/LegalModal';
import MedicalFooter from './components/MedicalFooter';
import GdprConsentFields from './components/GdprConsentFields';
import GdprDataActions from './components/GdprDataActions';
import SoapNotesPanel from './components/practice/SoapNotesPanel';
import BillingPackagesPanel from './components/practice/BillingPackagesPanel';
import ReminderCopyButton from './components/practice/ReminderCopyButton';

// ============================================================================
// ΑΥΣΤΗΡΗ ΛΙΣΤΑ ADMIN
// ============================================================================
const STRICT_ADMIN_EMAILS = [
  'chadisfotoudi@gmail.com'
];

const ADMIN_EMAIL_ENV =
  typeof process !== 'undefined' && process.env && process.env.REACT_APP_ADMIN_EMAIL
    ? process.env.REACT_APP_ADMIN_EMAIL.trim().toLowerCase()
    : '';

const DAYS = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή'];

const MEAL_TYPES = [
  { key: 'Πρωινό', label: '1. Πρωινό', badge: 'ΠΡΩΙ', accent: '#f59e0b' },
  { key: 'Σνακ 1', label: '2. Σνακ 1', badge: 'ΔΕΚΑΤΙΑΝΟ', accent: '#10b981' },
  { key: 'Μεσημεριανό', label: '3. Μεσημεριανό', badge: 'ΚΥΡΙΩΣ', accent: '#38bdf8' },
  { key: 'Σνακ 2', label: '4. Σνακ 2', badge: 'ΑΠΟΓΕΥΜΑ', accent: '#a78bfa' },
  { key: 'Βραδινό', label: '5. Βραδινό', badge: 'ΒΡΑΔΥ', accent: '#fb7185' }
];

const ACTIVITY_FACTORS = [
  { value: 1.2, label: 'Καθιστική ζωή (1.2)' },
  { value: 1.375, label: 'Ελαφριά άσκηση 1-3x/εβδ (1.375)' },
  { value: 1.55, label: 'Μέτρια άσκηση 3-5x/εβδ (1.55)' },
  { value: 1.725, label: 'Έντονη άσκηση 6-7x/εβδ (1.725)' },
  { value: 1.9, label: 'Πολύ έντονη / Αθλητής (1.9)' }
];

const CALORIE_DELTAS = [
  { value: -500, label: '-500 kcal (Έλλειμμα)' },
  { value: -350, label: '-350 kcal (Ήπιο έλλειμμα)' },
  { value: 0, label: 'Συντήρηση (TDEE)' },
  { value: 300, label: '+300 kcal (Όγκος)' },
  { value: 500, label: '+500 kcal (Υπερτροφία)' }
];

const APPOINTMENT_TYPES = [
  '1η Συνεδρία & Λιπομέτρηση',
  'Επανελέγχου & Παρακολούθηση',
  'Online Coaching Check-in',
  'Τακτική συνεδρία'
];

/** Remaining practice tools not yet wired — honest stubs only (billing/SOAP/1-click reminders are live). */
const PRACTICE_STUBS = [
  { id: 'telehealth', title: 'Τηλεσυνεδρία', body: 'Ενσωματωμένο video · προς το παρόν χρησιμοποιήστε Zoom/Meet + υπενθύμιση από τη λίστα ραντεβού.' },
  { id: 'calendar', title: 'Google / Apple Calendar', body: 'Συγχρονισμός διαθεσιμότητας — stub, χωρίς σύνδεση ακόμα.' },
  { id: 'auto-sms', title: 'Αυτόματο SMS 24ω', body: 'Προγραμματισμένο SMS/email — προς το παρόν 1-click αντιγραφή υπενθύμισης στα ραντεβού.' }
];

const DEFAULT_MEAL_IDEAS = [
  { id: 'i1', category: 'Πρωινό', text: '150γρ γιαούρτι στραγγιστό 2%, 35γρ νιφάδες βρώμης, 60γρ μύρτιλα, 10γρ σπόροι chia' },
  { id: 'i2', category: 'Πρωινό', text: '2 αυγά βραστά, 1 φέτα ψωμί ολικής άλεσης (35γρ), 40γρ τυρί cottage, 80γρ αγγούρι' },
  { id: 'i3', category: 'Σνακ', text: '1 μέτριο μήλο (150γρ) & 12 ωμά ανάλατα αμύγδαλα (15γρ)' },
  { id: 'i4', category: 'Μεσημεριανό', text: '140γρ φιλέτο στήθος κοτόπουλο ψητό, 150γρ ρύζι μπασμάτι βρασμένο, 150γρ πράσινη σαλάτα & 10ml ελαιόλαδο' },
  { id: 'i5', category: 'Μεσημεριανό', text: '150γρ φιλέτο σολομού ψητό, 180γρ γλυκοπατάτα ψητή & 150γρ μπρόκολο στον ατμό' },
  { id: 'i6', category: 'Βραδινό', text: 'Τονοσαλάτα με 120γρ τόνο σε νερό, ανάμεικτα λαχανικά, 1 φρυγανιά ολικής & 10ml ελαιόλαδο' }
];

const DEFAULT_WEEK_TEMPLATES = [
  {
    id: 'tpl-med-1550',
    name: 'Μεσογειακό Πρωτόκολλο 1550 kcal',
    plan: {
      'Δευτέρα': {
        'Πρωινό': '150γρ γιαούρτι στραγγιστό 2%, 35γρ βρώμη, 60γρ μύρτιλα & 10γρ σπόροι chia',
        'Σνακ 1': '1 μέτριο μήλο (150γρ) & 10 ωμά αμύγδαλα (12γρ)',
        'Μεσημεριανό': '140γρ φιλέτο κοτόπουλο ψητό, 150γρ ρύζι μπασμάτι, 150γρ πράσινη σαλάτα & 10ml ελαιόλαδο',
        'Σνακ 2': '1 μπανάνα (110γρ) & 15γρ καρύδια',
        'Βραδινό': '2 αυγά βραστά, 1 φέτα ψωμί ολικής (35γρ), 50γρ τυρί cottage & αγγουροντομάτα'
      },
      'Τρίτη': {
        'Πρωινό': '2 αυγά ομελέτα σε αντικολλητικό, 1 φέτα ψωμί ολικής (35γρ) & 80γρ ντοματίνια',
        'Σνακ 1': '1 αχλάδι (150γρ) & 12γρ αμύγδαλα',
        'Μεσημεριανό': '220γρ φακές σούπα, 40γρ τυρί φέτα χαμηλών λιπαρών & 1 φρυγανιά ολικής',
        'Σνακ 2': '150γρ γιαούρτι 2% & 1 κ.γ. μέλι',
        'Βραδινό': 'Τονοσαλάτα με 120γρ τόνο σε νερό, μαρούλι, 1 παξιμάδι κρίθινο & 10ml ελαιόλαδο'
      }
    }
  }
];

function cleanMealText(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/\((?![^)]*\b\d+\s*(?:γρ|gr|g|ml|τεμ|φέτ|κ\.σ|κ\.γ)\b)[^)]{12,}\)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/^[•\-–]\s*/gm, '')
    .trim();
}

/** Detect Supabase password-recovery redirect via hash or query (`type=recovery`). */
function isPasswordRecoveryFromUrl() {
  if (typeof window === 'undefined') return false;
  const hash = String(window.location.hash || '');
  const search = String(window.location.search || '');
  try {
    const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
    const queryParams = new URLSearchParams(search);
    if (hashParams.get('type') === 'recovery' || queryParams.get('type') === 'recovery') return true;
  } catch {
    /* ignore malformed URL params */
  }
  return /(?:[?&#]|^)type=recovery(?:&|$)/i.test(`${search}${hash}`);
}

function clearAuthRedirectParamsFromUrl() {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;
  try {
    window.history.replaceState(null, '', window.location.pathname);
  } catch {
    /* ignore */
  }
}

/** Simple password strength meter for recovery / register UX. */
function getPasswordStrength(pw) {
  const p = String(pw || '');
  if (!p) return { score: 0, label: '', color: '#64748b', pct: 0 };
  let score = 0;
  if (p.length >= 6) score += 1;
  if (p.length >= 10) score += 1;
  if (/[A-ZΑ-Ω]/.test(p) && /[a-zα-ω]/.test(p)) score += 1;
  if (/\d/.test(p)) score += 1;
  if (/[^A-Za-zΑ-Ωα-ω0-9]/.test(p)) score += 1;
  const labels = ['Πολύ αδύναμος', 'Αδύναμος', 'Μέτριος', 'Καλός', 'Ισχυρός'];
  const colors = ['#f87171', '#fb923c', '#fbbf24', '#34d399', '#10b981'];
  const idx = Math.min(4, Math.max(0, score - 1));
  return { score, label: labels[idx], color: colors[idx], pct: Math.min(100, score * 20) };
}

/**
 * Prefer server `/api/generate-meals` (GEMINI_API_KEY). Fall back to local admin key.
 * Always returns raw model text; throws with Greek user-facing message on failure.
 */
async function callMealAi(promptText, clientApiKey = '') {
  const prompt = String(promptText || '').slice(0, 12000);
  try {
    const res = await fetch('/api/generate-meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptText: prompt })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && typeof data?.text === 'string' && data.text.trim()) {
      return data.text;
    }
    if (res.status !== 503 && res.status !== 404) {
      throw new Error(data?.error || 'Αποτυχία AI υπηρεσίας.');
    }
  } catch (err) {
    if (!clientApiKey) throw err;
  }

  if (!clientApiKey) {
    throw new Error('AI μη διαθέσιμο. Ρυθμίστε το Gemini API Key.');
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${clientApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Gemini API Error');
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function parseAiJson(rawText, fallback) {
  const text = String(rawText || '').trim();
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

function analyzeDayNutrition(dayPlan = {}, drinkingWaterStr = '1.5 - 2 λίτρα') {
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

function buildWeeklyShoppingList(mealPlan = {}) {
  const categories = {
    '🥩 Πρωτεΐνες (Κρέας, Ψάρι, Αυγά)': new Set(),
    '🥛 Γαλακτοκομικά': new Set(),
    '🌾 Δημητριακά & Όσπρια': new Set(),
    '🥦 Φρούτα & Λαχανικά': new Set(),
    '🥑 Υγιεινά Λιπαρά & Ξηροί Καρποί': new Set()
  };

  DAYS.forEach((day) => {
    MEAL_TYPES.forEach((m) => {
      const txt = cleanMealText(mealPlan?.[day]?.[m.key] || '');
      if (!txt) return;
      txt.split(/[,&+\n]+/).forEach((part) => {
        const cleanItem = part
          .replace(/^\d+(?:[.,]\d+)?\s*(?:γρ|gr|g|ml|τεμ|φέτ\w*|μέτρι\w*|μεγάλ\w*)\s*/i, '')
          .trim();
        if (!cleanItem || cleanItem.length < 3) return;
        const cap = cleanItem.charAt(0).toUpperCase() + cleanItem.slice(1);
        if (/κοτόπουλ|γαλοπούλ|μοσχάρ|σολομ|τόν|τσιπούρ|λαβράκ|ψάρι|αυγ|σαρδέλ/i.test(cap)) {
          categories['🥩 Πρωτεΐνες (Κρέας, Ψάρι, Αυγά)'].add(cap);
        } else if (/γιαούρτ|cottage|τυρί|φέτα|γάλα|ανθότυρ|κεφίρ/i.test(cap)) {
          categories['🥛 Γαλακτοκομικά'].add(cap);
        } else if (/βρώμ|ψωμ|φρυγαν|ρύζ|μακαρόν|κινόα|φακ|ρεβίθ|φασόλ|πατάτ|γλυκοπατάτ/i.test(cap)) {
          categories['🌾 Δημητριακά & Όσπρια'].add(cap);
        } else if (/αμύγδαλ|καρύδ|chia|λιναρόσπορ|αβοκάντ|ελαιόλαδ|ταχίν|φιστίκ/i.test(cap)) {
          categories['🥑 Υγιεινά Λιπαρά & Ξηροί Καρποί'].add(cap);
        } else {
          categories['🥦 Φρούτα & Λαχανικά'].add(cap);
        }
      });
    });
  });

  return Object.entries(categories)
    .map(([cat, set]) => ({ category: cat, items: Array.from(set) }))
    .filter((g) => g.items.length > 0);
}

function formatWeeklyPlanForWhatsApp(clientObj, targetKcal) {
  const plan = clientObj?.meal_plan || {};
  let text = `🌿 *Εβδομαδιαίο Πρόγραμμα Διατροφής — Χάρις Φωτούδη*\n`;
  text += `👤 *Πελάτης:* ${clientObj?.name || ''}\n`;
  text += `🎯 *Ημερήσιος Στόχος:* ${targetKcal} kcal\n\n`;

  DAYS.forEach((day) => {
    const dayMeals = plan[day] || {};
    const hasAny = MEAL_TYPES.some((m) => cleanMealText(dayMeals[m.key] || ''));
    if (!hasAny) return;
    text += `📅 *${day.toUpperCase()}*\n`;
    MEAL_TYPES.forEach((m) => {
      const val = cleanMealText(dayMeals[m.key] || '');
      if (val) {
        text += `• _${m.key}:_ ${val}\n`;
      }
    });
    text += `\n`;
  });
  return text.trim();
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(err) {
    return { hasError: true, errorMsg: err?.message || 'Απρόσμενο σφάλμα' };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="luxury-card" style={{ maxWidth: '460px', padding: '32px', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 10px 0', color: '#34d399' }}>Ασφαλής Επαναφορά</h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>{this.state.errorMsg}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{ padding: '12px 22px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
            >
              Ανανέωση Εφαρμογής
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function BrandLogo({ size = 38, className = '' }) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        background: 'linear-gradient(135deg, #10b981 0%, #059669 55%, #064e3b 100%)',
        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.38), inset 0 1px 0 rgba(255,255,255,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M19.5 4.5C13 4.5 7.5 8 5.5 14.5C4.8 16.8 5 19.5 5 19.5C5 19.5 7.7 19.7 10 19C16.5 17 20 11.5 19.5 4.5Z"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M5 19.5L14.5 10" stroke="#fde68a" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function WeeklyEnergySvgChart({ weeklyStats, targetKcal, selectedDay, onSelectDay }) {
  const maxVal = Math.max(targetKcal * 1.2, ...weeklyStats.map((d) => d.kcal), 1800);
  const targetY = 120 - Math.round((targetKcal / maxVal) * 100);

  return (
    <div style={{ background: 'rgba(5, 9, 8, 0.78)', padding: '13px 14px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
        <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#e2e8f0' }}>
          📊 Εβδομαδιαία Ενεργειακή Καμπύλη
        </span>
        <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: '700' }}>--- Στόχος {targetKcal} kcal</span>
      </div>

      <svg viewBox="0 0 700 146" style={{ width: '100%', height: '118px', overflow: 'visible' }}>
        <line x1="20" y1={targetY} x2="680" y2={targetY} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.85" />
        <text x="680" y={targetY - 5} fill="#fbbf24" fontSize="10.5" fontWeight="700" textAnchor="end">
          {targetKcal} kcal
        </text>

        {weeklyStats.map((d, idx) => {
          const x = 42 + idx * 92;
          const barH = Math.max(4, Math.round((d.kcal / maxVal) * 100));
          const y = 120 - barH;
          const active = d.day === selectedDay;
          return (
            <g key={d.day} onClick={() => onSelectDay(d.day)} style={{ cursor: 'pointer' }}>
              <rect
                x={x}
                y={y}
                width="44"
                height={barH}
                rx="8"
                fill={active ? '#10b981' : 'rgba(52, 211, 153, 0.28)'}
                stroke={active ? '#6ee7b7' : 'rgba(52, 211, 153, 0.4)'}
                strokeWidth="1.2"
              />
              <text x={x + 22} y={y - 5} fill={active ? '#fff' : '#94a3b8'} fontSize="11" fontWeight="800" textAnchor="middle">
                {d.kcal > 0 ? d.kcal : '—'}
              </text>
              <text x={x + 22} y="138" fill={active ? '#34d399' : '#94a3b8'} fontSize="11.5" fontWeight={active ? '800' : '600'} textAnchor="middle">
                {d.day.slice(0, 3)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function BodyProgressSvgChart({ data = [] }) {
  if (data.length < 2) return null;
  const weights = data.map((d) => Number(d.weight));
  const minW = Math.min(...weights) - 2;
  const maxW = Math.max(...weights) + 2;
  const spanW = Math.max(1, maxW - minW);

  const points = data.map((d, idx) => {
    const x = 45 + (idx / (data.length - 1)) * 610;
    const y = 115 - ((Number(d.weight) - minW) / spanW) * 85;
    return { x, y, weight: d.weight, date: d.date };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div style={{ background: 'rgba(5, 9, 8, 0.82)', padding: '16px', borderRadius: '15px', border: '1px solid rgba(16, 185, 129, 0.28)', marginBottom: '16px' }}>
      <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#34d399', marginBottom: '8px' }}>
        📈 Καμπύλη Εξέλιξης Σωματικού Βάρους (kg)
      </div>
      <svg viewBox="0 0 700 145" style={{ width: '100%', height: '130px' }}>
        <polyline fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={polyline} />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5.5" fill="#050807" stroke="#34d399" strokeWidth="2.5" />
            <text x={p.x} y={p.y - 10} fill="#fff" fontSize="11" fontWeight="800" textAnchor="middle">
              {p.weight}kg
            </text>
            <text x={p.x} y="136" fill="#94a3b8" fontSize="10" textAnchor="middle">
              {String(p.date || '').slice(5)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function MultiChipGroup({ options, values = [], onToggle }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {options.map((opt) => {
        const active = (values || []).includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            style={{
              padding: '6px 11px',
              borderRadius: '99px',
              fontSize: '11.5px',
              fontWeight: active ? '700' : '500',
              background: active ? 'rgba(16, 185, 129, 0.22)' : 'rgba(255, 255, 255, 0.04)',
              color: active ? '#6ee7b7' : '#cbd5e1',
              border: active ? '1px solid rgba(16, 185, 129, 0.55)' : '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer'
            }}
          >
            {active ? `✓ ${opt}` : opt}
          </button>
        );
      })}
    </div>
  );
}

/** Linear/Stripe-grade empty state — one job, clear CTA, no misleading chrome. */
function EmptyState({ icon = '◇', glyph, title, body, hint, actionLabel, onAction }) {
  const detail = body || hint;
  const mark = glyph || icon;
  return (
    <div className="empty-state" role="status">
      <div className="empty-state__glyph" aria-hidden="true">
        {mark}
      </div>
      <p className="empty-state__title font-display">{title}</p>
      {detail ? <p className="empty-state__hint">{detail}</p> : null}
      {actionLabel && typeof onAction === 'function' ? (
        <button type="button" className="btn-emerald" onClick={onAction} style={{ padding: '10px 16px', marginTop: '10px' }}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function DataSkeleton() {
  return (
    <div className="luxury-card" style={{ padding: '16px', display: 'grid', gap: '12px' }} aria-busy="true" aria-label="Φόρτωση δεδομένων">
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div className="skeleton-block" style={{ width: 42, height: 42, borderRadius: 13 }} />
        <div style={{ flex: 1, display: 'grid', gap: 8 }}>
          <div className="skeleton-block" style={{ height: 14, width: '42%' }} />
          <div className="skeleton-block" style={{ height: 10, width: '28%' }} />
        </div>
      </div>
      <div className="telemetry-core-grid">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-block" style={{ height: 64 }} />
        ))}
      </div>
      <div className="skeleton-block" style={{ height: 120 }} />
    </div>
  );
}

function PrintableExcelSheet({ id, theme = 'green', clientObj, mealPlan }) {
  const palette =
    theme === 'blue'
      ? {
          sheetBg: '#e4eff8',
          bannerBg: '#184e77',
          bannerAccent: '#bae6fd',
          thBg: '#276694',
          thText: '#f0f9ff',
          mealColBg: '#cde2f2',
          mealColText: '#103754',
          rowEven: '#dfeef9',
          rowOdd: '#d4e7f6',
          border: '#99c1de',
          cellText: '#102a43'
        }
      : {
          sheetBg: '#e4f3ec',
          bannerBg: '#165b44',
          bannerAccent: '#a7f3d0',
          thBg: '#217558',
          thText: '#ecfdf5',
          mealColBg: '#cbe7da',
          mealColText: '#0f3d2e',
          rowEven: '#dff1e8',
          rowOdd: '#d3eadf',
          border: '#93cbb3',
          cellText: '#0f2e24'
        };

  return (
    <div
      id={id}
      style={{
        background: palette.sheetBg,
        borderRadius: '14px',
        overflow: 'hidden',
        border: `2px solid ${palette.bannerBg}`,
        color: palette.cellText,
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <div
        style={{
          background: palette.bannerBg,
          padding: '15px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.01em' }}>
            Χάρις Φωτούδη
          </div>
          <div style={{ fontSize: '11.5px', color: palette.bannerAccent, fontWeight: '600', marginTop: '2px' }}>
            Κλινική Διαιτολόγος – Διατροφολόγος • Εξατομικευμένο Εβδομαδιαίο Διαιτολόγιο
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc' }}>
            Πελάτης: {clientObj?.name || '—'}
          </div>
          <div style={{ fontSize: '11px', color: palette.bannerAccent, marginTop: '2px' }}>
            {clientObj?.goal ? `Στόχος: ${clientObj.goal}` : 'Εβδομαδιαίο Πρόγραμμα Διατροφής'}
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '11px' }}>
          <thead>
            <tr>
              <th
                style={{
                  width: '10.5%',
                  background: palette.thBg,
                  color: palette.thText,
                  padding: '8px 8px',
                  textAlign: 'left',
                  fontWeight: '800',
                  border: `1px solid ${palette.border}`,
                  textTransform: 'uppercase'
                }}
              >
                Γεύμα
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  style={{
                    width: '12.78%',
                    background: palette.thBg,
                    color: palette.thText,
                    padding: '8px 8px',
                    textAlign: 'center',
                    fontWeight: '800',
                    border: `1px solid ${palette.border}`,
                    textTransform: 'uppercase'
                  }}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEAL_TYPES.map((m, idx) => (
              <tr key={m.key}>
                <td
                  style={{
                    background: palette.mealColBg,
                    color: palette.mealColText,
                    fontWeight: '800',
                    padding: '8px 8px',
                    border: `1px solid ${palette.border}`,
                    verticalAlign: 'top'
                  }}
                >
                  {m.label}
                </td>
                {DAYS.map((day) => {
                  const cleanText = cleanMealText(mealPlan?.[day]?.[m.key] || '');
                  return (
                    <td
                      key={day}
                      style={{
                        background: idx % 2 === 0 ? palette.rowEven : palette.rowOdd,
                        color: palette.cellText,
                        padding: '8px 9px',
                        border: `1px solid ${palette.border}`,
                        verticalAlign: 'top',
                        lineHeight: '1.4',
                        fontWeight: '500',
                        wordBreak: 'break-word'
                      }}
                    >
                      {cleanText || '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          background: palette.mealColBg,
          padding: '7px 16px',
          fontSize: '9.5px',
          color: palette.mealColText,
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: `1px solid ${palette.border}`,
          fontWeight: '600'
        }}
      >
        <span>Εξατομικευμένο διαιτολογικό πρόγραμμα • Δεν υποκαθιστά ιατρική γνωμάτευση.</span>
        <span>Προστασία Προσωπικών Δεδομένων (GDPR) • Χάρις Φωτούδη</span>
      </div>
    </div>
  );
}

function NutriCharisPlatform() {
  // Auth & Guided Client Onboarding State
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState(() =>
    isPasswordRecoveryFromUrl() ? 'recovery' : 'login'
  ); // 'login' | 'register' | 'forgot' | 'recovery'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [art9Accepted, setArt9Accepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [legalDoc, setLegalDoc] = useState(null);
  const [newClientGdpr, setNewClientGdpr] = useState(false);
  const [newClientArt9, setNewClientArt9] = useState(false);
  const [newClientTerms, setNewClientTerms] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authGender, setAuthGender] = useState('female');
  const [authAge, setAuthAge] = useState('30');
  const [authWeight, setAuthWeight] = useState('65');
  const [authHeight, setAuthHeight] = useState('165');
  const [authActivity, setAuthActivity] = useState(1.375);
  const [authGoal, setAuthGoal] = useState('Απώλεια λίπους & ρύθμιση μεταβολισμού');
  const [authAllergies, setAuthAllergies] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Core Data
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [activeClientId, setActiveClientId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [measurements, setMeasurements] = useState([]);

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState('plan');
  const [profileSubTab, setProfileSubTab] = useState('overview');
  const [selectedDay, setSelectedDay] = useState('Δευτέρα');
  const [cloneTargetDay, setCloneTargetDay] = useState('Πέμπτη');
  const [pdfTheme, setPdfTheme] = useState('green');
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showShoppingModal, setShowShoppingModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Client Interactive Adherence & Water Log
  const [completedMeals, setCompletedMeals] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nutricharis_adherence') || '{}');
    } catch {
      return {};
    }
  });
  const [waterGlasses, setWaterGlasses] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nutricharis_water_glasses') || '{}');
    } catch {
      return {};
    }
  });

  // Week Templates Vault
  const [newTemplateName, setNewTemplateName] = useState('');
  const [weekTemplates, setWeekTemplates] = useState(() => {
    try {
      const stored = localStorage.getItem('nutricharis_week_templates');
      return stored ? JSON.parse(stored) : DEFAULT_WEEK_TEMPLATES;
    } catch {
      return DEFAULT_WEEK_TEMPLATES;
    }
  });

  // Gemini AI & Custom Ideas State
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('nutricharis_gemini_key') || '');
  const [tempApiKey, setTempApiKey] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [aiDay, setAiDay] = useState('Δευτέρα');
  const [aiMealType, setAiMealType] = useState('Πρωινό');
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFullWeekLoading, setAiFullWeekLoading] = useState(false);
  const [aiOptions, setAiOptions] = useState([]);
  const [fdaLoading, setFdaLoading] = useState(false);
  const [fdaAiOverride, setFdaAiOverride] = useState(null);

  const [customIdeaText, setCustomIdeaText] = useState('');
  const [customIdeaCategory, setCustomIdeaCategory] = useState('Πρωινό');
  const [ideaFilter, setIdeaFilter] = useState('Όλα');
  const [savedIdeas, setSavedIdeas] = useState(() => {
    try {
      const stored = localStorage.getItem('nutricharis_custom_ideas');
      return stored ? JSON.parse(stored) : DEFAULT_MEAL_IDEAS;
    } catch {
      return DEFAULT_MEAL_IDEAS;
    }
  });

  // Cell & Client Edit Modals
  const [editingCell, setEditingCell] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGender, setEditGender] = useState('female');
  const [editAge, setEditAge] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [editQ, setEditQ] = useState({});

  // New Client Form
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientGender, setNewClientGender] = useState('female');
  const [newClientAge, setNewClientAge] = useState('32');
  const [newClientWeight, setNewClientWeight] = useState('68');
  const [newClientHeight, setNewClientHeight] = useState('166');
  const [newClientGoal, setNewClientGoal] = useState('Απώλεια λίπους & ρύθμιση μεταβολισμού');

  // Appointments & Measurements
  const [apptDate, setApptDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [apptTime, setApptTime] = useState('10:30');
  const [apptType, setApptType] = useState(APPOINTMENT_TYPES[0]);
  const [apptNotes, setApptNotes] = useState('');
  const [apptFilter, setApptFilter] = useState('upcoming');
  const [measWeight, setMeasWeight] = useState('');
  const [measFat, setMeasFat] = useState('');
  const [measMuscle, setMeasMuscle] = useState('');
  const [measWaist, setMeasWaist] = useState('');

  // Calculator
  const [calcGender, setCalcGender] = useState('female');
  const [calcAge, setCalcAge] = useState('30');
  const [calcWeight, setCalcWeight] = useState('65');
  const [calcHeight, setCalcHeight] = useState('165');
  const [calcBodyFat, setCalcBodyFat] = useState('');
  const [calcActivity, setCalcActivity] = useState(1.375);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3400);
  };

  useEffect(() => {
    const syncRecoveryFromUrl = () => {
      if (isPasswordRecoveryFromUrl()) setAuthMode('recovery');
    };
    // URL hash/query backup: some clients emit SIGNED_IN instead of PASSWORD_RECOVERY.
    syncRecoveryFromUrl();
    window.addEventListener('hashchange', syncRecoveryFromUrl);
    window.addEventListener('popstate', syncRecoveryFromUrl);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data?.session || null);
        syncRecoveryFromUrl();
        setAuthLoading(false);
      })
      .catch(() => {
        setSession(null);
        setAuthLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && isPasswordRecoveryFromUrl())) {
        setAuthMode('recovery');
      }
      if (event === 'SIGNED_OUT') {
        setAuthMode('login');
        setClients([]);
        setAppointments([]);
        setMeasurements([]);
        setActiveClientId(null);
        setDataError('');
      }
    });
    return () => {
      window.removeEventListener('hashchange', syncRecoveryFromUrl);
      window.removeEventListener('popstate', syncRecoveryFromUrl);
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const isAdmin = useMemo(() => {
    const email = (session?.user?.email || '').trim().toLowerCase();
    if (!email) return false;
    const normalizedWhitelist = STRICT_ADMIN_EMAILS.map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (ADMIN_EMAIL_ENV) normalizedWhitelist.push(ADMIN_EMAIL_ENV);
    return normalizedWhitelist.includes(email);
  }, [session]);

  useEffect(() => {
    if (!session?.user) return;
    loadAllData();
  }, [session, isAdmin]);

  // Non-admin shells hide the clients tab — never leave them on a blank tab.
  useEffect(() => {
    if (!isAdmin && activeTab === 'clients') setActiveTab('plan');
  }, [isAdmin, activeTab]);

  const loadAllData = async () => {
    setDataLoading(true);
    setDataError('');
    try {
      // Identity from Auth session only — never trust body/URL userId.
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData?.user?.id) {
        setDataError('Η συνεδρία έληξε. Παρακαλώ συνδεθείτε ξανά.');
        setClients([]);
        return;
      }
      const uid = userData.user.id;
      const userEmail = String(userData.user.email || '')
        .trim()
        .toLowerCase();

      // RLS enforces row ownership; client filter is defense-in-depth (IDOR).
      let query = supabase.from('clients').select('*').order('created_at', { ascending: false });
      if (!isAdmin) {
        query = query.or(`user_id.eq.${uid},email.eq.${userEmail}`);
      } else {
        query = query.or(`dietitian_id.eq.${uid},dietitian_id.is.null`);
      }

      const { data: clientRows, error: clientsErr } = await query;
      if (clientsErr) {
        setDataError(clientsErr.message || 'Αποτυχία φόρτωσης φακέλων.');
      } else if (clientRows) {
        const visible = isAdmin
          ? clientRows.filter((c) => !c.dietitian_id || c.dietitian_id === uid)
          : clientRows.filter(
              (c) =>
                c.user_id === uid ||
                String(c.email || '')
                  .trim()
                  .toLowerCase() === userEmail
            );
        setClients(visible);
        if (visible.length > 0 && !visible.some((c) => c.id === activeClientId)) {
          setActiveClientId(visible[0].id);
        } else if (visible.length === 0) {
          setActiveClientId(null);
        }
      }

      const { data: apptRows } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true });
      if (apptRows) setAppointments(apptRows);

      const { data: measRows } = await supabase
        .from('measurements')
        .select('*')
        .order('date', { ascending: true });
      if (measRows) setMeasurements(measRows);
    } catch (err) {
      setDataError(err?.message || 'Σφάλμα φόρτωσης δεδομένων.');
    } finally {
      setDataLoading(false);
    }
  };

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.goal || '').toLowerCase().includes(q)
    );
  }, [clients, clientSearch]);

  const activeClientObj = useMemo(
    () => clients.find((c) => c.id === activeClientId) || clients[0] || null,
    [clients, activeClientId]
  );

  const clientMeasurements = useMemo(
    () => measurements.filter((m) => String(m.client_id || m.client) === String(activeClientObj?.id)),
    [measurements, activeClientObj]
  );

  const latestBodyFat = useMemo(() => {
    const withFat = [...clientMeasurements].reverse().find((m) => m.body_fat != null);
    return withFat ? withFat.body_fat : null;
  }, [clientMeasurements]);

  useEffect(() => {
    setProfileSubTab('overview');
  }, [activeClientId]);

  useEffect(() => {
    if (!activeClientObj) return;
    setCalcGender(activeClientObj.gender || 'female');
    setCalcAge(String(activeClientObj.age || 30));
    setCalcWeight(String(activeClientObj.weight || 65));
    setCalcHeight(String(activeClientObj.height || 165));
    setCalcBodyFat(latestBodyFat !== null ? String(latestBodyFat) : '');
    setCalcActivity(Number(activeClientObj.questionnaire?.activityLevel) || 1.375);
    setFdaAiOverride(null);
  }, [activeClientObj?.id, latestBodyFat]);

  useEffect(() => {
    setFdaAiOverride(null);
  }, [selectedDay]);

  const activeFormula = activeClientObj?.questionnaire?.bmrFormula || 'mifflin';
  const activeCalorieDelta = Number(activeClientObj?.questionnaire?.calorieDelta || 0);

  const clientMetabolism = useMemo(() => {
    if (!activeClientObj) return calculateMetabolism({});
    return calculateMetabolism({
      gender: activeClientObj.gender,
      age: activeClientObj.age,
      weight: activeClientObj.weight,
      height: activeClientObj.height,
      activity: activeClientObj.questionnaire?.activityLevel || 1.375,
      bodyFat: latestBodyFat
    });
  }, [activeClientObj, latestBodyFat]);

  const activeBmr = clientMetabolism[activeFormula]?.bmr || 1400;
  const activeTdee = clientMetabolism[activeFormula]?.tdee || 1900;
  const activeTargetKcal = Math.max(1000, activeTdee + activeCalorieDelta);

  const selectedMicros = useMemo(
    () => activeClientObj?.questionnaire?.selectedMicros || ['potassium', 'iron', 'calcium', 'fiber'],
    [activeClientObj]
  );

  const weeklyStats = useMemo(() => {
    const waterPref = activeClientObj?.questionnaire?.waterIntake || '1.5 - 2 λίτρα';
    return DAYS.map((day) => ({
      day,
      ...analyzeDayNutrition(activeClientObj?.meal_plan?.[day] || {}, waterPref)
    }));
  }, [activeClientObj]);

  const dayNutrition = useMemo(() => {
    const base = weeklyStats.find((s) => s.day === selectedDay) || analyzeDayNutrition({});
    if (fdaAiOverride) {
      return {
        ...base,
        kcal: fdaAiOverride.kcal ?? base.kcal,
        protein: fdaAiOverride.protein ?? base.protein,
        carbs: fdaAiOverride.carbs ?? base.carbs,
        fat: fdaAiOverride.fat ?? base.fat,
        micros: { ...base.micros, ...(fdaAiOverride.micros || {}) }
      };
    }
    return base;
  }, [weeklyStats, selectedDay, fdaAiOverride]);

  const shoppingList = useMemo(
    () => buildWeeklyShoppingList(activeClientObj?.meal_plan || {}),
    [activeClientObj?.meal_plan]
  );

  /** Defense-in-depth: only show appointments tied to visible client folders. */
  const visibleAppointments = useMemo(() => {
    const idSet = new Set(clients.map((c) => String(c.id)));
    const nameSet = new Set(
      clients.map((c) => String(c.name || '').trim().toLowerCase()).filter(Boolean)
    );
    return appointments.filter((a) => {
      const cid = String(a.client_id || a.client || '');
      if (cid && idSet.has(cid)) return true;
      const cname = String(a.client_name || a.client || '')
        .trim()
        .toLowerCase();
      return Boolean(cname && nameSet.has(cname));
    });
  }, [appointments, clients]);

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const sorted = [...visibleAppointments].sort(
      (a, b) =>
        String(a.date || '').localeCompare(String(b.date || '')) ||
        String(a.time || '').localeCompare(String(b.time || ''))
    );
    if (apptFilter === 'all') return sorted;
    return sorted.filter((a) => {
      const d = String(a.date || '');
      const t = String(a.time || '00:00').slice(0, 5);
      const isPast = d < today || (d === today && t < hm);
      return apptFilter === 'past' ? isPast : !isPast;
    });
  }, [visibleAppointments, apptFilter]);

  const calcResult = useMemo(
    () =>
      calculateMetabolism({
        gender: calcGender,
        age: calcAge,
        weight: calcWeight,
        height: calcHeight,
        activity: calcActivity,
        bodyFat: calcBodyFat
      }),
    [calcGender, calcAge, calcWeight, calcHeight, calcActivity, calcBodyFat]
  );

  const dayAdherence = useMemo(() => {
    if (!activeClientObj) return { done: 0, total: 5, pct: 0 };
    const dayMeals = activeClientObj.meal_plan?.[selectedDay] || {};
    const activeKeys = MEAL_TYPES.filter((m) => cleanMealText(dayMeals[m.key] || '')).map((m) => m.key);
    const total = Math.max(1, activeKeys.length);
    const done = activeKeys.filter((k) => completedMeals[`${activeClientObj.id}_${selectedDay}_${k}`]).length;
    return { done, total: activeKeys.length, pct: Math.round((done / total) * 100) };
  }, [activeClientObj, selectedDay, completedMeals]);

  const toggleMealComplete = (day, mealKey) => {
    if (!activeClientObj) return;
    const key = `${activeClientObj.id}_${day}_${mealKey}`;
    const next = { ...completedMeals, [key]: !completedMeals[key] };
    setCompletedMeals(next);
    localStorage.setItem('nutricharis_adherence', JSON.stringify(next));
  };

  const adjustWaterGlass = (delta) => {
    if (!activeClientObj) return;
    const key = `${activeClientObj.id}_${selectedDay}`;
    const current = waterGlasses[key] || 0;
    const updated = Math.max(0, Math.min(16, current + delta));
    const next = { ...waterGlasses, [key]: updated };
    setWaterGlasses(next);
    localStorage.setItem('nutricharis_water_glasses', JSON.stringify(next));
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      /* session cleared locally below even if network fails */
    }
    setSession(null);
    setAuthMode('login');
    setClients([]);
    setAppointments([]);
    setMeasurements([]);
    setActiveClientId(null);
    setDataError('');
    setAuthError('');
    setAuthSuccess('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    showToast('Αποσυνδεθήκατε με ασφάλεια.');
  };

  // Auth Handlers (rate-limited; identity always from Supabase Auth)
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (authSubmitting) return;
    setAuthError('');
    setAuthSuccess('');

    const emailClean = sanitizeText(authEmail, 180).trim().toLowerCase();
    const action =
      authMode === 'forgot' ? 'forgot' : authMode === 'register' ? 'signup' : 'login';
    const rl = checkRateLimit(authRateKey(action, emailClean), 8, 15 * 60 * 1000);
    if (!rl.allowed) {
      setAuthError(`Πάρα πολλές προσπάθειες. Δοκιμάστε ξανά σε ${rl.retryAfterSec} δευτερόλεπτα.`);
      return;
    }

    setAuthSubmitting(true);
    try {
      if (authMode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(emailClean, {
          redirectTo: `${window.location.origin}/`
        });
        if (error) setAuthError(error.message);
        else setAuthSuccess('✓ Στάλθηκε σύνδεσμος επαναφοράς κωδικού στο email σας!');
        return;
      }

      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailClean,
          password: authPassword
        });
        if (error) setAuthError('Λάθος email ή κωδικός πρόσβασης.');
        else resetRateLimit(authRateKey('login', emailClean));
      } else if (authMode === 'register') {
        if (!gdprAccepted || !art9Accepted || !termsAccepted) {
          setAuthError('Απαιτείται ρητή συγκατάθεση GDPR, Άρθρου 9 (δεδομένα υγείας) και Όρων Χρήσης.');
          return;
        }
        if (authPassword.length < 6) {
          setAuthError('Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.');
          return;
        }
        const age = parseStrictNum(authAge, 5, 115);
        const weight = parseStrictNum(authWeight, 25, 350);
        const height = parseStrictNum(authHeight, 90, 240);
        if (Number.isNaN(age) || Number.isNaN(weight) || Number.isNaN(height)) {
          setAuthError('Μη έγκυρα ανθρωπομετρικά (ηλικία 5–115, βάρος 25–350kg, ύψος 90–240cm).');
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: emailClean,
          password: authPassword
        });
        if (error) {
          setAuthError(error.message);
          return;
        }
        if (data?.user?.id) {
          const consentAt = new Date().toISOString();
          const { error: insertErr } = await supabase.from('clients').insert([
            {
              name: sanitizeText(authName, 120) || emailClean.split('@')[0],
              email: emailClean,
              phone: sanitizeText(authPhone, 40),
              gender: authGender === 'male' ? 'male' : 'female',
              age,
              weight,
              height,
              goal: sanitizeText(authGoal, 200) || 'Ισορροπημένη διατροφή',
              user_id: data.user.id,
              gdpr_consent_at: consentAt,
              art9_consent_at: consentAt,
              terms_accepted_at: consentAt,
              questionnaire: {
                bmrFormula: 'mifflin',
                activityLevel: Number(authActivity) || 1.375,
                calorieDelta: 0,
                waterIntake: '1.5 - 2 λίτρα',
                healthOther: sanitizeText(authAllergies, 300),
                selectedMicros: ['potassium', 'iron', 'calcium', 'fiber'],
                gdprAcceptedAt: consentAt,
                art9AcceptedAt: consentAt,
                termsAcceptedAt: consentAt
              },
              meal_plan: {}
            }
          ]);
          if (insertErr) {
            setAuthError(insertErr.message || 'Αποτυχία δημιουργίας φακέλου.');
            return;
          }
          resetRateLimit(authRateKey('signup', emailClean));
          showToast('✓ Ο φάκελος & ο λογαριασμός δημιουργήθηκαν!');
        }
      }
    } catch (err) {
      setAuthError(err?.message || 'Αποτυχία σύνδεσης. Δοκιμάστε ξανά.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const mapAuthUpdateError = (raw) => {
    const msg = String(raw || '').toLowerCase();
    if (msg.includes('session') || msg.includes('not authenticated') || msg.includes('jwt')) {
      return 'Ο σύνδεσμος επαναφοράς έληξε ή δεν είναι έγκυρος. Ζητήστε νέο link από «Ξέχασα τον κωδικό μου».';
    }
    if (msg.includes('same password') || msg.includes('should be different')) {
      return 'Ο νέος κωδικός πρέπει να διαφέρει από τον προηγούμενο.';
    }
    return raw || 'Αποτυχία ενημέρωσης κωδικού.';
  };

  const handlePasswordUpdateSubmit = async (e) => {
    e.preventDefault();
    if (passwordUpdating) return;
    setAuthError('');
    const pw = String(newPasswordInput || '');
    const confirm = String(confirmPasswordInput || '');
    if (pw.length < 6) {
      setAuthError('Ο νέος κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.');
      return;
    }
    if (pw !== confirm) {
      setAuthError('Οι κωδικοί δεν ταιριάζουν. Ελέγξτε την επιβεβαίωση.');
      return;
    }
    setPasswordUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) {
        setAuthError(mapAuthUpdateError(error.message));
        return;
      }
      clearAuthRedirectParamsFromUrl();
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setAuthMode('login');
      // Session από recovery παραμένει ενεργή → άμεση είσοδος στο dashboard.
      showToast('✓ Ο νέος κωδικός αποθηκεύτηκε! Καλωσήρθατε.');
    } catch (err) {
      setAuthError(mapAuthUpdateError(err?.message));
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleSwitchClientFormula = async (formula) => {
    if (!activeClientObj) return;
    try {
      const user = await requireSessionUser();
      assertClientAccess(activeClientObj, user, isAdmin);
      const updatedQ = { ...(activeClientObj.questionnaire || {}), bmrFormula: formula };
      setClients((prev) =>
        prev.map((c) => (c.id === activeClientObj.id ? { ...c, questionnaire: updatedQ } : c))
      );
      await supabase.from('clients').update({ questionnaire: updatedQ }).eq('id', activeClientObj.id);
      const label = formula === 'mifflin' ? 'Mifflin-St Jeor' : formula === 'harris' ? 'Harris-Benedict' : 'Katch-McArdle';
      showToast(`✓ Ενεργοποιήθηκε: ${label}`);
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
    }
  };

  const handleChangeCalorieDelta = async (deltaVal) => {
    if (!activeClientObj) return;
    const updatedQ = { ...(activeClientObj.questionnaire || {}), calorieDelta: Number(deltaVal) };
    setClients((prev) =>
      prev.map((c) => (c.id === activeClientObj.id ? { ...c, questionnaire: updatedQ } : c))
    );
    await supabase.from('clients').update({ questionnaire: updatedQ }).eq('id', activeClientObj.id);
    showToast(`✓ Ενημερώθηκε ο θερμιδικός στόχος!`);
  };

  const toggleTrackedMicro = async (microKey) => {
    if (!activeClientObj) return;
    const exists = selectedMicros.includes(microKey);
    const nextMicros = exists ? selectedMicros.filter((k) => k !== microKey) : [...selectedMicros, microKey];
    const updatedQ = { ...(activeClientObj.questionnaire || {}), selectedMicros: nextMicros };
    setClients((prev) =>
      prev.map((c) => (c.id === activeClientObj.id ? { ...c, questionnaire: updatedQ } : c))
    );
    await supabase.from('clients').update({ questionnaire: updatedQ }).eq('id', activeClientObj.id);
  };

  const handleSelectMealOption = async (day, mealType, text) => {
    if (!activeClientObj) return;
    const cleaned = cleanMealText(text);
    const currentPlan = activeClientObj.meal_plan || {};
    const updatedPlan = {
      ...currentPlan,
      [day]: {
        ...(currentPlan[day] || {}),
        [mealType]: cleaned
      }
    };
    setClients((prev) =>
      prev.map((c) => (c.id === activeClientObj.id ? { ...c, meal_plan: updatedPlan } : c))
    );
    await supabase.from('clients').update({ meal_plan: updatedPlan }).eq('id', activeClientObj.id);
    showToast(cleaned ? `✓ Ενημερώθηκε: ${day} • ${mealType}` : `🗑️ Διαγράφηκε: ${day} • ${mealType}`);
  };

  const handleCloneDay = async () => {
    if (!activeClientObj || selectedDay === cloneTargetDay) return;
    const sourceDayMeals = activeClientObj.meal_plan?.[selectedDay] || {};
    const updatedPlan = {
      ...(activeClientObj.meal_plan || {}),
      [cloneTargetDay]: { ...sourceDayMeals }
    };
    setClients((prev) =>
      prev.map((c) => (c.id === activeClientObj.id ? { ...c, meal_plan: updatedPlan } : c))
    );
    await supabase.from('clients').update({ meal_plan: updatedPlan }).eq('id', activeClientObj.id);
    showToast(`✓ Αντιγράφηκε η ${selectedDay} στην ${cloneTargetDay}!`);
  };

  const handleSaveCurrentWeekAsTemplate = (e) => {
    e.preventDefault();
    if (!newTemplateName.trim() || !activeClientObj) return;
    const tpl = {
      id: `tpl-${Date.now()}`,
      name: newTemplateName.trim(),
      plan: activeClientObj.meal_plan || {}
    };
    const next = [tpl, ...weekTemplates];
    setWeekTemplates(next);
    localStorage.setItem('nutricharis_week_templates', JSON.stringify(next));
    setNewTemplateName('');
    showToast(`✓ Αποθηκεύτηκε το πρότυπο: ${tpl.name}`);
  };

  const handleApplyWeekTemplate = async (tpl) => {
    if (!activeClientObj) return;
    setClients((prev) =>
      prev.map((c) => (c.id === activeClientObj.id ? { ...c, meal_plan: tpl.plan } : c))
    );
    await supabase.from('clients').update({ meal_plan: tpl.plan }).eq('id', activeClientObj.id);
    setShowTemplatesModal(false);
    showToast(`✓ Εφαρμόστηκε το πρότυπο: ${tpl.name}`);
  };

  const handleSaveManualCellEdit = async (e) => {
    e.preventDefault();
    if (!editingCell) return;
    await handleSelectMealOption(editingCell.day, editingCell.type, editingCell.text);
    setEditingCell(null);
  };

  const saveIdeaToLibrary = (text, category = 'Γεύμα') => {
    const cleaned = cleanMealText(text);
    if (!cleaned) return;
    const next = [{ id: String(Date.now()), category, text: cleaned }, ...savedIdeas];
    setSavedIdeas(next);
    localStorage.setItem('nutricharis_custom_ideas', JSON.stringify(next));
    showToast('⭐ Αποθηκεύτηκε στις Ιδέες σας!');
  };

  const deleteSavedIdea = (id) => {
    const next = savedIdeas.filter((i) => i.id !== id);
    setSavedIdeas(next);
    localStorage.setItem('nutricharis_custom_ideas', JSON.stringify(next));
  };

  // AI 3 Meal Options — server `/api/generate-meals` first, local key fallback
  const handleGenerateAiMeals = async () => {
    if (!activeClientObj) return;
    if (aiLoading) return;

    setAiLoading(true);
    setAiOptions([]);
    try {
      const q = activeClientObj.questionnaire || {};
      const prompt = `Είσαι η κλινική διαιτολόγος Χάρις Φωτούδη. Πρότεινε 3 διαφορετικές επιλογές για ${aiMealType} (${aiDay}) για τον πελάτη:
- Φύλο: ${activeClientObj.gender === 'male' ? 'Άνδρας' : 'Γυναίκα'}, Ηλικία: ${activeClientObj.age}, Βάρος: ${activeClientObj.weight}kg, Ύψος: ${activeClientObj.height}cm
- Στόχος: ${activeClientObj.goal || 'Ισορροπημένη διατροφή'} | Ημερήσιος Θερμιδικός Στόχος: ${activeTargetKcal} kcal
- Υγεία/Αλλεργίες: ${(q.healthConditions || []).join(', ')} ${q.healthOther || ''}
- Προτιμήσεις: Φρούτα (${(q.preferredFruits || []).join(', ') || 'Όλα'}), Λαχανικά (${(q.preferredVegetables || []).join(', ') || 'Όλα'})
- Ειδική οδηγία: ${aiCustomPrompt || 'Καμία'}

ΑΥΣΤΗΡΟΙ ΚΑΝΟΝΕΣ:
1. Γράψε ΜΟΝΟ τα τρόφιμα με ακριβή γραμμάρια/ποσότητες.
2. ΑΠΑΓΟΡΕΥΟΝΤΑΙ οι περιγραφικές παρενθέσεις ή επεξηγήσεις.
3. Επίστρεψε ΑΠΟΚΛΕΙΣΤΙΚΑ έγκυρο JSON array 3 αντικειμένων:
[{"title":"Σύντομος τίτλος","meal":"Ακριβές γεύμα με γραμμάρια","kcal":420,"protein":32,"carbs":40,"fat":12}]`;

      const rawText = await callMealAi(prompt, apiKey);
      const parsed = parseAiJson(rawText, []);
      setAiOptions(Array.isArray(parsed) ? parsed : []);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        showToast('⚠️ Δεν ελήφθησαν έγκυρες προτάσεις AI. Δοκιμάστε ξανά.');
      }
    } catch (err) {
      if (!apiKey) setShowApiKeyModal(true);
      showToast(`⚠️ ${err?.message || 'Ελέγξτε το Gemini API Key στις Ρυθμίσεις.'}`);
    } finally {
      setAiLoading(false);
    }
  };

  // AI Full 7-Day Plan Generator
  const handleGenerateFullWeekAi = async () => {
    if (!activeClientObj) return;
    if (aiFullWeekLoading) return;
    if (!window.confirm(`Να δημιουργηθεί αυτόματα πλήρες εβδομαδιαίο πλάνο 7 ημερών (~${activeTargetKcal} kcal/ημέρα) για ${activeClientObj.name};`)) {
      return;
    }

    setAiFullWeekLoading(true);
    try {
      const q = activeClientObj.questionnaire || {};
      const prompt = `Είσαι η κλινική διαιτολόγος Χάρις Φωτούδη. Φτιάξε ένα ολοκληρωμένο εβδομαδιαίο μεσογειακό διαιτολόγιο 7 ημερών (Δευτέρα έως Κυριακή) για:
- Φύλο: ${activeClientObj.gender === 'male' ? 'Άνδρας' : 'Γυναίκα'}, Ηλικία: ${activeClientObj.age}, Βάρος: ${activeClientObj.weight}kg, Ύψος: ${activeClientObj.height}cm
- Στόχος: ${activeClientObj.goal || 'Ισορροπημένη διατροφή'} | Αυστηρός Ημερήσιος Θερμιδικός Στόχος: ${activeTargetKcal} kcal/ημέρα
- Υγεία/Αλλεργίες: ${(q.healthConditions || []).join(', ')} ${q.healthOther || ''}
- Προτιμήσεις: Φρούτα (${(q.preferredFruits || []).join(', ') || 'Όλα'}), Λαχανικά (${(q.preferredVegetables || []).join(', ') || 'Όλα'}), Κρέας/Ψάρι (${(q.meatTypes || []).join(', ') || 'Όλα'})
- Ειδική οδηγία: ${aiCustomPrompt || 'Καμία'}

ΑΥΣΤΗΡΟΙ ΚΑΝΟΝΕΣ:
1. Γράψε ΜΟΝΟ τα τρόφιμα με ακριβή γραμμάρια/ποσότητες (χωρίς επεξηγήσεις ή παρενθέσεις).
2. Επίστρεψε ΑΠΟΚΛΕΙΣΤΙΚΑ έγκυρο JSON object με κλειδιά τις 7 ημέρες ("Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή") και μέσα σε κάθε ημέρα τα 5 γεύματα: "Πρωινό", "Σνακ 1", "Μεσημεριανό", "Σνακ 2", "Βραδινό".`;

      const rawText = await callMealAi(prompt, apiKey);
      const parsed = parseAiJson(rawText, {});

      const cleanedWeek = {};
      DAYS.forEach((d) => {
        cleanedWeek[d] = {};
        MEAL_TYPES.forEach((m) => {
          cleanedWeek[d][m.key] = cleanMealText(parsed?.[d]?.[m.key] || '');
        });
      });

      setClients((prev) =>
        prev.map((c) => (c.id === activeClientObj.id ? { ...c, meal_plan: cleanedWeek } : c))
      );
      await supabase.from('clients').update({ meal_plan: cleanedWeek }).eq('id', activeClientObj.id);
      showToast('✨ Το εβδομαδιαίο πλάνο 7 ημερών δημιουργήθηκε!');
    } catch (err) {
      if (!apiKey) setShowApiKeyModal(true);
      showToast(`⚠️ ${err?.message || 'Σφάλμα κατά τη δημιουργία πλάνου 7 ημερών.'}`);
    } finally {
      setAiFullWeekLoading(false);
    }
  };

  const handleExactFdaAnalysis = async () => {
    if (!activeClientObj) return;
    if (fdaLoading) return;
    const dayPlan = activeClientObj?.meal_plan?.[selectedDay] || {};
    const summary = MEAL_TYPES.map((m) => `${m.key}: ${dayPlan[m.key] || 'Κενό'}`).join('\n');

    setFdaLoading(true);
    try {
      const prompt = `Υπολόγισε με κλινική ακρίβεια USDA/FDA τα συνολικά ημερήσια θρεπτικά συστατικά για το παρακάτω διαιτολόγιο (${selectedDay}):
${summary}

Επίστρεψε ΑΠΟΚΛΕΙΣΤΙΚΑ έγκυρο JSON:
{"kcal":1650,"protein":105,"carbs":145,"fat":58,"micros":{"potassium":3100,"iron":13.5,"calcium":920,"fiber":25.4,"magnesium":340,"sodium":1650,"vitC":85,"vitD":6.5,"vitB12":3.1,"zinc":9.8,"omega3":1.4}}`;

      const rawText = await callMealAi(prompt, apiKey);
      const parsed = parseAiJson(rawText, {});
      if (parsed?.kcal != null && Number.isFinite(Number(parsed.kcal))) {
        setFdaAiOverride(parsed);
        showToast(`✓ Ακριβής ανάλυση FDA ολοκληρώθηκε για ${selectedDay}`);
      } else {
        showToast('⚠️ Μη έγκυρη απόκριση FDA ανάλυσης.');
      }
    } catch (err) {
      if (!apiKey) setShowApiKeyModal(true);
      showToast(`⚠️ ${err?.message || 'Σφάλμα κατά την ανάλυση FDA.'}`);
    } finally {
      setFdaLoading(false);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('⚠️ Μόνο ο διαιτολόγος μπορεί να δημιουργήσει φάκελο πελάτη.');
      return;
    }
    if (!newClientName.trim()) return;
    if (!newClientGdpr || !newClientArt9 || !newClientTerms) {
      showToast('⚠️ Απαιτείται ρητή συγκατάθεση GDPR / Άρθρου 9 / Όρων πριν την αποθήκευση.');
      return;
    }
    const age = parseStrictNum(newClientAge, 5, 115);
    const weight = parseStrictNum(newClientWeight, 25, 350);
    const height = parseStrictNum(newClientHeight, 90, 240);
    if (Number.isNaN(age) || Number.isNaN(weight) || Number.isNaN(height)) {
      showToast('⚠️ Μη έγκυρα δεδομένα (ηλικία/βάρος/ύψος εκτός ορίων).');
      return;
    }
    try {
      const user = await requireSessionUser();
      const consentAt = new Date().toISOString();
      const payload = {
        name: sanitizeText(newClientName, 120),
        email: sanitizeText(newClientEmail, 180).toLowerCase(),
        phone: sanitizeText(newClientPhone, 40),
        gender: newClientGender === 'male' ? 'male' : 'female',
        age,
        weight,
        height,
        goal: sanitizeText(newClientGoal, 200),
        dietitian_id: user.id,
        gdpr_consent_at: consentAt,
        art9_consent_at: consentAt,
        terms_accepted_at: consentAt,
        questionnaire: {
          bmrFormula: 'mifflin',
          activityLevel: 1.375,
          calorieDelta: 0,
          waterIntake: '1.5 - 2 λίτρα',
          selectedMicros: ['potassium', 'iron', 'calcium', 'fiber'],
          gdprAcceptedAt: consentAt,
          art9AcceptedAt: consentAt,
          termsAcceptedAt: consentAt
        },
        meal_plan: {}
      };
      const { data, error } = await supabase.from('clients').insert([payload]).select();
      if (error) {
        showToast(`⚠️ ${error.message}`);
        return;
      }
      if (data?.[0]) {
        setClients((prev) => [data[0], ...prev]);
        setActiveClientId(data[0].id);
        setShowNewClientForm(false);
        setNewClientName('');
        setNewClientEmail('');
        setNewClientPhone('');
        setNewClientGdpr(false);
        setNewClientArt9(false);
        setNewClientTerms(false);
        setActiveTab('plan');
        showToast(`✓ Δημιουργήθηκε ο φάκελος: ${data[0].name}`);
      }
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
    }
  };

  const handlePermanentDeleteClient = async (client) => {
    const user = await requireSessionUser();
    assertClientAccess(client, user, isAdmin);
    // Cascade-related rows first (best-effort); RLS still gates each table.
    await supabase.from('appointments').delete().eq('client_id', client.id);
    await supabase.from('measurements').delete().eq('client_id', client.id);
    const { error } = await supabase.from('clients').delete().eq('id', client.id);
    if (error) throw new Error(error.message);
    const remaining = clients.filter((c) => c.id !== client.id);
    setClients(remaining);
    if (activeClientId === client.id) {
      setActiveClientId(remaining[0]?.id || null);
    }
    showToast(`🗑️ Οριστική διαγραφή φακέλου (GDPR Άρθρο 17): ${client.name}`);
  };

  const handleDeleteClient = async (e, client) => {
    e.stopPropagation();
    const first = window.confirm(
      `Επιβεβαίωση 1/2 — Οριστική διαγραφή φακέλου "${client.name}"; (GDPR Άρθρο 17)`
    );
    if (!first) return;
    const typed = window.prompt(
      `Επιβεβαίωση 2/2 — Πληκτρολογήστε ακριβώς το όνομα «${client.name}» για οριστική διαγραφή:`
    );
    if (String(typed || '').trim() !== String(client.name || '').trim()) {
      showToast('⚠️ Η διαγραφή ακυρώθηκε — το όνομα δεν ταιριάζει.');
      return;
    }
    try {
      await handlePermanentDeleteClient(client);
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
    }
  };

  const openClientEditModal = (client) => {
    setEditingClient(client);
    setEditName(client.name || '');
    setEditPhone(client.phone || '');
    setEditGender(client.gender || 'female');
    setEditAge(String(client.age || 30));
    setEditWeight(String(client.weight || 65));
    setEditHeight(String(client.height || 165));
    setEditGoal(client.goal || '');
    setEditQ({
      bmrFormula: 'mifflin',
      activityLevel: 1.375,
      calorieDelta: 0,
      waterIntake: '1.5 - 2 λίτρα',
      stomachBloating: '',
      healthConditions: [],
      preferredFruits: [],
      preferredVegetables: [],
      meatTypes: [],
      ...(client.questionnaire || {})
    });
  };

  const toggleEditArrayItem = (field, val) => {
    setEditQ((prev) => {
      const arr = prev[field] || [];
      return {
        ...prev,
        [field]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]
      };
    });
  };

  const saveClientEdit = async (e) => {
    e.preventDefault();
    if (!editingClient) return;
    try {
      const user = await requireSessionUser();
      assertClientAccess(editingClient, user, isAdmin);
      const age = parseStrictNum(editAge, 5, 115);
      const weight = parseStrictNum(editWeight, 25, 350);
      const height = parseStrictNum(editHeight, 90, 240);
      if (Number.isNaN(age) || Number.isNaN(weight) || Number.isNaN(height)) {
        showToast('⚠️ Μη έγκυρα ανθρωπομετρικά στοιχεία.');
        return;
      }
      const updatedFields = {
        name: sanitizeText(editName, 120),
        phone: sanitizeText(editPhone, 40),
        gender: editGender === 'male' ? 'male' : 'female',
        age,
        weight,
        height,
        goal: sanitizeText(editGoal, 200),
        questionnaire: {
          ...editQ,
          activityLevel: Number(editQ.activityLevel) || 1.375,
          calorieDelta: Number(editQ.calorieDelta) || 0
        }
      };
      const { error } = await supabase.from('clients').update(updatedFields).eq('id', editingClient.id);
      if (error) {
        showToast(`⚠️ ${error.message}`);
        return;
      }
      setClients((prev) => prev.map((c) => (c.id === editingClient.id ? { ...c, ...updatedFields } : c)));
      setEditingClient(null);
      showToast('✓ Ο φάκελος πελάτη ενημερώθηκε!');
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
    }
  };

  const handleAddAppointment = async (e) => {
    e.preventDefault();
    if (!activeClientObj) return;
    try {
      const user = await requireSessionUser();
      assertClientAccess(activeClientObj, user, isAdmin);
      const typeLabel = sanitizeText(apptType || APPOINTMENT_TYPES[0], 80);
      const extraNotes = sanitizeText(apptNotes, 400);
      const payload = {
        client_id: activeClientObj.id,
        client_name: sanitizeText(activeClientObj.name, 120),
        date: apptDate,
        time: apptTime,
        notes: sanitizeText(extraNotes ? `${typeLabel} — ${extraNotes}` : typeLabel, 500),
        status: 'Προγραμματισμένο',
        dietitian_id: user.id
      };
      const { data, error } = await supabase.from('appointments').insert([payload]).select();
      if (error) {
        showToast(`⚠️ ${error.message}`);
        return;
      }
      if (data?.[0]) {
        setAppointments((prev) => [...prev, data[0]]);
        showToast('✓ Το ραντεβού καταχωρήθηκε!');
      }
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (!window.confirm('Διαγραφή αυτού του ραντεβού;')) return;
    try {
      const user = await requireSessionUser();
      const row = appointments.find((a) => a.id === id);
      if (row?.dietitian_id && row.dietitian_id !== user.id && !isAdmin) {
        showToast('⚠️ Δεν έχετε δικαίωμα διαγραφής αυτού του ραντεβού.');
        return;
      }
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) {
        showToast(`⚠️ ${error.message}`);
        return;
      }
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      showToast('🗑️ Το ραντεβού διαγράφηκε.');
    } catch (err) {
      showToast(`⚠️ ${err?.message || 'Αποτυχία διαγραφής ραντεβού.'}`);
    }
  };

  const handleAddMeasurement = async (e) => {
    e.preventDefault();
    if (!activeClientObj || !measWeight) return;
    try {
      const user = await requireSessionUser();
      assertClientAccess(activeClientObj, user, isAdmin);
      const w = clampNum(measWeight, 25, 350, NaN);
      if (Number.isNaN(w)) {
        showToast('⚠️ Μη έγκυρο βάρος.');
        return;
      }
      const payload = {
        client_id: activeClientObj.id,
        date: new Date().toISOString().slice(0, 10),
        weight: w,
        body_fat: measFat !== '' ? clampNum(measFat, 3, 70, NaN) : null,
        muscle_mass: measMuscle !== '' ? clampNum(measMuscle, 10, 150, NaN) : null,
        waist: measWaist !== '' ? clampNum(measWaist, 40, 220, NaN) : null,
        dietitian_id: user.id
      };
      if (payload.body_fat !== null && Number.isNaN(payload.body_fat)) payload.body_fat = null;
      if (payload.muscle_mass !== null && Number.isNaN(payload.muscle_mass)) payload.muscle_mass = null;
      if (payload.waist !== null && Number.isNaN(payload.waist)) payload.waist = null;
      const { data, error } = await supabase.from('measurements').insert([payload]).select();
      if (error) {
        showToast(`⚠️ ${error.message}`);
        return;
      }
      if (data?.[0]) {
        setMeasurements((prev) => [...prev, data[0]]);
        await supabase.from('clients').update({ weight: w }).eq('id', activeClientObj.id);
        setClients((prev) => prev.map((c) => (c.id === activeClientObj.id ? { ...c, weight: w } : c)));
        setMeasWeight('');
        setMeasFat('');
        setMeasMuscle('');
        setMeasWaist('');
        showToast('✓ Η μέτρηση αποθηκεύτηκε & ενημερώθηκε το βάρος!');
      }
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
    }
  };

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    localStorage.setItem('nutricharis_gemini_key', tempApiKey.trim());
    setApiKey(tempApiKey.trim());
    setTempApiKey('');
    setShowApiKeyModal(false);
    showToast('✓ Το Gemini AI Key αποθηκεύτηκε!');
  };

  const handleSendWeeklyPlanWhatsApp = () => {
    if (!activeClientObj) return;
    const msgText = formatWeeklyPlanForWhatsApp(activeClientObj, activeTargetKcal);
    const cleanPhone = (activeClientObj.phone || '').replace(/\D/g, '');
    const waPhone = cleanPhone.startsWith('69') ? `30${cleanPhone}` : cleanPhone;

    if (waPhone) {
      window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msgText)}`, '_blank');
    } else {
      navigator.clipboard.writeText(msgText);
      showToast('✓ Το εβδομαδιαίο πλάνο αντιγράφηκε (δεν υπάρχει τηλ. στον φάκελο).');
    }
  };

  // =========================================================================
  // LOADING / PASSWORD RECOVERY / SPLIT LOGIN & CLIENT ONBOARDING REGISTER
  // =========================================================================
  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '18px'
        }}
      >
        <BrandLogo size={52} className="boot-logo-pulse" />
        <div className="boot-spinner" aria-hidden />
        <div
          className="font-display"
          style={{ fontSize: '15px', color: '#e2e8f0', fontWeight: 800, letterSpacing: '-0.02em' }}
        >
          Χάρις Φωτούδη
        </div>
        <div style={{ fontSize: '11.5px', color: '#34d399', fontWeight: 700, letterSpacing: '0.08em' }}>
          NUTRICHARIS
        </div>
      </div>
    );
  }

  if (authMode === 'recovery') {
    const strength = getPasswordStrength(newPasswordInput);
    const passwordsMatch =
      confirmPasswordInput.length > 0 && newPasswordInput === confirmPasswordInput;
    return (
      <div
        className="glass-modal-backdrop"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        <div className="luxury-card glass-elevated" style={{ width: '100%', maxWidth: '440px', padding: '28px', animation: 'fadeInSlide 0.28s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <BrandLogo size={42} />
            <div>
              <h2 className="font-display" style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>
                Ορισμός Νέου Κωδικού
              </h2>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                NutriCharis • Ασφαλής επαναφορά πρόσβασης
              </div>
            </div>
          </div>
          <p style={{ margin: '0 0 16px 0', fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.55 }}>
            Ορίστε νέο κωδικό. Μετά την αποθήκευση θα συνδεθείτε αυτόματα στο dashboard.
          </p>
          {authError && (
            <div role="alert" className="status-badge status-badge--danger" style={{ display: 'block', marginBottom: '12px', borderRadius: '11px', padding: '10px 14px' }}>
              {authError}
            </div>
          )}
          <form onSubmit={handlePasswordUpdateSubmit} style={{ display: 'grid', gap: '13px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                Νέος Κωδικός *
              </label>
              <input
                className="luxury-input"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Τουλάχιστον 6 χαρακτήρες"
                disabled={passwordUpdating}
              />
              {newPasswordInput.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div
                    style={{
                      height: '6px',
                      borderRadius: '99px',
                      background: 'rgba(255,255,255,0.08)',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: `${strength.pct}%`,
                        height: '100%',
                        background: strength.color,
                        transition: 'width 0.25s ease, background 0.25s ease'
                      }}
                    />
                  </div>
                  <div style={{ marginTop: '5px', fontSize: '11px', color: strength.color, fontWeight: 700 }}>
                    Ισχύς: {strength.label}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                Επιβεβαίωση Κωδικού *
              </label>
              <input
                className="luxury-input"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPasswordInput}
                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                placeholder="Επαναλάβετε τον νέο κωδικό"
                disabled={passwordUpdating}
              />
              {confirmPasswordInput.length > 0 && (
                <div
                  style={{
                    marginTop: '5px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: passwordsMatch ? '#34d399' : '#f87171'
                  }}
                >
                  {passwordsMatch ? '✓ Οι κωδικοί ταιριάζουν' : 'Οι κωδικοί δεν ταιριάζουν ακόμη'}
                </div>
              )}
            </div>
            <button
              type="submit"
              className="btn-emerald"
              disabled={passwordUpdating || newPasswordInput.length < 6 || !passwordsMatch}
              style={{
                padding: '13px',
                opacity: passwordUpdating || newPasswordInput.length < 6 || !passwordsMatch ? 0.55 : 1,
                cursor: passwordUpdating || newPasswordInput.length < 6 || !passwordsMatch ? 'not-allowed' : 'pointer'
              }}
            >
              {passwordUpdating ? 'Αποθήκευση…' : '✓ Αποθήκευση Νέου Κωδικού'}
            </button>
          </form>
          <div style={{ marginTop: '14px' }}>
            <MedicalFooter compact onOpenLegal={setLegalDoc} />
          </div>
          {legalDoc && <LegalModal docKey={legalDoc} onClose={() => setLegalDoc(null)} />}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="auth-split-grid">
        <div
          className="auth-brand-panel"
          style={{
            padding: '56px 52px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRight: '1px solid rgba(255,255,255,0.07)',
            background: 'linear-gradient(165deg, rgba(6, 28, 20, 0.92) 0%, rgba(5, 8, 7, 0.98) 100%)'
          }}
        >
          <div className="auth-brand-reveal" style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '540px' }}>
            <BrandLogo size={58} />
            <div>
              <div
                className="font-display"
                style={{ fontSize: 'clamp(34px, 4.2vw, 48px)', fontWeight: 800, color: '#fff', lineHeight: 1.05, margin: 0 }}
              >
                Χάρις Φωτούδη
              </div>
              <div
                style={{
                  marginTop: '10px',
                  fontSize: '15px',
                  color: '#34d399',
                  fontWeight: 700,
                  letterSpacing: '0.04em'
                }}
              >
                NutriCharis
              </div>
            </div>
            <h1
              className="font-display"
              style={{
                fontSize: 'clamp(20px, 2.2vw, 26px)',
                lineHeight: 1.35,
                fontWeight: 700,
                margin: 0,
                color: '#e2e8f0',
                maxWidth: '420px'
              }}
            >
              Κλινικός σχεδιασμός διατροφής με ακρίβεια.
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14.5px', lineHeight: 1.65, margin: 0, maxWidth: '400px' }}>
              Μεταβολικός υπολογισμός, FDA μικροθρεπτικά και ασφαλής φάκελος πελάτη — σε ένα clinical OS.
            </p>
          </div>

          <div className="auth-brand-meta auth-brand-reveal" style={{ animationDelay: '0.12s' }}>
            BMR · FDA micros · GDPR / Art.9
          </div>
        </div>

        <div className="auth-form-column">
          <div className="luxury-card glass-elevated auth-form-rise" style={{ width: '100%', maxWidth: '440px', padding: '28px 26px' }}>
            <div className="auth-mobile-brand">
              <BrandLogo size={40} />
              <div>
                <div className="font-display" style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                  Χάρις Φωτούδη
                </div>
                <div style={{ fontSize: '12px', color: '#34d399', fontWeight: 700 }}>NutriCharis</div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h2 className="font-display" style={{ margin: '0 0 6px 0', fontSize: '21px', fontWeight: 800 }}>
                {authMode === 'login'
                  ? 'Σύνδεση'
                  : authMode === 'register'
                  ? 'Εγγραφή πελάτη'
                  : 'Επαναφορά κωδικού'}
              </h2>
              <div style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.45 }}>
                {authMode === 'login'
                  ? 'Είσοδος στο διατροφολογικό γραφείο.'
                  : authMode === 'register'
                  ? 'Δημιουργία φακέλου με ρητή συγκατάθεση GDPR.'
                  : 'Θα λάβετε σύνδεσμο επαναφοράς στο email σας.'}
              </div>
            </div>

            {authError && (
              <div role="alert" style={{ padding: '11px 14px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.14)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#fca5a5', fontSize: '12.5px', marginBottom: '14px' }}>
                {authError}
              </div>
            )}

            {authSuccess && (
              <div role="status" style={{ padding: '11px 14px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.14)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#6ee7b7', fontSize: '12.5px', marginBottom: '14px' }}>
                {authSuccess}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} style={{ display: 'grid', gap: '11px' }}>
              {authMode === 'register' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: '600' }}>Ονοματεπώνυμο *</label>
                      <input className="luxury-input" type="text" required value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Μαρία Παπαδοπούλου" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: '600' }}>Τηλέφωνο</label>
                      <input className="luxury-input" type="tel" value={authPhone} onChange={(e) => setAuthPhone(e.target.value)} placeholder="69..." />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '7px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Φύλο</label>
                      <select className="luxury-input" style={{ padding: '9px 7px', fontSize: '12.5px' }} value={authGender} onChange={(e) => setAuthGender(e.target.value)}>
                        <option value="female">Γυναίκα</option>
                        <option value="male">Άνδρας</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Ηλικία</label>
                      <input className="luxury-input" style={{ padding: '9px 8px', fontSize: '12.5px' }} type="number" min={5} max={115} required value={authAge} onChange={(e) => setAuthAge(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Κιλά</label>
                      <input className="luxury-input" style={{ padding: '9px 8px', fontSize: '12.5px' }} type="number" min={25} max={350} step="0.1" required value={authWeight} onChange={(e) => setAuthWeight(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Ύψος</label>
                      <input className="luxury-input" style={{ padding: '9px 8px', fontSize: '12.5px' }} type="number" min={90} max={240} required value={authHeight} onChange={(e) => setAuthHeight(e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Στόχος</label>
                      <input className="luxury-input" type="text" value={authGoal} onChange={(e) => setAuthGoal(e.target.value)} placeholder="π.χ. Απώλεια βάρους" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Δραστηριότητα</label>
                      <select className="luxury-input" style={{ fontSize: '12.5px' }} value={authActivity} onChange={(e) => setAuthActivity(parseFloat(e.target.value))}>
                        {ACTIVITY_FACTORS.map((af) => (
                          <option key={af.value} value={af.value}>{af.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Αλλεργίες / Υγεία (προαιρετικό)</label>
                    <input className="luxury-input" type="text" value={authAllergies} onChange={(e) => setAuthAllergies(e.target.value)} placeholder="π.χ. Θυρεοειδής, δυσανεξία στη λακτόζη..." />
                  </div>
                </>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: '600' }}>Email *</label>
                <input className="luxury-input" type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="name@example.com" />
              </div>

              {authMode !== 'forgot' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>Κωδικός Πρόσβασης *</label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot');
                          setAuthError('');
                          setAuthSuccess('');
                        }}
                        style={{ background: 'none', border: 'none', color: '#34d399', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                      >
                        Ξέχασα τον κωδικό μου;
                      </button>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="luxury-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ paddingRight: '70px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        fontWeight: '700'
                      }}
                    >
                      {showPassword ? 'Απόκρυψη' : 'Προβολή'}
                    </button>
                  </div>
                </div>
              )}

              {authMode === 'register' && (
                <GdprConsentFields
                  gdprAccepted={gdprAccepted}
                  setGdprAccepted={setGdprAccepted}
                  art9Accepted={art9Accepted}
                  setArt9Accepted={setArt9Accepted}
                  termsAccepted={termsAccepted}
                  setTermsAccepted={setTermsAccepted}
                  onOpenLegal={setLegalDoc}
                />
              )}

              <button
                type="submit"
                className="btn-emerald"
                disabled={authSubmitting}
                style={{
                  marginTop: '4px',
                  padding: '13px',
                  opacity: authSubmitting ? 0.65 : 1,
                  cursor: authSubmitting ? 'wait' : 'pointer'
                }}
              >
                {authSubmitting
                  ? 'Παρακαλώ περιμένετε…'
                  : authMode === 'login'
                  ? 'Είσοδος στην Πλατφόρμα →'
                  : authMode === 'register'
                  ? 'Δημιουργία Φακέλου & Είσοδος →'
                  : 'Αποστολή Link Επαναφοράς →'}
              </button>
            </form>

            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12.5px', color: '#94a3b8' }}>
              {authMode === 'forgot' ? (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  style={{ background: 'none', border: 'none', color: '#34d399', fontWeight: '700', cursor: 'pointer' }}
                >
                  ← Επιστροφή στη Σύνδεση
                </button>
              ) : (
                <div>
                  {authMode === 'login' ? 'Νέος πελάτης; ' : 'Έχετε ήδη λογαριασμό; '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'register' : 'login');
                      setAuthError('');
                      setAuthSuccess('');
                    }}
                    style={{ background: 'none', border: 'none', color: '#34d399', fontWeight: '700', cursor: 'pointer' }}
                  >
                    {authMode === 'login' ? 'Εγγραφή & Ιστορικό' : 'Σύνδεση'}
                  </button>
                </div>
              )}
            </div>
            <div style={{ marginTop: '16px' }}>
              <MedicalFooter compact onOpenLegal={setLegalDoc} />
            </div>
          </div>
        </div>
        {legalDoc && <LegalModal docKey={legalDoc} onClose={() => setLegalDoc(null)} />}
      </div>
    );
  }

  // =========================================================================
  // MAIN CLINICAL WORKSPACE (100% LOCKED MOBILE + DESKTOP)
  // =========================================================================
  const kcalPct = Math.min(100, Math.round((dayNutrition.kcal / Math.max(1, activeTargetKcal)) * 100));
  const macroTotalKcal = Math.max(1, dayNutrition.protein * 4 + dayNutrition.carbs * 4 + dayNutrition.fat * 9);
  const pPct = Math.round(((dayNutrition.protein * 4) / macroTotalKcal) * 100);
  const cPct = Math.round(((dayNutrition.carbs * 4) / macroTotalKcal) * 100);
  const fPct = Math.round(((dayNutrition.fat * 9) / macroTotalKcal) * 100);
  const proteinPerKg = activeClientObj?.weight
    ? (dayNutrition.protein / Math.max(1, Number(activeClientObj.weight))).toFixed(1)
    : '0.0';

  const navTabs = [
    ...(isAdmin ? [{ id: 'clients', icon: '👥', short: 'Πελάτες', label: `👥 Πελάτες (${clients.length})` }] : []),
    { id: 'plan', icon: '📅', short: 'Πλάνο', label: '📅 Σχεδιασμός Πλάνου' },
    { id: 'profile', icon: '📂', short: 'Φάκελος', label: '📂 Φάκελος Πελάτη' },
    { id: 'appointments', icon: '🗓️', short: 'Ραντεβού', label: '🗓️ Ραντεβού' },
    { id: 'measurements', icon: '📏', short: 'Πρόοδος', label: '📏 Μετρήσεις' },
    { id: 'calculator', icon: '⚡', short: 'BMR', label: '⚡ BMR / TDEE' }
  ];

  const todayWaterGlasses = activeClientObj ? waterGlasses[`${activeClientObj.id}_${selectedDay}`] || 0 : 0;

  return (
    <div style={{ minHeight: '100vh', width: '100%', maxWidth: '100vw', overflowX: 'hidden', paddingBottom: '64px' }}>
      {(dataError || (!dataLoading && clients.length === 0)) && (
        <div className="no-print" style={{ maxWidth: '1460px', margin: '10px auto 0', padding: '0 14px' }}>
          {dataError && (
            <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(239,68,68,0.14)', color: '#fca5a5', fontSize: '12.5px', fontWeight: 700 }}>
              {dataError}
            </div>
          )}
        </div>
      )}
      {!showPdfModal && (
        <div className="print-only-sheet">
          <PrintableExcelSheet
            id="printable-excel-sheet"
            theme={pdfTheme}
            clientObj={activeClientObj}
            mealPlan={activeClientObj?.meal_plan || {}}
          />
        </div>
      )}

      {/* TOP COMMAND HEADER */}
      <header
        className="no-print"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 90,
          width: '100%',
          background: 'rgba(5, 8, 7, 0.9)',
          backdropFilter: 'blur(22px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)'
        }}
      >
        <div style={{ maxWidth: '1460px', margin: '0 auto', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
            <BrandLogo size={34} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="font-display" style={{ fontSize: '15px', fontWeight: '800', color: '#fff', whiteSpace: 'nowrap' }}>
                  Χάρις Φωτούδη
                </span>
                <span className="status-badge status-badge--info" style={{ fontSize: '9px', padding: '2px 6px' }}>
                  NutriCharis
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#34d399', fontWeight: '600' }}>
                Clinical Nutrition OS · Solo
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {isAdmin && clients.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '5px 8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <select
                  value={activeClientObj?.id || ''}
                  onChange={(e) => setActiveClientId(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#34d399',
                    fontWeight: '800',
                    fontSize: '12px',
                    outline: 'none',
                    cursor: 'pointer',
                    maxWidth: '115px'
                  }}
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id} style={{ background: '#0b1210', color: '#fff' }}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowApiKeyModal(true)}
                style={{
                  padding: '6px 9px',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: '9px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                ⚙️ AI{apiKey ? '✓' : ''}
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="btn-ghost-danger"
              aria-label="Αποσύνδεση"
              style={{
                padding: '6px 9px',
                fontSize: '11px',
                fontWeight: '700'
              }}
            >
              Αποσύνδεση
            </button>
          </div>
        </div>

        {/* Desktop Navigation Bar */}
        <div className="desktop-top-tabs" style={{ maxWidth: '1460px', margin: '0 auto', padding: '0 22px 12px 22px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {navTabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '12px',
                  border: active ? '1px solid rgba(52, 211, 153, 0.5)' : '1px solid rgba(255,255,255,0.06)',
                  background: active
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.28) 0%, rgba(5, 150, 105, 0.18) 100%)'
                    : 'rgba(255,255,255,0.03)',
                  color: active ? '#ecfdf5' : '#94a3b8',
                  fontWeight: active ? '800' : '600',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* FLOATING MOBILE NATIVE APP BOTTOM NAVIGATION DOCK */}
      <nav
        className="mobile-bottom-dock no-print"
        style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          right: '10px',
          zIndex: 250,
          background: 'rgba(8, 14, 12, 0.94)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(52, 211, 153, 0.28)',
          borderRadius: '18px',
          padding: '5px 4px',
          justifyContent: 'space-around',
          alignItems: 'center',
          boxShadow: '0 14px 35px rgba(0, 0, 0, 0.85)'
        }}
      >
        {navTabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: '6px 2px',
                borderRadius: '12px',
                border: 'none',
                background: active ? 'rgba(16, 185, 129, 0.22)' : 'transparent',
                color: active ? '#34d399' : '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '15px', lineHeight: 1 }}>{tab.icon}</span>
              <span style={{ fontSize: '9.5px', fontWeight: active ? '800' : '600', whiteSpace: 'nowrap' }}>{tab.short}</span>
            </button>
          );
        })}
      </nav>

      <main className="app-main-container no-print" style={{ maxWidth: '1460px', width: '100%', margin: '18px auto 0 auto', padding: '0 22px', display: 'grid', gap: '14px' }}>
        {dataLoading && <DataSkeleton />}

        {!dataLoading && !activeClientObj && activeTab !== 'clients' && (
          <EmptyState
            icon="👥"
            title={isAdmin ? 'Δεν υπάρχει ενεργός φάκελος πελάτη' : 'Ο φάκελός σας δεν είναι ακόμα διαθέσιμος'}
            body={
              isAdmin
                ? 'Δημιουργήστε τον πρώτο κλινικό φάκελο ή επιλέξτε πελάτη από το μητρώο για να συνεχίσετε με πλάνο, μετρήσεις και ραντεβού.'
                : 'Μόλις ο διαιτολόγος συνδέσει τον λογαριασμό σας, θα εμφανιστεί εδώ το εξατομικευμένο πλάνο.'
            }
            actionLabel={isAdmin ? '+ Νέος φάκελος πελάτη' : null}
            onAction={
              isAdmin
                ? () => {
                    setActiveTab('clients');
                    setShowNewClientForm(true);
                  }
                : undefined
            }
          />
        )}

        {/* ACTIVE CLIENT EXECUTIVE RIBBON + CALORIE TARGET SELECTOR */}
        {activeClientObj && (
          <section
            className="luxury-card"
            style={{
              padding: '15px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '13px',
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(245,158,11,0.2))',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  fontWeight: '800',
                  color: '#6ee7b7',
                  flexShrink: 0
                }}
              >
                {(activeClientObj.name || 'Π').slice(0, 2).toUpperCase()}
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800' }}>{activeClientObj.name}</h2>
                  <span style={{ fontSize: '11px', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '99px' }}>
                    {activeClientObj.gender === 'male' ? 'Άνδρας' : 'Γυναίκα'} • {activeClientObj.age}ε • {activeClientObj.weight}kg • {activeClientObj.height}cm • BMI{' '}
                    <strong style={{ color: '#38bdf8' }}>{clientMetabolism.mifflin.bmi}</strong>
                    {latestBodyFat !== null && (
                      <>
                        {' '}• Λίπος <strong style={{ color: '#fbbf24' }}>{latestBodyFat}%</strong>
                      </>
                    )}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#34d399', marginTop: '3px', fontWeight: '600' }}>
                  🎯 {activeClientObj.goal || 'Ισορροπημένη διατροφή'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {isAdmin && (
                <>
                  <div style={{ background: 'rgba(5, 9, 8, 0.75)', padding: '3px', borderRadius: '11px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '2px' }}>
                    {[
                      { id: 'mifflin', label: 'Mifflin' },
                      { id: 'harris', label: 'Harris' },
                      { id: 'katch', label: 'Katch' }
                    ].map((eq) => (
                      <button
                        key={eq.id}
                        type="button"
                        onClick={() => handleSwitchClientFormula(eq.id)}
                        style={{
                          padding: '5px 8px',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '10.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          background: activeFormula === eq.id ? '#10b981' : 'transparent',
                          color: activeFormula === eq.id ? '#fff' : '#94a3b8'
                        }}
                      >
                        {eq.label}
                      </button>
                    ))}
                  </div>

                  <select
                    value={activeCalorieDelta}
                    onChange={(e) => handleChangeCalorieDelta(e.target.value)}
                    title="Θερμιδικός Στόχος επί του TDEE"
                    style={{
                      background: 'rgba(5, 9, 8, 0.85)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      color: '#fbbf24',
                      borderRadius: '10px',
                      padding: '6px 9px',
                      fontSize: '11px',
                      fontWeight: '800',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {CALORIE_DELTAS.map((d) => (
                      <option key={d.value} value={d.value} style={{ background: '#0b1210' }}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '6px 10px', borderRadius: '11px', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700' }}>TDEE</div>
                  <div className="font-mono-num" style={{ fontSize: '13.5px', fontWeight: '800', color: '#e2e8f0' }}>{activeTdee}</div>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.14)', padding: '6px 10px', borderRadius: '11px', border: '1px solid rgba(16, 185, 129, 0.4)', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#6ee7b7', fontWeight: '700' }}>ΣΤΟΧΟΣ</div>
                  <div className="font-mono-num" style={{ fontSize: '13.5px', fontWeight: '800', color: '#34d399' }}>{activeTargetKcal} kcal</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* TAB 1: ΣΧΕΔΙΑΣΜΟΣ ΠΛΑΝΟΥ / TELEMETRY / MOBILE APP SLIDES          */}
        {/* ================================================================= */}
        {activeTab === 'plan' && activeClientObj && (
          <>
            {!isAdmin && (
              <section className="luxury-card" style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div style={{ background: 'rgba(5,9,8,0.75)', padding: '13px 15px', borderRadius: '14px', border: '1px solid rgba(16,185,129,0.28)' }}>
                  <div style={{ fontSize: '10.5px', color: '#6ee7b7', fontWeight: '800' }}>ΣΥΜΜΟΡΦΩΣΗ ({selectedDay})</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '4px 0' }}>
                    <span className="font-mono-num" style={{ fontSize: '24px', fontWeight: '800', color: '#34d399' }}>{dayAdherence.pct}%</span>
                    <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>({dayAdherence.done}/{dayAdherence.total} γεύματα)</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${dayAdherence.pct}%`, height: '100%', background: '#10b981', transition: 'width 0.3s ease' }} />
                  </div>
                </div>

                <div style={{ background: 'rgba(5,9,8,0.75)', padding: '13px 15px', borderRadius: '14px', border: '1px solid rgba(56,189,248,0.28)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '10.5px', color: '#7dd3fc', fontWeight: '800' }}>ΕΝΥΔΑΤΩΣΗ ({selectedDay})</div>
                    <div className="font-mono-num" style={{ fontSize: '21px', fontWeight: '800', color: '#38bdf8', margin: '3px 0' }}>
                      {todayWaterGlasses * 250} ml
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>{todayWaterGlasses} ποτήρια (250ml)</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => adjustWaterGlass(-1)}
                      style={{ width: '34px', height: '34px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '18px', fontWeight: '800', cursor: 'pointer' }}
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustWaterGlass(1)}
                      style={{ width: '34px', height: '34px', borderRadius: '10px', border: 'none', background: '#0284c7', color: '#fff', fontSize: '18px', fontWeight: '800', cursor: 'pointer' }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* TELEMETRY (2 CLEAN ZONES: CORE MACROS/WATER + FDA MICROS) */}
            <section className="luxury-card" style={{ padding: '18px 20px', display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '800' }}>🔬 Διατροφική Τηλεμετρία</span>
                  <span style={{ fontSize: '11px', background: 'rgba(16,185,129,0.16)', color: '#6ee7b7', padding: '2px 9px', borderRadius: '99px', fontWeight: '700' }}>
                    {selectedDay}
                  </span>
                </div>

                <div className="no-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '5px', overflowX: 'auto', maxWidth: '100%' }}>
                  {DAYS.map((day) => {
                    const isSel = selectedDay === day;
                    return (
                      <button
                        key={day}
                        type="button"
                        className="day-pill"
                        onClick={() => setSelectedDay(day)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '9px',
                          fontSize: '11px',
                          fontWeight: isSel ? '800' : '600',
                          border: isSel ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.08)',
                          background: isSel ? '#10b981' : 'rgba(255,255,255,0.04)',
                          color: isSel ? '#fff' : '#cbd5e1',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleExactFdaAnalysis}
                      disabled={fdaLoading}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '9px',
                        fontSize: '11px',
                        fontWeight: '800',
                        border: '1px solid rgba(245, 158, 11, 0.45)',
                        background: 'rgba(245, 158, 11, 0.16)',
                        color: '#fbbf24',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {fdaLoading ? '⏳...' : '✨ FDA AI'}
                    </button>
                  )}
                </div>
              </div>

              <WeeklyEnergySvgChart
                weeklyStats={weeklyStats}
                targetKcal={activeTargetKcal}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
              />

              {/* ZONE 1: 5 CORE METRICS */}
              <div className="telemetry-core-grid">
                <div style={{ background: 'rgba(5, 9, 8, 0.75)', padding: '11px 12px', borderRadius: '13px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '700' }}>ΘΕΡΜΙΔΕΣ</div>
                  <div className="font-mono-num" style={{ fontSize: '17px', fontWeight: '800', color: '#34d399', margin: '2px 0' }}>
                    {dayNutrition.kcal} <span style={{ fontSize: '10.5px' }}>kcal</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${kcalPct}%`, height: '100%', background: '#10b981' }} />
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '4px' }}>{kcalPct}% στόχου ({activeTargetKcal})</div>
                </div>

                <div style={{ background: 'rgba(5, 9, 8, 0.75)', padding: '11px 12px', borderRadius: '13px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '700' }}>ΠΡΩΤΕΪΝΗ</div>
                  <div className="font-mono-num" style={{ fontSize: '17px', fontWeight: '800', color: '#38bdf8', margin: '2px 0' }}>
                    {dayNutrition.protein} <span style={{ fontSize: '10.5px' }}>g</span>
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '5px' }}>{pPct}% • {proteinPerKg} g/kg</div>
                </div>

                <div style={{ background: 'rgba(5, 9, 8, 0.75)', padding: '11px 12px', borderRadius: '13px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '700' }}>ΥΔΑΤΑΝΘΡΑΚΕΣ</div>
                  <div className="font-mono-num" style={{ fontSize: '17px', fontWeight: '800', color: '#fbbf24', margin: '2px 0' }}>
                    {dayNutrition.carbs} <span style={{ fontSize: '10.5px' }}>g</span>
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '5px' }}>{cPct}% θερμίδων</div>
                </div>

                <div style={{ background: 'rgba(5, 9, 8, 0.75)', padding: '11px 12px', borderRadius: '13px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '700' }}>ΛΙΠΑΡΑ</div>
                  <div className="font-mono-num" style={{ fontSize: '17px', fontWeight: '800', color: '#f472b6', margin: '2px 0' }}>
                    {dayNutrition.fat} <span style={{ fontSize: '10.5px' }}>g</span>
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '5px' }}>{fPct}% θερμίδων</div>
                </div>

                <div style={{ background: 'rgba(5, 9, 8, 0.75)', padding: '11px 12px', borderRadius: '13px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '700' }}>ΣΥΝΟΛΙΚΟ ΝΕΡΟ</div>
                  <div className="font-mono-num" style={{ fontSize: '17px', fontWeight: '800', color: '#22d3ee', margin: '2px 0' }}>
                    {dayNutrition.totalWater} <span style={{ fontSize: '10.5px' }}>ml</span>
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b', marginTop: '5px' }}>
                    Τροφές {dayNutrition.foodWater} + {dayNutrition.drinkingWater}ml
                  </div>
                </div>
              </div>

              {/* ZONE 2: SELECTED FDA MICRONUTRIENTS */}
              {selectedMicros.length > 0 && (
                <div className="telemetry-micro-grid">
                  {FDA_MICROS.filter((m) => selectedMicros.includes(m.key)).map((m) => {
                    const val = dayNutrition.micros[m.key] ?? 0;
                    const pct = fdaPercent(val, m.dv);
                    return (
                      <div key={m.key} style={{ background: 'rgba(5, 9, 8, 0.75)', padding: '10px 12px', borderRadius: '13px', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ fontSize: '9.5px', color: m.color, fontWeight: '800' }}>{m.label}</div>
                        <div className="font-mono-num" style={{ fontSize: '16.5px', fontWeight: '800', color: '#fff', margin: '2px 0' }}>
                          {val} <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>{m.unit}</span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: m.color }} />
                        </div>
                        <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>
                          {pct}% FDA DV ({m.dv}{m.unit})
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {isAdmin && (
                <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: '700' }}>FDA Πελάτη:</span>
                  {FDA_MICROS.map((m) => {
                    const active = selectedMicros.includes(m.key);
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => toggleTrackedMicro(m.key)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '99px',
                          fontSize: '10px',
                          fontWeight: active ? '700' : '500',
                          background: active ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255,255,255,0.03)',
                          color: active ? '#6ee7b7' : '#64748b',
                          border: active ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(255,255,255,0.06)',
                          cursor: 'pointer'
                        }}
                      >
                        {active ? '✓ ' : '+ '}
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* WEEKLY MEAL PLANNER (DESKTOP MATRIX + MOBILE APP SLIDE CARDS) */}
            <section className="luxury-card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: '800' }}>
                    📅 Πρόγραμμα Διατροφής ({activeClientObj.name})
                  </h3>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    {isAdmin
                      ? 'Πατήστε οποιοδήποτε γεύμα για επεξεργασία, διαγραφή ή αποθήκευση.'
                      : 'Πατήστε ✓ σε κάθε γεύμα που ολοκληρώνετε μέσα στην ημέρα.'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={handleGenerateFullWeekAi}
                        disabled={aiFullWeekLoading}
                        style={{
                          padding: '7px 11px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, rgba(16,185,129,0.28), rgba(5,150,105,0.22))',
                          border: '1px solid rgba(52, 211, 153, 0.55)',
                          color: '#6ee7b7',
                          fontSize: '11px',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        {aiFullWeekLoading ? '⏳ Δημιουργία 7 Ημερών...' : '✨ Αυτόματο Πλάνο 7 Ημερών'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowTemplatesModal(true)}
                        style={{
                          padding: '7px 11px',
                          borderRadius: '10px',
                          background: 'rgba(245, 158, 11, 0.14)',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                          color: '#fbbf24',
                          fontSize: '11px',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        📋 Πρότυπα
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '3px 7px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>Copy {selectedDay.slice(0, 3)} →</span>
                        <select
                          value={cloneTargetDay}
                          onChange={(e) => setCloneTargetDay(e.target.value)}
                          style={{ background: 'transparent', border: 'none', color: '#34d399', fontWeight: '800', fontSize: '11px', outline: 'none' }}
                        >
                          {DAYS.filter((d) => d !== selectedDay).map((d) => (
                            <option key={d} value={d} style={{ background: '#0b1210' }}>{d}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleCloneDay}
                          style={{ padding: '3px 7px', borderRadius: '6px', border: 'none', background: '#10b981', color: '#fff', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}
                        >
                          OK
                        </button>
                      </div>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowShoppingModal(true)}
                    style={{
                      padding: '7px 11px',
                      borderRadius: '10px',
                      background: 'rgba(167, 139, 250, 0.15)',
                      border: '1px solid rgba(167, 139, 250, 0.45)',
                      color: '#ddd6fe',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    🛒 Λίστα
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleSendWeeklyPlanWhatsApp}
                      style={{
                        padding: '7px 11px',
                        borderRadius: '10px',
                        background: 'rgba(34, 197, 94, 0.16)',
                        border: '1px solid rgba(34, 197, 94, 0.45)',
                        color: '#86efac',
                        fontSize: '11px',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      📲 WhatsApp
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowPdfModal(true)}
                    style={{
                      padding: '7px 11px',
                      borderRadius: '10px',
                      background: 'rgba(56, 189, 248, 0.14)',
                      border: '1px solid rgba(56, 189, 248, 0.45)',
                      color: '#7dd3fc',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    👁️ PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    🖨️ Εκτύπωση
                  </button>
                </div>
              </div>

              {/* DESKTOP MATRIX */}
              <div className="desktop-matrix-view" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '1020px', borderCollapse: 'separate', borderSpacing: '6px', tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '11%', padding: '10px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: '800', letterSpacing: '0.06em' }}>
                        ΓΕΥΜΑ
                      </th>
                      {DAYS.map((day) => {
                        const isSelected = selectedDay === day;
                        return (
                          <th
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            style={{
                              width: '12.7%',
                              padding: '10px 8px',
                              borderRadius: '11px',
                              background: isSelected ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255,255,255,0.03)',
                              border: isSelected ? '1px solid rgba(52, 211, 153, 0.45)' : '1px solid rgba(255,255,255,0.05)',
                              color: isSelected ? '#6ee7b7' : '#cbd5e1',
                              fontSize: '11.5px',
                              fontWeight: '800',
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                              cursor: 'pointer'
                            }}
                          >
                            {day}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {MEAL_TYPES.map((m) => (
                      <tr key={m.key}>
                        <td
                          style={{
                            padding: '12px 10px',
                            borderRadius: '13px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            verticalAlign: 'top'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '99px', background: m.accent }} />
                            <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#f8fafc' }}>{m.label}</span>
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', fontWeight: '700' }}>{m.badge}</div>
                        </td>

                        {DAYS.map((day) => {
                          const cleanVal = cleanMealText(activeClientObj.meal_plan?.[day]?.[m.key] || '');
                          const isChecked = completedMeals[`${activeClientObj.id}_${day}_${m.key}`];
                          return (
                            <td
                              key={day}
                              className="meal-cell-card"
                              onClick={() => {
                                if (isAdmin) setEditingCell({ day, type: m.key, text: cleanVal });
                                else if (cleanVal) toggleMealComplete(day, m.key);
                              }}
                              style={{
                                padding: '12px',
                                borderRadius: '13px',
                                background: isChecked
                                  ? 'rgba(16, 185, 129, 0.14)'
                                  : cleanVal
                                  ? 'rgba(9, 15, 13, 0.85)'
                                  : 'rgba(255,255,255,0.015)',
                                border: isChecked
                                  ? '1px solid rgba(52, 211, 153, 0.5)'
                                  : cleanVal
                                  ? '1px solid rgba(255,255,255,0.08)'
                                  : '1px dashed rgba(255,255,255,0.08)',
                                verticalAlign: 'top',
                                fontSize: '12px',
                                lineHeight: '1.5',
                                color: cleanVal ? '#e2e8f0' : '#475569',
                                minHeight: '84px'
                              }}
                            >
                              {cleanVal ? (
                                <div>
                                  {!isAdmin && (
                                    <div style={{ fontSize: '10.5px', fontWeight: '800', color: isChecked ? '#34d399' : '#64748b', marginBottom: '4px' }}>
                                      {isChecked ? '✓ Ολοκληρώθηκε' : '○ Πατήστε για τσεκ'}
                                    </div>
                                  )}
                                  {cleanVal}
                                </div>
                              ) : isAdmin ? (
                                '+ Προσθήκη γεύματος'
                              ) : (
                                '—'
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE NATIVE APP SLIDES */}
              <div className="mobile-slides-view" style={{ gap: '10px', width: '100%', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const idx = DAYS.indexOf(selectedDay);
                      setSelectedDay(DAYS[(idx - 1 + DAYS.length) % DAYS.length]);
                    }}
                    style={{ padding: '7px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#e2e8f0', fontSize: '12px', fontWeight: '700' }}
                  >
                    ← Προηγ.
                  </button>
                  <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#34d399' }}>{selectedDay}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const idx = DAYS.indexOf(selectedDay);
                      setSelectedDay(DAYS[(idx + 1) % DAYS.length]);
                    }}
                    style={{ padding: '7px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#e2e8f0', fontSize: '12px', fontWeight: '700' }}
                  >
                    Επόμ. →
                  </button>
                </div>

                {MEAL_TYPES.map((m) => {
                  const cleanVal = cleanMealText(activeClientObj.meal_plan?.[selectedDay]?.[m.key] || '');
                  const isChecked = completedMeals[`${activeClientObj.id}_${selectedDay}_${m.key}`];
                  return (
                    <div
                      key={m.key}
                      onClick={() => {
                        if (isAdmin) setEditingCell({ day: selectedDay, type: m.key, text: cleanVal });
                        else if (cleanVal) toggleMealComplete(selectedDay, m.key);
                      }}
                      style={{
                        width: '100%',
                        minWidth: 0,
                        background: isChecked ? 'rgba(16, 185, 129, 0.14)' : 'rgba(5, 9, 8, 0.85)',
                        border: isChecked ? '1px solid rgba(52, 211, 153, 0.55)' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '15px',
                        padding: '13px 14px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <span style={{ width: '9px', height: '9px', borderRadius: '99px', background: m.accent }} />
                          <strong style={{ fontSize: '13.5px', color: '#fff' }}>{m.label}</strong>
                        </div>
                        <span style={{ fontSize: '10.5px', fontWeight: '800', color: isAdmin ? '#34d399' : isChecked ? '#34d399' : '#94a3b8' }}>
                          {isAdmin ? '✏️ Επεξεργασία' : isChecked ? '✓ Ολοκληρώθηκε' : '○ Τσεκ'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12.5px', lineHeight: '1.5', color: cleanVal ? '#e2e8f0' : '#64748b', wordBreak: 'break-word' }}>
                        {cleanVal || (isAdmin ? '+ Πατήστε για προσθήκη γεύματος' : 'Δεν έχει οριστεί γεύμα')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ADMIN STUDIO: AI MEAL GENERATOR + PERSONAL IDEAS VAULT */}
            {isAdmin && (
              <div className="studio-two-col">
                <section className="luxury-card" style={{ padding: '18px 20px' }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '15.5px', fontWeight: '800' }}>
                    ✨ AI Κλινικές Προτάσεις Γευμάτων
                  </h3>
                  <p style={{ margin: '0 0 11px 0', fontSize: '11.5px', color: '#94a3b8' }}>
                    3 καθαρές προτάσεις με γραμμάρια βασισμένες στον φάκελο.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <select className="luxury-input" value={aiDay} onChange={(e) => setAiDay(e.target.value)}>
                      {DAYS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <select className="luxury-input" value={aiMealType} onChange={(e) => setAiMealType(e.target.value)}>
                      {MEAL_TYPES.map((m) => (
                        <option key={m.key} value={m.key}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '7px' }}>
                    <input
                      className="luxury-input"
                      type="text"
                      value={aiCustomPrompt}
                      onChange={(e) => setAiCustomPrompt(e.target.value)}
                      placeholder="Οδηγία (π.χ. νηστίσιμο)..."
                    />
                    <button
                      type="button"
                      onClick={handleGenerateAiMeals}
                      disabled={aiLoading}
                      style={{
                        padding: '0 14px',
                        borderRadius: '11px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        border: 'none',
                        fontWeight: '800',
                        fontSize: '11.5px',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer'
                      }}
                    >
                      {aiLoading ? '⏳...' : '✨ 3 Προτάσεις'}
                    </button>
                  </div>

                  {aiOptions.length > 0 && (
                    <div style={{ marginTop: '11px', display: 'grid', gap: '8px' }}>
                      {aiOptions.map((opt, idx) => (
                        <div key={idx} style={{ background: 'rgba(5, 9, 8, 0.85)', padding: '11px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '6px' }}>
                            <strong style={{ fontSize: '12px', color: '#34d399' }}>{opt.title}</strong>
                            <span className="font-mono-num" style={{ fontSize: '10.5px', color: '#fbbf24', flexShrink: 0 }}>
                              {opt.kcal} kcal • P:{opt.protein}g
                            </span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#e2e8f0', lineHeight: '1.45', marginBottom: '8px' }}>
                            {cleanMealText(opt.meal)}
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleSelectMealOption(aiDay, aiMealType, opt.meal)}
                              style={{ padding: '6px 10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '10.5px', fontWeight: '800', cursor: 'pointer' }}
                            >
                              + Εισαγωγή ({aiDay.slice(0, 3)})
                            </button>
                            <button
                              type="button"
                              onClick={() => saveIdeaToLibrary(opt.meal, aiMealType)}
                              style={{ padding: '6px 9px', background: 'rgba(245, 158, 11, 0.16)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '8px', fontSize: '10.5px', fontWeight: '700', cursor: 'pointer' }}
                            >
                              ⭐ Ιδέες
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="luxury-card" style={{ padding: '18px 20px' }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '15.5px', fontWeight: '800' }}>
                    ⭐ Βιβλιοθήκη Ιδεών Γευμάτων
                  </h3>
                  <p style={{ margin: '0 0 10px 0', fontSize: '11.5px', color: '#94a3b8' }}>
                    Εισαγωγή με 1 κλικ στο {aiDay} • {aiMealType}.
                  </p>

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '9px', flexWrap: 'wrap' }}>
                    <input
                      className="luxury-input"
                      style={{ flex: 1, minWidth: '130px' }}
                      type="text"
                      value={customIdeaText}
                      onChange={(e) => setCustomIdeaText(e.target.value)}
                      placeholder="Νέα ιδέα με γραμμάρια..."
                    />
                    <select
                      className="luxury-input"
                      style={{ width: '110px' }}
                      value={customIdeaCategory}
                      onChange={(e) => setCustomIdeaCategory(e.target.value)}
                    >
                      <option value="Πρωινό">Πρωινό</option>
                      <option value="Σνακ">Σνακ</option>
                      <option value="Μεσημεριανό">Μεσημεριανό</option>
                      <option value="Βραδινό">Βραδινό</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (!customIdeaText.trim()) return;
                        saveIdeaToLibrary(customIdeaText, customIdeaCategory);
                        setCustomIdeaText('');
                      }}
                      style={{ padding: '8px 12px', borderRadius: '10px', background: '#f59e0b', color: '#050807', border: 'none', fontWeight: '800', fontSize: '11.5px', cursor: 'pointer' }}
                    >
                      + Save
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '5px', marginBottom: '9px', flexWrap: 'wrap' }}>
                    {['Όλα', 'Πρωινό', 'Σνακ', 'Μεσημεριανό', 'Βραδινό'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setIdeaFilter(cat)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '99px',
                          fontSize: '10px',
                          fontWeight: '700',
                          border: 'none',
                          cursor: 'pointer',
                          background: ideaFilter === cat ? '#34d399' : 'rgba(255,255,255,0.06)',
                          color: ideaFilter === cat ? '#050807' : '#94a3b8'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'grid', gap: '7px' }}>
                    {savedIdeas
                      .filter((i) => ideaFilter === 'Όλα' || i.category === ideaFilter)
                      .map((idea) => (
                        <div key={idea.id} style={{ background: 'rgba(5,9,8,0.75)', padding: '9px 10px', borderRadius: '11px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '7px' }}>
                          <div style={{ fontSize: '11.5px', color: '#e2e8f0', lineHeight: '1.4', minWidth: 0 }}>
                            <span style={{ fontSize: '9.5px', color: '#fbbf24', fontWeight: '800', marginRight: '5px' }}>[{idea.category}]</span>
                            {idea.text}
                          </div>
                          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => handleSelectMealOption(aiDay, aiMealType, idea.text)}
                              style={{ padding: '5px 7px', background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '7px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}
                            >
                              + {aiDay.slice(0, 3)}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSavedIdea(idea.id)}
                              style={{ padding: '5px 7px', background: 'rgba(239, 68, 68, 0.14)', color: '#fca5a5', border: 'none', borderRadius: '7px', fontSize: '10px', cursor: 'pointer' }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </section>
              </div>
            )}
          </>
        )}

        {/* ================================================================= */}
        {/* TAB 2: ΠΕΛΑΤΕΣ                                                    */}
        {/* ================================================================= */}
        {activeTab === 'clients' && isAdmin && (
          <section className="luxury-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17.5px', fontWeight: '800' }}>👥 Μητρώο Πελατών ({clients.length})</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#94a3b8' }}>Αναζητήστε ή δημιουργήστε νέο κλινικό φάκελο.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%', maxWidth: '380px' }}>
                <input
                  className="luxury-input"
                  style={{ flex: 1 }}
                  placeholder="🔍 Αναζήτηση πελάτη..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(!showNewClientForm)}
                  style={{ padding: '10px 14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '11px', fontWeight: '800', fontSize: '12px', whiteSpace: 'nowrap', cursor: 'pointer' }}
                >
                  {showNewClientForm ? '✕' : '+ Νέος'}
                </button>
              </div>
            </div>

            {showNewClientForm && (
              <form
                onSubmit={handleCreateClient}
                style={{
                  background: 'rgba(5,9,8,0.82)',
                  padding: '15px',
                  borderRadius: '14px',
                  border: '1px solid rgba(16,185,129,0.35)',
                  marginBottom: '16px',
                  display: 'grid',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '9px' }}>
                  <div>
                    <label className="field-label" htmlFor="nc-name">Ονοματεπώνυμο *</label>
                    <input id="nc-name" className="luxury-input" required placeholder="π.χ. Μαρία Παπαδοπούλου" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="nc-email">Email</label>
                    <input id="nc-email" className="luxury-input" type="email" placeholder="name@example.com" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="nc-phone">Τηλέφωνο</label>
                    <input id="nc-phone" className="luxury-input" type="tel" placeholder="69…" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="nc-gender">Φύλο</label>
                    <select id="nc-gender" className="luxury-input" value={newClientGender} onChange={(e) => setNewClientGender(e.target.value)}>
                      <option value="female">Γυναίκα</option>
                      <option value="male">Άνδρας</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="nc-age">Ηλικία</label>
                    <input id="nc-age" className="luxury-input" type="number" min={5} max={115} value={newClientAge} onChange={(e) => setNewClientAge(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="nc-weight">Βάρος (kg)</label>
                    <input id="nc-weight" className="luxury-input" type="number" min={25} max={350} step="0.1" value={newClientWeight} onChange={(e) => setNewClientWeight(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="nc-height">Ύψος (cm)</label>
                    <input id="nc-height" className="luxury-input" type="number" min={90} max={240} value={newClientHeight} onChange={(e) => setNewClientHeight(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="nc-goal">Στόχος</label>
                    <input id="nc-goal" className="luxury-input" placeholder="π.χ. Απώλεια λίπους" value={newClientGoal} onChange={(e) => setNewClientGoal(e.target.value)} />
                  </div>
                </div>
                <GdprConsentFields
                  gdprAccepted={newClientGdpr}
                  setGdprAccepted={setNewClientGdpr}
                  art9Accepted={newClientArt9}
                  setArt9Accepted={setNewClientArt9}
                  termsAccepted={newClientTerms}
                  setTermsAccepted={setNewClientTerms}
                  onOpenLegal={setLegalDoc}
                />
                <button type="submit" className="btn-emerald" style={{ padding: '11px', cursor: 'pointer' }}>
                  ✓ Δημιουργία Φακέλου
                </button>
              </form>
            )}

            {clients.length === 0 && !showNewClientForm && (
              <EmptyState
                icon="👥"
                title="Κενό μητρώο πελατών"
                body="Ξεκινήστε με τον πρώτο κλινικό φάκελο — ανθρωπομετρικά, συγκαταθέσεις GDPR και στόχος σε ένα βήμα."
                actionLabel="+ Νέος Πελάτης"
                onAction={() => setShowNewClientForm(true)}
              />
            )}

            {clients.length > 0 && filteredClients.length === 0 && (
              <EmptyState
                icon="🔍"
                title="Κανένα αποτέλεσμα αναζήτησης"
                body={`Δεν βρέθηκε πελάτης για «${clientSearch.trim()}». Δοκιμάστε όνομα, email ή τηλέφωνο.`}
                actionLabel="Καθαρισμός φίλτρου"
                onAction={() => setClientSearch('')}
              />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '11px' }}>
              {filteredClients.map((c) => {
                const isCurrent = c.id === activeClientObj?.id;
                const met = calculateMetabolism({
                  gender: c.gender,
                  age: c.age,
                  weight: c.weight,
                  height: c.height,
                  activity: c.questionnaire?.activityLevel || 1.375
                });
                const f = c.questionnaire?.bmrFormula || 'mifflin';
                const target = (met[f]?.tdee || met.mifflin.tdee) + Number(c.questionnaire?.calorieDelta || 0);
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveClientId(c.id);
                      setActiveTab('plan');
                    }}
                    style={{
                      background: isCurrent ? 'rgba(16, 185, 129, 0.12)' : 'rgba(5, 9, 8, 0.75)',
                      border: isCurrent ? '1.5px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '14px',
                      padding: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <strong style={{ fontSize: '14.5px', color: '#fff' }}>{c.name}</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <span className="font-mono-num" style={{ fontSize: '11px', color: '#34d399', fontWeight: '800' }}>
                          {target} kcal
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClient(e, c)}
                          title="Διαγραφή Φακέλου"
                          style={{ background: 'rgba(239,68,68,0.14)', border: 'none', color: '#fca5a5', borderRadius: '7px', padding: '3px 6px', fontSize: '11px', cursor: 'pointer' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>
                      {c.gender === 'male' ? 'Άνδρας' : 'Γυναίκα'} • {c.age} ετών • {c.weight}kg • {c.height}cm
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1' }}>🎯 {c.goal || '—'}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#e2e8f0' }}>Εργαλεία Πρακτικής</h4>
                <span className="stub-chip">Μερικά live · μερικά stub</span>
              </div>
              <p style={{ margin: '0 0 10px 0', fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.5 }}>
                SOAP notes, πακέτα/πληρωμές και 1-click υπενθυμίσεις είναι live στον φάκελο πελάτη και στα ραντεβού. Τα παρακάτω παραμένουν stubs χωρίς ψεύτικο backend.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '9px' }}>
                {PRACTICE_STUBS.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      padding: '12px 13px',
                      borderRadius: '12px',
                      background: 'rgba(5,9,8,0.65)',
                      border: '1px dashed rgba(148,163,184,0.28)',
                      opacity: 0.92
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '12px', color: '#cbd5e1' }}>{s.title}</strong>
                      <span className="stub-chip">N/A</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.45 }}>{s.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* TAB 3: ΦΑΚΕΛΟΣ ΠΕΛΑΤΗ                                             */}
        {/* ================================================================= */}
        {activeTab === 'profile' && activeClientObj && (
          <section className="luxury-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17.5px', fontWeight: '800' }}>📂 Κλινικός Φάκελος — {activeClientObj.name}</h3>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '3px' }}>
                  Εξίσωση:{' '}
                  <strong style={{ color: '#34d399' }}>
                    {activeFormula === 'mifflin' ? 'Mifflin-St Jeor' : activeFormula === 'harris' ? 'Harris-Benedict' : 'Katch-McArdle'}
                  </strong>{' '}
                  • Συντελεστής Άσκησης: <strong style={{ color: '#fbbf24' }}>{activeClientObj.questionnaire?.activityLevel || 1.375}</strong>
                </div>
              </div>
              {isAdmin && profileSubTab === 'overview' && (
                <button
                  type="button"
                  onClick={() => openClientEditModal(activeClientObj)}
                  style={{ padding: '9px 14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '11px', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}
                >
                  ✏️ Επεξεργασία Φακέλου
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }} role="tablist" aria-label="Ενότητες φακέλου">
              {[
                { id: 'overview', label: 'Επισκόπηση' },
                { id: 'soap', label: 'Ιστορικό & SOAP Notes' },
                { id: 'billing', label: 'Πακέτα & Πληρωμές' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={profileSubTab === tab.id}
                  className={`filter-chip ${profileSubTab === tab.id ? 'filter-chip--on' : 'filter-chip--off'}`}
                  onClick={() => setProfileSubTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {profileSubTab === 'overview' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '11px' }}>
                  {[
                    { title: 'Στοιχεία Επικοινωνίας', body: `Email: ${activeClientObj.email || '—'} • Τηλ: ${activeClientObj.phone || '—'}` },
                    { title: 'Ανθρωπομετρικά & Στόχος', body: `Ηλικία: ${activeClientObj.age} • Βάρος: ${activeClientObj.weight}kg • Ύψος: ${activeClientObj.height}cm • BMI: ${clientMetabolism.mifflin.bmi} • Ημερήσιος Στόχος: ${activeTargetKcal} kcal` },
                    { title: 'Υγεία & Αλλεργίες', body: `${(activeClientObj.questionnaire?.healthConditions || []).join(', ') || 'Κανένα αναφερόμενο'} ${activeClientObj.questionnaire?.healthOther || ''}` },
                    { title: 'Φάρμακα & Συμπληρώματα', body: `Φάρμακα: ${activeClientObj.questionnaire?.medications || '—'} | Συμπληρώματα: ${activeClientObj.questionnaire?.supplements || '—'}` },
                    { title: 'Γαστρεντερικό & Νερό', body: `Στομάχι: ${activeClientObj.questionnaire?.stomachBloating || '—'} | Νερό: ${activeClientObj.questionnaire?.waterIntake || '1.5 - 2 λίτρα'}` },
                    { title: 'Διατροφικές Προτιμήσεις', body: `Φρούτα: ${(activeClientObj.questionnaire?.preferredFruits || []).join(', ') || 'Όλα'} | Λαχανικά: ${(activeClientObj.questionnaire?.preferredVegetables || []).join(', ') || 'Όλα'}` }
                  ].map((box) => (
                    <div key={box.title} style={{ background: 'rgba(5,9,8,0.75)', padding: '14px', borderRadius: '13px', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ fontSize: '10.5px', color: '#34d399', fontWeight: '800', marginBottom: '5px', textTransform: 'uppercase' }}>{box.title}</div>
                      <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: '1.5' }}>{box.body}</div>
                    </div>
                  ))}
                </div>

                <GdprDataActions
                  client={activeClientObj}
                  appointments={appointments}
                  measurements={measurements}
                  onPermanentDelete={handlePermanentDeleteClient}
                  disabled={!isAdmin && String(activeClientObj.user_id || '') !== String(session?.user?.id || '')}
                />
              </>
            )}

            {profileSubTab === 'soap' && (
              <SoapNotesPanel client={activeClientObj} isAdmin={isAdmin} />
            )}

            {profileSubTab === 'billing' && (
              <BillingPackagesPanel client={activeClientObj} isAdmin={isAdmin} />
            )}
          </section>
        )}

        {/* ================================================================= */}
        {/* TAB 4: ΡΑΝΤΕΒΟΥ (FILTER + TYPED SESSION + WHATSAPP)                 */}
        {/* ================================================================= */}
        {activeTab === 'appointments' && (
          <section className="luxury-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '13px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17.5px', fontWeight: '800' }}>🗓️ Πρόγραμμα Συνεδριών & Ραντεβού</h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '11.5px', color: '#94a3b8' }}>
                  {visibleAppointments.length} συνολικά · φίλτρο: {apptFilter === 'upcoming' ? 'Επερχόμενα' : apptFilter === 'past' ? 'Παρελθόντα' : 'Όλα'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }} role="group" aria-label="Φίλτρο ραντεβού">
                {[
                  { id: 'upcoming', label: 'Επερχόμενα' },
                  { id: 'past', label: 'Παρελθόντα' },
                  { id: 'all', label: 'Όλα' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`filter-chip ${apptFilter === f.id ? 'filter-chip--on' : 'filter-chip--off'}`}
                    onClick={() => setApptFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {isAdmin && activeClientObj && (
              <form onSubmit={handleAddAppointment} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '9px', marginBottom: '16px', background: 'rgba(5,9,8,0.75)', padding: '13px', borderRadius: '13px' }}>
                <div>
                  <label className="field-label" htmlFor="appt-date">Ημερομηνία</label>
                  <input id="appt-date" className="luxury-input" type="date" value={apptDate} onChange={(e) => setApptDate(e.target.value)} required />
                </div>
                <div>
                  <label className="field-label" htmlFor="appt-time">Ώρα</label>
                  <input id="appt-time" className="luxury-input" type="time" value={apptTime} onChange={(e) => setApptTime(e.target.value)} required />
                </div>
                <div>
                  <label className="field-label" htmlFor="appt-type">Τύπος συνεδρίας</label>
                  <select id="appt-type" className="luxury-input" value={apptType} onChange={(e) => setApptType(e.target.value)}>
                    {APPOINTMENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="appt-notes">Σημειώσεις (προαιρετικά)</label>
                  <input id="appt-notes" className="luxury-input" type="text" value={apptNotes} onChange={(e) => setApptNotes(e.target.value)} placeholder="π.χ. επανέλεγχος μετρήσεων" />
                </div>
                <button type="submit" className="btn-emerald" style={{ padding: '11px', fontSize: '12px', cursor: 'pointer', alignSelf: 'end' }}>
                  + Κλείσιμο ({activeClientObj.name.split(' ')[0]})
                </button>
              </form>
            )}

            <div style={{ display: 'grid', gap: '9px' }}>
              {visibleAppointments.length === 0 ? (
                <EmptyState
                  glyph="◷"
                  title="Κανένα ραντεβού ακόμα"
                  hint={
                    isAdmin && activeClientObj
                      ? `Κλείστε την πρώτη συνεδρία για ${activeClientObj.name.split(' ')[0]} — ημερομηνία, ώρα και τύπος σε ένα βήμα.`
                      : 'Τα προγραμματισμένα ραντεβού θα εμφανιστούν εδώ.'
                  }
                />
              ) : filteredAppointments.length === 0 ? (
                <EmptyState
                  glyph="⌕"
                  title={apptFilter === 'upcoming' ? 'Δεν υπάρχουν επερχόμενα ραντεβού' : 'Δεν υπάρχουν παρελθόντα ραντεβού'}
                  hint="Αλλάξτε φίλτρο σε «Όλα» για ολόκληρο το ιστορικό συνεδριών."
                  actionLabel="Εμφάνιση όλων"
                  onAction={() => setApptFilter('all')}
                />
              ) : (
                filteredAppointments.map((a) => {
                  const cl = clients.find(
                    (c) =>
                      String(c.id) === String(a.client_id || a.client) ||
                      (c.name || '').trim().toLowerCase() === String(a.client_name || a.client || '').trim().toLowerCase()
                  );
                  const displayName = a.client_name || cl?.name || a.client || 'Συνεδρία Πελάτη';
                  const cleanPhone = (cl?.phone || '').replace(/\D/g, '');
                  const waPhone = cleanPhone.startsWith('69') ? `30${cleanPhone}` : cleanPhone;
                  const waMsg = encodeURIComponent(
                    `Καλησπέρα ${displayName}! Υπενθύμιση για το ραντεβού μας στο διαιτολογικό γραφείο της Χάρις Φωτούδη στις ${a.date} και ώρα ${a.time}.`
                  );
                  const now = new Date();
                  const today = now.toISOString().slice(0, 10);
                  const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                  const d = String(a.date || '');
                  const t = String(a.time || '00:00').slice(0, 5);
                  const isPastRow = d < today || (d === today && t < hm);
                  return (
                    <div key={a.id} style={{ background: 'rgba(5,9,8,0.75)', padding: '12px 14px', borderRadius: '13px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', opacity: isPastRow ? 0.78 : 1 }}>
                      <div>
                        <strong style={{ color: '#fff', fontSize: '13.5px' }}>{displayName}</strong>
                        <div style={{ fontSize: '11.5px', color: '#34d399', marginTop: '2px' }}>
                          📅 {a.date} • ⏰ {a.time} — <span style={{ color: '#94a3b8' }}>{a.notes || 'Συνεδρία'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                        {isAdmin && !isPastRow && (
                          <ReminderCopyButton
                            clientName={displayName}
                            date={a.date}
                            time={a.time}
                            sessionNotes={a.notes}
                          />
                        )}
                        {isAdmin && waPhone && !isPastRow && (
                          <a
                            href={`https://wa.me/${waPhone}?text=${waMsg}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: '5px 10px',
                              borderRadius: '99px',
                              background: 'rgba(34, 197, 94, 0.18)',
                              border: '1px solid rgba(34, 197, 94, 0.4)',
                              color: '#86efac',
                              fontSize: '10.5px',
                              fontWeight: '800',
                              textDecoration: 'none'
                            }}
                          >
                            💬 WhatsApp
                          </a>
                        )}
                        <span className={`status-badge ${isPastRow ? 'status-badge--info' : 'status-badge--success'}`}>
                          {isPastRow ? 'Ολοκληρωμένο' : (a.status || 'Προγραμματισμένο')}
                        </span>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAppointment(a.id)}
                            aria-label="Διαγραφή ραντεβού"
                            style={{ background: 'rgba(239,68,68,0.14)', border: 'none', color: '#fca5a5', borderRadius: '8px', padding: '5px 8px', fontSize: '11px', cursor: 'pointer' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* TAB 5: ΜΕΤΡΗΣΕΙΣ & SVG ΠΡΟΟΔΟΣ                                    */}
        {/* ================================================================= */}
        {activeTab === 'measurements' && activeClientObj && (
          <section className="luxury-card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 13px 0', fontSize: '17.5px', fontWeight: '800' }}>📏 Ανθρωπομετρικές Μετρήσεις & Πρόοδος ({activeClientObj.name})</h3>

            <BodyProgressSvgChart data={clientMeasurements} />

            {isAdmin && (
              <form onSubmit={handleAddMeasurement} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '9px', marginBottom: '16px', background: 'rgba(5,9,8,0.75)', padding: '13px', borderRadius: '13px' }}>
                <input className="luxury-input" type="number" step="0.1" required placeholder="Βάρος (kg) *" value={measWeight} onChange={(e) => setMeasWeight(e.target.value)} />
                <input className="luxury-input" type="number" step="0.1" placeholder="Λίπος (%)" value={measFat} onChange={(e) => setMeasFat(e.target.value)} />
                <input className="luxury-input" type="number" step="0.1" placeholder="Μυϊκή Μάζα (kg)" value={measMuscle} onChange={(e) => setMeasMuscle(e.target.value)} />
                <input className="luxury-input" type="number" step="0.5" placeholder="Μέση (cm)" value={measWaist} onChange={(e) => setMeasWaist(e.target.value)} />
                <button type="submit" style={{ padding: '11px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '11px', fontWeight: '800', fontSize: '12px', cursor: 'pointer' }}>
                  + Καταγραφή
                </button>
              </form>
            )}

            <div style={{ display: 'grid', gap: '9px' }}>
              {clientMeasurements.length === 0 ? (
                <EmptyState
                  icon="▣"
                  title="Καμία μέτρηση ακόμα"
                  body={
                    isAdmin
                      ? 'Καταγράψτε βάρος και ανθρωπομετρικά για να ξεκινήσει η καμπύλη προόδου.'
                      : 'Οι μετρήσεις θα εμφανιστούν εδώ μόλις καταχωρηθούν από τη διατροφολόγο.'
                  }
                />
              ) : (
                clientMeasurements.map((m) => (
                  <div key={m.id} style={{ background: 'rgba(5,9,8,0.75)', padding: '12px 14px', borderRadius: '13px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span className="font-mono-num" style={{ fontSize: '11.5px', color: '#94a3b8' }}>📅 {m.date}</span>
                    <div className="font-mono-num" style={{ display: 'flex', gap: '14px', fontSize: '12.5px', fontWeight: '800' }}>
                      <span style={{ color: '#34d399' }}>Βάρος: {m.weight} kg</span>
                      {m.body_fat != null && <span style={{ color: '#fbbf24' }}>Λίπος: {m.body_fat}%</span>}
                      {m.muscle_mass != null && <span style={{ color: '#38bdf8' }}>Μυϊκή: {m.muscle_mass} kg</span>}
                      {m.waist != null && <span style={{ color: '#f472b6' }}>Μέση: {m.waist} cm</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* TAB 6: ΥΠΟΛΟΓΙΣΤΗΣ BMR / TDEE                                     */}
        {/* ================================================================= */}
        {activeTab === 'calculator' && (
          <section className="luxury-card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '17.5px', fontWeight: '800' }}>⚡ Μεταβολικός Υπολογιστής (Mifflin, Harris & Katch-McArdle)</h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '11.5px', color: '#94a3b8' }}>
              Συγκρίνετε τις 3 εξισώσεις και εφαρμόστε την επιθυμητή στον φάκελο του πελάτη με 1 κλικ.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '9px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Φύλο</label>
                <select className="luxury-input" value={calcGender} onChange={(e) => setCalcGender(e.target.value)}>
                  <option value="female">Γυναίκα</option>
                  <option value="male">Άνδρας</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Ηλικία</label>
                <input className="luxury-input" type="number" value={calcAge} onChange={(e) => setCalcAge(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Βάρος (kg)</label>
                <input className="luxury-input" type="number" step="0.1" value={calcWeight} onChange={(e) => setCalcWeight(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Ύψος (cm)</label>
                <input className="luxury-input" type="number" value={calcHeight} onChange={(e) => setCalcHeight(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>% Λίπος (Katch)</label>
                <input className="luxury-input" type="number" step="0.1" placeholder="π.χ. 22" value={calcBodyFat} onChange={(e) => setCalcBodyFat(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Δραστηριότητα</label>
                <select className="luxury-input" style={{ fontSize: '12.5px' }} value={calcActivity} onChange={(e) => setCalcActivity(parseFloat(e.target.value))}>
                  {ACTIVITY_FACTORS.map((af) => (
                    <option key={af.value} value={af.value}>{af.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px' }}>
              {[
                { key: 'mifflin', title: 'Mifflin-St Jeor (Κλινικό)', accent: '#34d399', data: calcResult.mifflin },
                { key: 'harris', title: 'Harris-Benedict (Revised)', accent: '#fbbf24', data: calcResult.harris },
                { key: 'katch', title: `Katch-McArdle (LBM ${calcResult.katch.lbm}kg)`, accent: '#38bdf8', data: calcResult.katch }
              ].map((eq) => (
                <div
                  key={eq.key}
                  style={{
                    background: 'rgba(5, 9, 8, 0.85)',
                    padding: '16px',
                    borderRadius: '15px',
                    border: activeFormula === eq.key ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: eq.accent }}>{eq.title}</span>
                    {activeFormula === eq.key && (
                      <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', padding: '2px 8px', borderRadius: '99px', fontWeight: '700' }}>
                        Ενεργή
                      </span>
                    )}
                  </div>

                  <div className="font-mono-num" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '7px', textAlign: 'center', marginBottom: '10px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '9px 4px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>BMR</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{eq.data.bmr}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '9px 4px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>TDEE</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#fbbf24' }}>{eq.data.tdee}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '9px 4px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>BMI</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#38bdf8' }}>{eq.data.bmi}</div>
                    </div>
                  </div>

                  {isAdmin && activeClientObj && (
                    <button
                      type="button"
                      onClick={() => handleSwitchClientFormula(eq.key)}
                      style={{
                        width: '100%',
                        padding: '9px',
                        borderRadius: '10px',
                        border: activeFormula === eq.key ? '1px solid #10b981' : 'none',
                        background: activeFormula === eq.key ? 'rgba(16, 185, 129, 0.18)' : '#10b981',
                        color: activeFormula === eq.key ? '#6ee7b7' : '#fff',
                        fontWeight: '800',
                        fontSize: '11.5px',
                        cursor: 'pointer'
                      }}
                    >
                      {activeFormula === eq.key
                        ? `✓ Ενεργή για ${activeClientObj.name}`
                        : `Εφαρμογή στον/στην ${activeClientObj.name}`}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* FULL-SCREEN PDF PRINT STUDIO MODAL */}
      {showPdfModal && activeClientObj && (
        <div
          className="glass-modal-backdrop no-print"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 400,
            overflowY: 'auto',
            padding: '14px'
          }}
        >
          <div style={{ maxWidth: '1320px', margin: '0 auto', animation: 'fadeInSlide 0.2s ease' }}>
            <div
              className="no-print luxury-card"
              style={{
                padding: '13px 16px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '14.5px', fontWeight: '800' }}>📄 Προεπισκόπηση PDF</span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setPdfTheme('green')}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '9px',
                    border: 'none',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    background: pdfTheme === 'green' ? '#10b981' : 'rgba(255,255,255,0.08)',
                    color: '#fff'
                  }}
                >
                  🌿 Πράσινο
                </button>
                <button
                  type="button"
                  onClick={() => setPdfTheme('blue')}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '9px',
                    border: 'none',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    background: pdfTheme === 'blue' ? '#0284c7' : 'rgba(255,255,255,0.08)',
                    color: '#fff'
                  }}
                >
                  🌊 Μπλε
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '9px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  🖨️ Εκτύπωση / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowPdfModal(false)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '9px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#e2e8f0',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <PrintableExcelSheet
              id="printable-excel-sheet-modal"
              theme={pdfTheme}
              clientObj={activeClientObj}
              mealPlan={activeClientObj.meal_plan || {}}
            />
          </div>
        </div>
      )}

      {/* MODAL: ΕΒΔΟΜΑΔΙΑΙΑ ΠΡΟΤΥΠΑ ΔΙΑΙΤΟΛΟΓΙΩΝ */}
      {showTemplatesModal && isAdmin && activeClientObj && (
        <div
          className="no-print glass-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,

            zIndex: 365,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px'
          }}
        >
          <div className="luxury-card" style={{ width: '100%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto', padding: '20px', animation: 'fadeInSlide 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: '800' }}>📋 Πρότυπα Εβδομαδιαίων Πλάνων</h3>
                <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>Αποθηκεύστε ή εφαρμόστε έτοιμα πρωτόκολλα 7 ημερών</div>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplatesModal(false)}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#cbd5e1', width: '32px', height: '32px', borderRadius: '9px', cursor: 'pointer', fontWeight: '800' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCurrentWeekAsTemplate} style={{ display: 'flex', gap: '7px', marginBottom: '14px' }}>
              <input
                className="luxury-input"
                placeholder="Όνομα νέου προτύπου..."
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                required
              />
              <button
                type="submit"
                style={{ padding: '0 13px', borderRadius: '11px', background: '#f59e0b', color: '#050807', border: 'none', fontWeight: '800', fontSize: '11.5px', whiteSpace: 'nowrap', cursor: 'pointer' }}
              >
                + Save Τρέχον
              </button>
            </form>

            <div style={{ display: 'grid', gap: '8px' }}>
              {weekTemplates.map((tpl) => (
                <div key={tpl.id} style={{ background: 'rgba(5,9,8,0.8)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '12.5px', color: '#f8fafc' }}>{tpl.name}</strong>
                  <button
                    type="button"
                    onClick={() => handleApplyWeekTemplate(tpl)}
                    style={{ padding: '6px 11px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', flexShrink: 0 }}
                  >
                    Εφαρμογή
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ΛΙΣΤΑ ΣΟΥΠΕΡ ΜΑΡΚΕΤ */}
      {showShoppingModal && activeClientObj && (
        <div
          className="no-print glass-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,

            zIndex: 360,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px'
          }}
        >
          <div className="luxury-card" style={{ width: '100%', maxWidth: '540px', maxHeight: '85vh', overflowY: 'auto', padding: '20px', animation: 'fadeInSlide 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: '800' }}>🛒 Λίστα Σούπερ Μάρκετ</h3>
                <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>Αυτόματη εξαγωγή από το εβδομαδιαίο πλάνο</div>
              </div>
              <button
                type="button"
                onClick={() => setShowShoppingModal(false)}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#cbd5e1', width: '32px', height: '32px', borderRadius: '9px', cursor: 'pointer', fontWeight: '800' }}
              >
                ✕
              </button>
            </div>

            {shoppingList.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '13px' }}>Προσθέστε πρώτα γεύματα στο εβδομαδιαίο πρόγραμμα.</div>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {shoppingList.map((grp) => (
                  <div key={grp.category} style={{ background: 'rgba(5,9,8,0.75)', padding: '11px 13px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#34d399', marginBottom: '4px' }}>{grp.category}</div>
                    <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: '1.5' }}>{grp.items.join(' • ')}</div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const txt =
                      `🛒 Λίστα Αγορών Εβδομάδας (${activeClientObj.name}) — Χάρις Φωτούδη\n\n` +
                      shoppingList.map((g) => `${g.category}:\n- ${g.items.join('\n- ')}`).join('\n\n');
                    navigator.clipboard.writeText(txt);
                    showToast('✓ Η λίστα αντιγράφηκε!');
                  }}
                  style={{ padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '11px', fontWeight: '800', fontSize: '12.5px', cursor: 'pointer' }}
                >
                  📋 Αντιγραφή Λίστας (για WhatsApp / Viber)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ΕΠΕΞΕΡΓΑΣΙΑ ΚΕΛΙΟΥ ΓΕΥΜΑΤΟΣ */}
      {editingCell && isAdmin && (
        <div
          className="no-print glass-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,

            zIndex: 350,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px'
          }}
        >
          <div className="luxury-card" style={{ width: '100%', maxWidth: '460px', padding: '20px', animation: 'fadeInSlide 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#34d399', fontWeight: '800', textTransform: 'uppercase' }}>{editingCell.day}</div>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '17px', fontWeight: '800' }}>{editingCell.type}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#cbd5e1', width: '32px', height: '32px', borderRadius: '9px', cursor: 'pointer', fontWeight: '800' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualCellEdit} style={{ display: 'grid', gap: '11px' }}>
              <textarea
                className="luxury-input"
                rows={4}
                value={editingCell.text}
                onChange={(e) => setEditingCell({ ...editingCell, text: e.target.value })}
                placeholder="π.χ. 150γρ κοτόπουλο ψητό, 150γρ ρύζι μπασμάτι & πράσινη σαλάτα"
                style={{ resize: 'vertical', lineHeight: '1.5' }}
              />
              <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  style={{ flex: 1, minWidth: '120px', padding: '11px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '11px', fontWeight: '800', fontSize: '12.5px', cursor: 'pointer' }}
                >
                  ✓ Αποθήκευση
                </button>
                {editingCell.text.trim() && (
                  <button
                    type="button"
                    onClick={() => saveIdeaToLibrary(editingCell.text, editingCell.type)}
                    style={{ padding: '11px 12px', background: 'rgba(245, 158, 11, 0.16)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '11px', fontWeight: '700', fontSize: '11.5px', cursor: 'pointer' }}
                  >
                    ⭐ Ιδέες
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    await handleSelectMealOption(editingCell.day, editingCell.type, '');
                    setEditingCell(null);
                  }}
                  style={{ padding: '11px 12px', background: 'rgba(239, 68, 68, 0.16)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '11px', fontWeight: '700', fontSize: '11.5px', cursor: 'pointer' }}
                >
                  🗑️
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ΠΛΗΡΗΣ ΕΠΕΞΕΡΓΑΣΙΑ ΦΑΚΕΛΟΥ ΠΕΛΑΤΗ */}
      {editingClient && isAdmin && (
        <div
          className="no-print glass-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,

            zIndex: 350,
            overflowY: 'auto',
            padding: '16px 12px'
          }}
        >
          <div className="luxury-card" style={{ maxWidth: '720px', margin: '0 auto', padding: '20px', animation: 'fadeInSlide 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800' }}>✏️ Επεξεργασία Φακέλου — {editingClient.name}</h3>
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#cbd5e1', width: '32px', height: '32px', borderRadius: '9px', cursor: 'pointer', fontWeight: '800' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveClientEdit} style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Ονοματεπώνυμο</label>
                  <input className="luxury-input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Τηλέφωνο</label>
                  <input className="luxury-input" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Φύλο</label>
                  <select className="luxury-input" value={editGender} onChange={(e) => setEditGender(e.target.value)}>
                    <option value="female">Γυναίκα</option>
                    <option value="male">Άνδρας</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Ηλικία</label>
                  <input className="luxury-input" type="number" value={editAge} onChange={(e) => setEditAge(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Βάρος (kg)</label>
                  <input className="luxury-input" type="number" step="0.1" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Ύψος (cm)</label>
                  <input className="luxury-input" type="number" value={editHeight} onChange={(e) => setEditHeight(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Στόχος</label>
                  <input className="luxury-input" value={editGoal} onChange={(e) => setEditGoal(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Επίπεδο Δραστηριότητας</label>
                  <select className="luxury-input" value={editQ.activityLevel || 1.375} onChange={(e) => setEditQ({ ...editQ, activityLevel: parseFloat(e.target.value) })}>
                    {ACTIVITY_FACTORS.map((af) => (
                      <option key={af.value} value={af.value}>{af.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Εξίσωση BMR</label>
                  <select className="luxury-input" value={editQ.bmrFormula || 'mifflin'} onChange={(e) => setEditQ({ ...editQ, bmrFormula: e.target.value })}>
                    <option value="mifflin">Mifflin-St Jeor</option>
                    <option value="harris">Harris-Benedict</option>
                    <option value="katch">Katch-McArdle</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Θερμιδικό Δέλτα</label>
                  <select className="luxury-input" value={editQ.calorieDelta || 0} onChange={(e) => setEditQ({ ...editQ, calorieDelta: Number(e.target.value) })}>
                    {CALORIE_DELTAS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Πόσιμο Νερό</label>
                  <select className="luxury-input" value={editQ.waterIntake || '1.5 - 2 λίτρα'} onChange={(e) => setEditQ({ ...editQ, waterIntake: e.target.value })}>
                    <option value="Λιγότερο από 1 λίτρο">&lt; 1 λίτρο</option>
                    <option value="1 - 1.5 λίτρα">1 - 1.5 λίτρα</option>
                    <option value="1.5 - 2 λίτρα">1.5 - 2 λίτρα</option>
                    <option value="Πάνω από 2.5 λίτρα">2.5+ λίτρα</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '5px' }}>Προβλήματα Υγείας / Αλλεργίες</label>
                <MultiChipGroup
                  options={['Θυρεοειδής', 'Χοληστερίνη', 'Αναιμία / Σίδηρος', 'Πίεση', 'Ουρικό Οξύ', 'Χολή', 'Καρδιά', 'Αλλεργίες / Δυσανεξίες']}
                  values={editQ.healthConditions}
                  onToggle={(v) => toggleEditArrayItem('healthConditions', v)}
                />
                <input
                  className="luxury-input"
                  style={{ marginTop: '7px' }}
                  placeholder="Επιπλέον κλινικές σημειώσεις / γαστρεντερικά..."
                  value={editQ.healthOther || ''}
                  onChange={(e) => setEditQ({ ...editQ, healthOther: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Φάρμακα</label>
                  <input className="luxury-input" value={editQ.medications || ''} onChange={(e) => setEditQ({ ...editQ, medications: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>Συμπληρώματα</label>
                  <input className="luxury-input" value={editQ.supplements || ''} onChange={(e) => setEditQ({ ...editQ, supplements: e.target.value })} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', color: '#94a3b8', marginBottom: '5px' }}>Προτιμήσεις Φρούτων & Λαχανικών</label>
                <MultiChipGroup
                  options={['Μήλο', 'Μπανάνα', 'Πορτοκάλι', 'Μύρτιλα/Φράουλες', 'Ακτινίδιο', 'Αβοκάντο', 'Μπρόκολο', 'Σπανάκι', 'Ντομάτα/Αγγούρι', 'Γλυκοπατάτα']}
                  values={editQ.preferredFruits}
                  onToggle={(v) => toggleEditArrayItem('preferredFruits', v)}
                />
              </div>

              <div style={{ display: 'flex', gap: '9px', marginTop: '4px' }}>
                <button type="button" onClick={() => setEditingClient(null)} style={{ padding: '11px 15px', background: 'rgba(255,255,255,0.07)', color: '#cbd5e1', border: 'none', borderRadius: '11px', fontWeight: '700', cursor: 'pointer' }}>
                  Ακύρωση
                </button>
                <button type="submit" style={{ flex: 1, padding: '11px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '11px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer' }}>
                  ✓ Αποθήκευση Αλλαγών
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GEMINI API KEY SETTINGS */}
      {showApiKeyModal && isAdmin && (
        <div
          className="no-print glass-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,

            zIndex: 350,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px'
          }}
        >
          <div className="luxury-card" style={{ width: '100%', maxWidth: '420px', padding: '22px', animation: 'fadeInSlide 0.2s ease' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: '800' }}>⚙️ Σύνδεση Gemini AI</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '14px' }}>
              Εισάγετε το Google Gemini API Key για αυτόματο πλάνο 7 ημερών, προτάσεις 3 γευμάτων και κλινική ανάλυση FDA.
            </p>
            <form onSubmit={handleSaveApiKey} style={{ display: 'grid', gap: '11px' }}>
              <input
                className="luxury-input"
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder={apiKey ? '•••••••••••••••••••• (Αποθηκευμένο)' : 'AIzaSy...'}
                required
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setShowApiKeyModal(false)} style={{ flex: 1, padding: '11px', background: 'rgba(255,255,255,0.07)', color: '#cbd5e1', border: 'none', borderRadius: '11px', fontWeight: '700', cursor: 'pointer' }}>
                  Κλείσιμο
                </button>
                <button type="submit" style={{ flex: 1, padding: '11px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '11px', fontWeight: '800', cursor: 'pointer' }}>
                  Αποθήκευση
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1460px', margin: '0 auto', padding: '0 14px 88px' }}>
        <MedicalFooter onOpenLegal={setLegalDoc} />
      </div>

      {legalDoc && <LegalModal docKey={legalDoc} onClose={() => setLegalDoc(null)} />}

      {toastMsg && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            bottom: '74px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #065f46, #0f766e)',
            color: '#ecfdf5',
            padding: '9px 18px',
            borderRadius: '99px',
            fontSize: '12px',
            fontWeight: '800',
            boxShadow: '0 14px 32px rgba(0,0,0,0.55)',
            border: '1px solid rgba(110, 231, 183, 0.45)',
            zIndex: 500,
            whiteSpace: 'nowrap',
            animation: 'fadeInSlide 0.2s ease'
          }}
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <NutriCharisPlatform />
    </ErrorBoundary>
  );
}
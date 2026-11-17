import { DAYS, MEAL_TYPES } from '../constants/dietPlan';
import { guardClientWrite } from '../lib/authAccess';
import { cleanMealText } from '../lib/mealText';
import { callMealAi, parseAiJson } from '../services/mealAi';
import { supabase } from '../supabaseClient';

export function useMealAi(deps) {
  const { activeClientObj, activeTargetKcal, aiCustomPrompt, aiDay, aiFullWeekLoading, aiLoading, aiMealType, fdaLoading, isAdmin, selectedDay, setAiFullWeekLoading, setAiLoading, setAiOptions, setClients, setFdaAiOverride, setFdaLoading, showToast } = deps;
  // AI 3 Meal Options — server `/api/generate-meals` first, local key fallback
  const handleGenerateAiMeals = async () => {
    if (!activeClientObj) return;
    if (aiLoading) return;

    setAiLoading(true);
    setAiOptions([]);
    try {
      await guardClientWrite(activeClientObj, isAdmin);
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

      const rawText = await callMealAi(prompt);
      const parsed = parseAiJson(rawText, []);
      setAiOptions(Array.isArray(parsed) ? parsed : []);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        showToast('⚠️ Δεν ελήφθησαν έγκυρες προτάσεις AI. Δοκιμάστε ξανά.');
      }
    } catch (err) {
      showToast(`⚠️ ${err?.message || 'Η υπηρεσία AI δεν είναι διαθέσιμη.'}`);
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
      await guardClientWrite(activeClientObj, isAdmin);
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

      const rawText = await callMealAi(prompt);
      const parsed = parseAiJson(rawText, {});

      const cleanedWeek = {};
      DAYS.forEach((d) => {
        cleanedWeek[d] = {};
        MEAL_TYPES.forEach((m) => {
          cleanedWeek[d][m.key] = cleanMealText(parsed?.[d]?.[m.key] || '');
        });
      });

      await guardClientWrite(activeClientObj, isAdmin);
      const { error } = await supabase
        .from('clients')
        .update({ meal_plan: cleanedWeek })
        .eq('id', Number(activeClientObj.id));
      if (error) throw new Error(error.message);
      setClients((prev) =>
        prev.map((c) => (String(c.id) === String(activeClientObj.id) ? { ...c, meal_plan: cleanedWeek } : c))
      );
      showToast('✨ Το εβδομαδιαίο πλάνο 7 ημερών δημιουργήθηκε!');
    } catch (err) {
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
      await guardClientWrite(activeClientObj, isAdmin);
      const prompt = `Υπολόγισε με κλινική ακρίβεια USDA/FDA τα συνολικά ημερήσια θρεπτικά συστατικά για το παρακάτω διαιτολόγιο (${selectedDay}):
${summary}

Επίστρεψε ΑΠΟΚΛΕΙΣΤΙΚΑ έγκυρο JSON:
{"kcal":1650,"protein":105,"carbs":145,"fat":58,"micros":{"potassium":3100,"iron":13.5,"calcium":920,"fiber":25.4,"magnesium":340,"sodium":1650,"vitC":85,"vitD":6.5,"vitB12":3.1,"zinc":9.8,"omega3":1.4}}`;

      const rawText = await callMealAi(prompt);
      const parsed = parseAiJson(rawText, {});
      if (parsed?.kcal != null && Number.isFinite(Number(parsed.kcal))) {
        setFdaAiOverride(parsed);
        showToast(`✓ Ακριβής ανάλυση FDA ολοκληρώθηκε για ${selectedDay}`);
      } else {
        showToast('⚠️ Μη έγκυρη απόκριση FDA ανάλυσης.');
      }
    } catch (err) {
      showToast(`⚠️ ${err?.message || 'Σφάλμα κατά την ανάλυση FDA.'}`);
    } finally {
      setFdaLoading(false);
    }
  };
  return { handleGenerateAiMeals, handleGenerateFullWeekAi, handleExactFdaAnalysis };
}

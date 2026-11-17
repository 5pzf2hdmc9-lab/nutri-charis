import { useEffect, useMemo } from 'react';
import { DAYS, MEAL_TYPES } from '../constants/dietPlan';
import { analyzeDayNutrition } from '../lib/analyzeDayNutrition';
import { guardClientWrite } from '../lib/authAccess';
import { cleanMealText } from '../lib/mealText';
import { calculateMetabolism } from '../lib/nutrition-math';
import { buildWeeklyShoppingList } from '../lib/whatsappPlan';
import { supabase } from '../supabaseClient';

export function useActiveClient(deps) {
  const { activeClientId, clients, completedMeals, fdaAiOverride, isAdmin, measurements, selectedDay, setClients, setCompletedMeals, setFdaAiOverride, setWaterGlasses, showToast, waterGlasses } = deps;
  const activeClientObj = useMemo(
    () => clients.find((c) => String(c.id) === String(activeClientId)) || clients[0] || null,
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

  const handleSwitchClientFormula = async (formula) => {
    if (!activeClientObj) return;
    try {
      await guardClientWrite(activeClientObj, isAdmin);
      const updatedQ = { ...(activeClientObj.questionnaire || {}), bmrFormula: formula };
      const { error } = await supabase
        .from('clients')
        .update({ questionnaire: updatedQ })
        .eq('id', Number(activeClientObj.id));
      if (error) throw new Error(error.message);
      setClients((prev) =>
        prev.map((c) => (String(c.id) === String(activeClientObj.id) ? { ...c, questionnaire: updatedQ } : c))
      );
      const label = formula === 'mifflin' ? 'Mifflin-St Jeor' : formula === 'harris' ? 'Harris-Benedict' : 'Katch-McArdle';
      showToast(`✓ Ενεργοποιήθηκε: ${label}`);
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
    }
  };

  const handleChangeCalorieDelta = async (deltaVal) => {
    if (!activeClientObj) return;
    const nextDelta = Number(deltaVal);
    if (!Number.isFinite(nextDelta) || nextDelta < -2000 || nextDelta > 2000) {
      showToast('⚠️ Μη έγκυρη θερμιδική προσαρμογή.');
      return;
    }
    try {
      await guardClientWrite(activeClientObj, isAdmin);
      const updatedQ = { ...(activeClientObj.questionnaire || {}), calorieDelta: nextDelta };
      const { error } = await supabase
        .from('clients')
        .update({ questionnaire: updatedQ })
        .eq('id', Number(activeClientObj.id));
      if (error) throw new Error(error.message);
      setClients((prev) =>
        prev.map((c) => (String(c.id) === String(activeClientObj.id) ? { ...c, questionnaire: updatedQ } : c))
      );
      showToast('✓ Ενημερώθηκε ο θερμιδικός στόχος!');
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
    }
  };

  const toggleTrackedMicro = async (microKey) => {
    if (!activeClientObj) return;
    try {
      await guardClientWrite(activeClientObj, isAdmin);
      const exists = selectedMicros.includes(microKey);
      const nextMicros = exists ? selectedMicros.filter((k) => k !== microKey) : [...selectedMicros, microKey];
      const updatedQ = { ...(activeClientObj.questionnaire || {}), selectedMicros: nextMicros };
      const { error } = await supabase
        .from('clients')
        .update({ questionnaire: updatedQ })
        .eq('id', Number(activeClientObj.id));
      if (error) throw new Error(error.message);
      setClients((prev) =>
        prev.map((c) => (String(c.id) === String(activeClientObj.id) ? { ...c, questionnaire: updatedQ } : c))
      );
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
    }
  };

  useEffect(() => {
    setFdaAiOverride(null);
  }, [selectedDay]);
  return { activeClientObj, clientMeasurements, latestBodyFat, activeFormula, activeCalorieDelta, clientMetabolism, activeBmr, activeTdee, activeTargetKcal, selectedMicros, weeklyStats, dayNutrition, shoppingList, dayAdherence, toggleMealComplete, adjustWaterGlass, handleSwitchClientFormula, handleChangeCalorieDelta, toggleTrackedMicro };
}

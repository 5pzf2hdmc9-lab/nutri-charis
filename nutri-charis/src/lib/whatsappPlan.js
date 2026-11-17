import { buildWeeklyShoppingList as buildShoppingFromPlan } from './shoppingList';
import { DAYS, MEAL_TYPES } from '../constants/dietPlan';
import { cleanMealText } from './mealText';

export function buildWeeklyShoppingList(mealPlan = {}) {
  return buildShoppingFromPlan(mealPlan, DAYS, MEAL_TYPES);
}

export function formatWeeklyPlanForWhatsApp(clientObj, targetKcal) {
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

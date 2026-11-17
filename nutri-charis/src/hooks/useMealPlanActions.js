import { customWeekTemplates, DEFAULT_WEEK_TEMPLATES } from '../constants/dietPlan';
import { guardClientWrite } from '../lib/authAccess';
import { cleanMealText } from '../lib/mealText';
import { formatWeeklyPlanForWhatsApp } from '../lib/whatsappPlan';
import { supabase } from '../supabaseClient';
import { useMealAi } from './useMealAi';

export function useMealPlanActions(deps) {
  const ai = useMealAi(deps);
  const { activeClientObj, activeTargetKcal, cloneTargetDay, editingCell, isAdmin, newTemplateName, savedIdeas, selectedDay, setApiKey, setClients, setEditingCell, setNewTemplateName, setSavedIdeas, setShowApiKeyModal, setShowTemplatesModal, setTempApiKey, setWeekTemplates, showToast, tempApiKey, weekTemplates } = deps;
  const handleSelectMealOption = async (day, mealType, text) => {
    if (!activeClientObj) return false;
    try {
      await guardClientWrite(activeClientObj, isAdmin);
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
      return false;
    }
    const cleaned = cleanMealText(text);
    const currentPlan = activeClientObj.meal_plan || {};
    const updatedPlan = {
      ...currentPlan,
      [day]: {
        ...(currentPlan[day] || {}),
        [mealType]: cleaned
      }
    };
    const { error } = await supabase
      .from('clients')
      .update({ meal_plan: updatedPlan })
      .eq('id', Number(activeClientObj.id));
    if (error) {
      showToast(`⚠️ ${error.message}`);
      return false;
    }
    setClients((prev) =>
      prev.map((c) => (String(c.id) === String(activeClientObj.id) ? { ...c, meal_plan: updatedPlan } : c))
    );
    showToast(cleaned ? `✓ Ενημερώθηκε: ${day} • ${mealType}` : `🗑️ Διαγράφηκε: ${day} • ${mealType}`);
    return true;
  };

  const handleCloneDay = async () => {
    if (!activeClientObj || selectedDay === cloneTargetDay) return;
    try {
      await guardClientWrite(activeClientObj, isAdmin);
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
      return;
    }
    const sourceDayMeals = activeClientObj.meal_plan?.[selectedDay] || {};
    const updatedPlan = {
      ...(activeClientObj.meal_plan || {}),
      [cloneTargetDay]: { ...sourceDayMeals }
    };
    const { error } = await supabase
      .from('clients')
      .update({ meal_plan: updatedPlan })
      .eq('id', Number(activeClientObj.id));
    if (error) {
      showToast(`⚠️ ${error.message}`);
      return;
    }
    setClients((prev) =>
      prev.map((c) => (String(c.id) === String(activeClientObj.id) ? { ...c, meal_plan: updatedPlan } : c))
    );
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
    const nextCustom = [tpl, ...customWeekTemplates(weekTemplates)];
    setWeekTemplates([...DEFAULT_WEEK_TEMPLATES, ...nextCustom]);
    localStorage.setItem('nutricharis_week_templates', JSON.stringify(nextCustom));
    setNewTemplateName('');
    showToast(`✓ Αποθηκεύτηκε το πρότυπο: ${tpl.name}`);
  };

  const handleApplyWeekTemplate = async (tpl) => {
    if (!activeClientObj) return;
    try {
      await guardClientWrite(activeClientObj, isAdmin);
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
      return;
    }
    if (!tpl?.plan || typeof tpl.plan !== 'object' || Array.isArray(tpl.plan)) {
      showToast('⚠️ Το πρότυπο δεν έχει έγκυρο πλάνο.');
      return;
    }
    const updatedPlan = { ...(activeClientObj.meal_plan || {}), ...tpl.plan };
    const { error } = await supabase
      .from('clients')
      .update({ meal_plan: updatedPlan })
      .eq('id', Number(activeClientObj.id));
    if (error) {
      showToast(`⚠️ ${error.message}`);
      return;
    }
    setClients((prev) =>
      prev.map((c) => (String(c.id) === String(activeClientObj.id) ? { ...c, meal_plan: updatedPlan } : c))
    );
    setShowTemplatesModal(false);
    showToast(`✓ Εφαρμόστηκε το πρότυπο: ${tpl.name}`);
  };

  const handleSaveManualCellEdit = async (e) => {
    e.preventDefault();
    if (!editingCell) return;
    const saved = await handleSelectMealOption(editingCell.day, editingCell.type, editingCell.text);
    if (saved) setEditingCell(null);
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

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    try {
      localStorage.removeItem('nutricharis_gemini_key');
    } catch {
      /* private mode */
    }
    setApiKey('');
    setTempApiKey('');
    setShowApiKeyModal(false);
    showToast('Το Gemini κλειδί ρυθμίζεται μόνο στον server (GEMINI_API_KEY).');
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
  return { ...ai, handleSelectMealOption, handleCloneDay, handleSaveCurrentWeekAsTemplate, handleApplyWeekTemplate, handleSaveManualCellEdit, saveIdeaToLibrary, deleteSavedIdea, handleSaveApiKey, handleSendWeeklyPlanWhatsApp };
}

import { assertClientAccess, requireSessionUser, sanitizeText } from '../lib/authAccess';
import { parseStrictNum } from '../lib/nutrition-math';
import { parseClientFolder } from '../lib/practiceSchemas';
import { supabase } from '../supabaseClient';

export function useClientRecords(deps) {
  const { activeClientId, appointments, clients, editAge, editGender, editGoal, editHeight, editName, editPhone, editQ, editWeight, editingClient, isAdmin, measurements, newClientAge, newClientArt9, newClientEmail, newClientGdpr, newClientGender, newClientGoal, newClientHeight, newClientName, newClientPhone, newClientTerms, newClientWeight, selectedMicros, setActiveClientId, setActiveTab, setClients, setEditAge, setEditGender, setEditGoal, setEditHeight, setEditName, setEditPhone, setEditQ, setEditWeight, setEditingClient, setNewClientArt9, setNewClientEmail, setNewClientGdpr, setNewClientName, setNewClientPhone, setNewClientTerms, setShowNewClientForm, showToast } = deps;
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
      const parsed = parseClientFolder(payload);
      if (!parsed.success) {
        showToast(`⚠️ ${parsed.error.issues?.[0]?.message || 'Μη έγκυρα στοιχεία φακέλου.'}`);
        return;
      }
      const { data, error } = await supabase.from('clients').insert([{
        ...parsed.data,
        dietitian_id: user.id,
        questionnaire: payload.questionnaire,
        meal_plan: {}
      }]).select();
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
    const cid = Number(client.id);
    if (!Number.isInteger(cid) || cid <= 0) {
      throw new Error('Μη έγκυρο αναγνωριστικό φακέλου.');
    }
    // Child rows first. clinical_notes/billing also CASCADE; appointments do not.
    const childTables = ['clinical_notes', 'billing_packages', 'appointments', 'measurements', 'questionnaires'];
    for (const table of childTables) {
      const { error: childErr } = await supabase.from(table).delete().eq('client_id', cid);
      if (childErr && !/schema cache|does not exist|Could not find/i.test(childErr.message || '')) {
        throw new Error(childErr.message);
      }
    }
    const { error } = await supabase.from('clients').delete().eq('id', cid);
    if (error) throw new Error(error.message);
    const remaining = clients.filter((c) => c.id !== client.id);
    setClients(remaining);
    if (String(activeClientId) === String(client.id)) {
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
  return { handleCreateClient, handlePermanentDeleteClient, handleDeleteClient, openClientEditModal, toggleEditArrayItem, saveClientEdit };
}

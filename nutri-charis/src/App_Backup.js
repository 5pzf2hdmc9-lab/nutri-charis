import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './index.css';

const ADMIN_SESSION_KEY = 'nutricharis_admin_session';
const ADMIN_PIN = '2026';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem(ADMIN_SESSION_KEY) === 'true');
  const [showPinModal, setShowPinModal] = useState(false);
  const [inputPin, setInputPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const [activeTab, setActiveTab] = useState('mealplanner');
  const [selectedClient, setSelectedClient] = useState('');
  const [loading, setLoading] = useState(true);

  const [apiKey, setApiKey] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  // SUPABASE DATA STATES
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [clientMeals, setClientMeals] = useState({});
  const [clientMeasurements, setClientMeasurements] = useState({});
  const [journalEntries, setJournalEntries] = useState([]);

  // FETCH ALL DATA FROM SUPABASE
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const { data: setRes } = await supabase.from('settings').select('*').eq('key', 'gemini_api_key').single();
      if (setRes) setApiKey(setRes.value || '');

      const { data: cData } = await supabase.from('clients').select('*').order('created_at', { ascending: true });
      if (cData && cData.length > 0) {
        setClients(cData);
        if (!selectedClient) setSelectedClient(cData[0].name);
      } else {
        const defaultClient = { 
          id: Date.now(), 
          name: "Χάρις Φ", 
          goal: "Κλινική Απώλεια Λίπους & Ρύθμιση Μεταβολισμού", 
          phone: "6986515179", 
          email: "charis@nutricharis.gr",
          age: 22, weight: 59, height: 162, gender: 'female', activity: 1.2, 
          bmr: 1332, tdee: 1832, bmi: '22.5',
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
          clinicalnotes: "ΑΥΤΙΣΜΟΣ / Αισθητηριακή ευαισθησία"
        };
        await supabase.from('clients').insert([defaultClient]);
        setClients([defaultClient]);
        setSelectedClient(defaultClient.name);
      }

      const { data: aData } = await supabase.from('appointments').select('*').order('created_at', { ascending: false });
      if (aData) setAppointments(aData);

      const { data: slotData } = await supabase.from('available_slots').select('*').order('created_at', { ascending: true });
      if (slotData) setAvailableSlots(slotData);

      const { data: mData } = await supabase.from('meals').select('*');
      if (mData) {
        const mealsObj = {};
        mData.forEach(m => {
          if (!mealsObj[m.client_name]) mealsObj[m.client_name] = [];
          mealsObj[m.client_name].push(m);
        });
        setClientMeals(mealsObj);
      }

      const { data: measData } = await supabase.from('measurements').select('*').order('created_at', { ascending: true });
      if (measData) {
        const measObj = {};
        measData.forEach(m => {
          if (!measObj[m.client_name]) measObj[m.client_name] = [];
          measObj[m.client_name].push(m);
        });
        setClientMeasurements(measObj);
      }

      const { data: jData } = await supabase.from('journal').select('*').order('created_at', { ascending: false });
      if (jData) setJournalEntries(jData);

    } catch (err) {
      console.error('Supabase fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const activeClientObj = clients.find(c => c.name === selectedClient) || clients[0];

  // AUSTERE TEXT CLEANER
  const cleanMealText = (text) => {
    if (!text) return '';
    let clean = text;
    clean = clean.split(/ΜΑΚΡΟΘΡΕΠΤΙΚΑ|Μακροθρεπτικά|Θερμίδες|Κλινική|ΚΛΙΝΙΚΗ|Διατροφική Ανάλυση/i)[0];
    clean = clean.replace(/^(Συστατικά|ΣΥΝΘΕΣΗ|Συνθεση|Συστατικα)\s*:\s*/i, '');
    clean = clean.replace(/\([^)]*(υφή|υφής|προβιοτικά|εγκεφάλου|εντέρου|υγρασία|δράση|αντιοξειδωτική|καθαρό|ζυγισμένο|ομοιόμορφη|σταθερή|τραγανή|έντονα|μπαχαρικά|χωρίς κομμένο|ψημμένο)[^)]*\)/gi, '');
    clean = clean.replace(/\s+/g, ' ').replace(/-\s*$/g, '').trim();
    return clean;
  };

  // NEW CLIENT FORM
  const [clientName, setClientName] = useState('');
  const [clientGoal, setClientGoal] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientWeight, setClientWeight] = useState(65);
  const [clientHeight, setClientHeight] = useState(170);
  const [clientAge, setClientAge] = useState(28);
  const [clientGender, setClientGender] = useState('female');
  const [clientActivity, setClientActivity] = useState(1.2);
  const [clientNotes, setClientNotes] = useState('');
  const [clientAvatar, setClientAvatar] = useState('');

  // EDIT CLIENT STATES
  const [editingClient, setEditingClient] = useState(null);
  const [editName, setEditName] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editWeight, setEditWeight] = useState(60);
  const [editHeight, setEditHeight] = useState(165);
  const [editAge, setEditAge] = useState(25);
  const [editNotes, setEditNotes] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const daysOfWeek = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή'];
  const mealTypesList = ['🌅 1. Πρωινό', '🍏 2. Σνακ 1', '🥗 3. Μεσημεριανό', '🥜 4. Σνακ 2', '🌙 5. Βραδινό'];
  
  const [targetMealDay, setTargetMealDay] = useState('Δευτέρα');
  const [aiLoading, setAiLoading] = useState(false);

  // CLIENT EXTRA LOGS
  const [extraFoodText, setExtraFoodText] = useState('');
  const [extraFoodTime, setExtraFoodTime] = useState('');
  const [extraFoodImage, setExtraFoodImage] = useState('');

  // APPOINTMENT MULTI-DAY RANGE & SMART BOOKING STATES
  const [slotStartDate, setSlotStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotEndDate, setSlotEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotTimeStart1, setSlotTimeStart1] = useState('09:00');
  const [slotTimeEnd1, setSlotTimeEnd1] = useState('14:00');
  const [slotTimeStart2, setSlotTimeStart2] = useState('17:00');
  const [slotTimeEnd2, setSlotTimeEnd2] = useState('21:00');
  const [slotStep, setSlotStep] = useState(30); // Προεπιλογή 30λ

  const [selectedSlotTime, setSelectedSlotTime] = useState(null);
  const [bookingType, setBookingType] = useState('1η Συνεδρία (1 ώρα)');

  const sessionDurations = {
    '1η Συνεδρία (1 ώρα)': 60,
    'Επανέλεγχος (40λ)': 40,
    'Λιπομέτρηση (15λ)': 15,
    '2πλη 1η Συνεδρία (1.4 ώρες)': 84,
    '2πλος Επανέλεγχος (1 ώρα)': 60
  };

  // CALCULATOR STATES
  const [calcFormula, setCalcFormula] = useState('harris');
  const [calcGender, setCalcGender] = useState('female');
  const [calcAge, setCalcAge] = useState(22);
  const [calcWeight, setCalcWeight] = useState(59);
  const [calcHeight, setCalcHeight] = useState(162);
  const [calcActivity, setCalcActivity] = useState(1.2);
  const [calcResult, setCalcResult] = useState(null);

  // MEASUREMENTS STATES
  const [mWeight, setMWeight] = useState('');
  const [mFat, setMFat] = useState('');
  const [mWaist, setMWaist] = useState('');
  const [mHips, setMHips] = useState('');

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (inputPin === ADMIN_PIN) {
      setIsAdmin(true);
      localStorage.setItem(ADMIN_SESSION_KEY, 'true');
      setShowPinModal(false);
      setInputPin('');
      setPinError(false);
      setActiveTab('clients');
    } else {
      setPinError(true);
    }
  };

  const handleLogoutAdmin = () => {
    setIsAdmin(false);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setActiveTab('mealplanner');
  };

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    if (!tempApiKey) return;
    const cleanKey = tempApiKey.trim();
    await supabase.from('settings').upsert({ key: 'gemini_api_key', value: cleanKey });
    setApiKey(cleanKey);
    setShowApiKeyModal(false);
    setTempApiKey('');
  };

  // ADD CLIENT
  const addClient = async (e) => {
    e.preventDefault();
    if (!clientName) return;
    
    const w = Number(clientWeight) || 60;
    const h = Number(clientHeight) || 165;
    const a = Number(clientAge) || 25;

    const calculatedBmr = Math.round((10 * w) + (6.25 * h) - (5 * a) + (clientGender === 'female' ? -161 : 5));
    const calculatedTdee = Math.round(calculatedBmr * Number(clientActivity));
    const heightInM = h / 100;
    const calculatedBmi = (w / (heightInM * heightInM)).toFixed(1);

    const defaultAvatar = clientAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(clientName)}`;
    
    const newClient = {
      id: Date.now(),
      name: clientName,
      goal: clientGoal || 'Κλινική Διατροφή & Ευεξία',
      phone: clientPhone || '',
      email: clientEmail || '',
      avatar: defaultAvatar,
      age: a, weight: w, height: h, gender: clientGender, activity: clientActivity,
      bmr: calculatedBmr, tdee: calculatedTdee, bmi: calculatedBmi,
      clinicalnotes: clientNotes || 'Χωρίς σημειώσεις.'
    };

    await supabase.from('clients').insert([newClient]);
    setClients([...clients, newClient]);
    setSelectedClient(clientName);
    setClientName(''); setClientGoal(''); setClientPhone(''); setClientEmail(''); setClientNotes(''); setClientAvatar('');
    alert('✅ Ο νέος πελάτης καταχωρήθηκε!');
  };

  // ADMIN: GENERATE SLOTS FOR MULTIPLE DAYS (DATE RANGE)
  const generateRangeSlots = async (e) => {
    e.preventDefault();
    const newSlots = [];

    const startD = new Date(slotStartDate);
    const endD = new Date(slotEndDate);

    if (endD < startD) {
      alert('Η ημερομηνία λήξης πρέπει να είναι ίδια ή μεταγενέστερη της ημερομηνίας έναρξης!');
      return;
    }

    const addHoursForDay = (dateStr) => {
      const addRange = (startStr, endStr) => {
        let [startH, startM] = startStr.split(':').map(Number);
        let [endH, endM] = endStr.split(':').map(Number);
        let curr = startH * 60 + startM;
        let limit = endH * 60 + endM;

        while (curr < limit) {
          let h = Math.floor(curr / 60).toString().padStart(2, '0');
          let m = (curr % 60).toString().padStart(2, '0');
          newSlots.push({ id: Date.now() + Math.random(), date: dateStr, time: `${h}:${m}` });
          curr += Number(slotStep);
        }
      };

      if (slotTimeStart1 && slotTimeEnd1) addRange(slotTimeStart1, slotTimeEnd1);
      if (slotTimeStart2 && slotTimeEnd2) addRange(slotTimeStart2, slotTimeEnd2);
    };

    // Iterate through date range
    let curD = new Date(startD);
    while (curD <= endD) {
      const dStr = curD.toISOString().split('T')[0];
      addHoursForDay(dStr);
      curD.setDate(curD.getDate() + 1);
    }

    if (newSlots.length > 0) {
      await supabase.from('available_slots').insert(newSlots);
      setAvailableSlots([...availableSlots, ...newSlots]);
      alert(`🚀 Δημιουργήθηκαν ${newSlots.length} διαθέσιμα slots για το διάστημα ${slotStartDate} έως ${slotEndDate}!`);
    }
  };

  const deleteSlot = async (id) => {
    await supabase.from('available_slots').delete().eq('id', id);
    setAvailableSlots(availableSlots.filter(s => s.id !== id));
  };

  // CLIENT BOOKING
  const handleBookSlot = async (e) => {
    e.preventDefault();
    if (!selectedSlotTime) { alert('Παρακαλώ επιλέξτε μια διαθέσιμη ώρα!'); return; }

    const targetSlot = availableSlots.find(s => s.date === selectedCalendarDate && s.time === selectedSlotTime);
    if (!targetSlot) return;

    const newApp = { 
      id: Date.now(), 
      date: selectedCalendarDate, 
      time: selectedSlotTime, 
      client: selectedClient, 
      type: bookingType 
    };

    await supabase.from('appointments').insert([newApp]);
    await supabase.from('available_slots').delete().eq('id', targetSlot.id);

    setAppointments([newApp, ...appointments]);
    setAvailableSlots(availableSlots.filter(s => s.id !== targetSlot.id));
    setSelectedSlotTime(null);
    alert(`🎉 Το ραντεβού σας κατοχυρώθηκε για τις ${selectedCalendarDate} στις ${selectedSlotTime}!`);
  };

  // GEMINI AI MEAL GENERATION
  const generateRealAiMeals = async (singleDayOverride = null) => {
    if (!apiKey) { setShowApiKeyModal(true); return; }
    if (!activeClientObj) return;

    setAiLoading(true);
    const dayToFetch = singleDayOverride || targetMealDay;

    const promptText = `
Είσαι κλινικός διατροφολόγος. Δημιούργησε ένα διατροφικό πλάνο 5 γευμάτων (1. Πρωινό, 2. Σνακ 1, 3. Μεσημεριανό, 4. Σνακ 2, 5. Βραδινό) για την ημέρα: "${dayToFetch}".

ΑΥΣΤΗΡΟΙ ΚΑΝΟΝΕΣ:
- Γράψε ΑΠΟΚΛΕΙΣΤΙΚΑ ΚΑΙ ΜΟΝΟ ΤΑ ΤΡΟΦΙΜΑ ΚΑΙ ΤΙΣ ΠΟΣΟΤΗΤΕΣ (π.χ. "150g γιαούρτι 2%, 35g βρώμη, 10g σπόροι chia, 60g μύρτιλα").
- ΑΠΑΓΟΡΕΥΕΤΑΙ ΑΥΣΤΗΡΑ η αναγραφή λέξεων όπως "Συστατικά:", "Σύνθεση:", περιγραφές υφής ("λεπτής άλεσης", "τραγανό") και κλινικές αιτιολογήσεις.

Επίστρεψε ΑΠΟΚΛΕΙΣΤΙΚΑ JSON array:
[
  {"day": "${dayToFetch}", "type": "🌅 1. Πρωινό", "text": "..."},
  {"day": "${dayToFetch}", "type": "🍏 2. Σνακ 1", "text": "..."},
  {"day": "${dayToFetch}", "type": "🥗 3. Μεσημεριανό", "text": "..."},
  {"day": "${dayToFetch}", "type": "🥜 4. Σνακ 2", "text": "..."},
  {"day": "${dayToFetch}", "type": "🌙 5. Βραδινό", "text": "..."}
]
`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-3.8-flash:generateContent?key=${apiKey.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Σφάλμα API');

      const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedMeals = JSON.parse(cleanJson);

      if (Array.isArray(parsedMeals)) {
        return parsedMeals.map(m => ({ ...m, text: cleanMealText(m.text) }));
      } else throw new Error('Σφάλμα στη μορφή απόκρισης του AI.');
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      if (!singleDayOverride) setAiLoading(false);
    }
  };

  const handleGenerateSingle = async () => {
    setAiLoading(true);
    try {
      const res = await generateRealAiMeals(targetMealDay);
    } catch (err) {
      alert(`Σφάλμα AI: ${err.message}.`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateFullWeek = async () => {
    if (!apiKey) { setShowApiKeyModal(true); return; }
    setAiLoading(true);
    let allGeneratedMeals = [];

    try {
      for (const day of daysOfWeek) {
        const dayMeals = await generateRealAiMeals(day);
        if (Array.isArray(dayMeals)) {
          allGeneratedMeals = [...allGeneratedMeals, ...dayMeals];
        }
        await new Promise(r => setTimeout(r, 400));
      }

      const rowsToInsert = allGeneratedMeals.map((m, idx) => ({
        id: Date.now() + idx,
        client_name: selectedClient,
        day: m.day,
        type: m.type,
        text: cleanMealText(m.text)
      }));

      await supabase.from('meals').insert(rowsToInsert);
      const current = clientMeals[selectedClient] || [];
      setClientMeals({ ...clientMeals, [selectedClient]: [...current, ...rowsToInsert] });
      alert(`✅ Το πλήρες εβδομαδιαίο πλάνο αποθηκεύτηκε!`);
    } catch (err) {
      alert(`Σφάλμα: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // DYNAMIC SPEEDOMETER LOGIC
  const todayDateStr = new Date().toLocaleDateString('el-GR');
  const todayLogs = journalEntries.filter(j => j.client_name === selectedClient && j.date === todayDateStr);
  const loggedTodayCount = todayLogs.length;
  const speedometerPercentage = Math.min(100, Math.round((loggedTodayCount / 5) * 100));
  const needleRotation = -90 + (speedometerPercentage * 1.8);

  const handleLogMealFromPlan = async (mealTextContent, mealTypeName) => {
    const newEntry = {
      id: Date.now(),
      client_name: selectedClient,
      date: todayDateStr,
      entry_type: 'text',
      description: `${mealTypeName}: ${cleanMealText(mealTextContent)}`
    };

    await supabase.from('journal').insert([newEntry]);
    setJournalEntries([newEntry, ...journalEntries]);
  };

  const handleRemoveJournalEntry = async (id) => {
    await supabase.from('journal').delete().eq('id', id);
    setJournalEntries(journalEntries.filter(j => j.id !== id));
  };

  const handleExtraFoodSubmit = async (e) => {
    e.preventDefault();
    if (!extraFoodText && !extraFoodImage) return;

    const newEntry = {
      id: Date.now(),
      client_name: selectedClient,
      date: todayDateStr,
      entry_type: extraFoodImage ? 'photo' : 'text',
      image_url: extraFoodImage || null,
      description: `${extraFoodTime ? `[${extraFoodTime}] ` : ''}${extraFoodText || 'Φωτογραφία γεύματος'}`
    };

    await supabase.from('journal').insert([newEntry]);
    setJournalEntries([newEntry, ...journalEntries]);
    setExtraFoodText(''); setExtraFoodTime(''); setExtraFoodImage('');
    alert('✅ Η καταγραφή προστέθηκε!');
  };

  const handleImageUpload = (e, isEdit = false, isExtra = false) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = isExtra ? 400 : 120;
        canvas.height = isExtra ? 400 : 120;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);

        if (isExtra) setExtraFoodImage(compressedBase64);
        else if (isEdit) setEditAvatar(compressedBase64);
        else setClientAvatar(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const deleteClient = async (id) => {
    if (!isAdmin) return;
    await supabase.from('clients').delete().eq('id', id);
    setClients(clients.filter(c => c.id !== id));
  };

  const startEditClient = (client) => {
    if (!isAdmin) { setShowPinModal(true); return; }
    setEditingClient(client);
    setEditName(client.name);
    setEditGoal(client.goal || '');
    setEditPhone(client.phone || '');
    setEditEmail(client.email || '');
    setEditWeight(client.weight || 60);
    setEditHeight(client.height || 165);
    setEditAge(client.age || 25);
    setEditNotes(client.clinicalnotes || '');
    setEditAvatar(client.avatar || '');
  };

  const saveClientEdit = async (e) => {
    e.preventDefault();
    if (!editingClient || !editName || !isAdmin) return;

    const w = Number(editWeight) || 60;
    const h = Number(editHeight) || 165;
    const a = Number(editAge) || 25;
    
    const calculatedBmr = Math.round((10 * w) + (6.25 * h) - (5 * a) - 161);
    const calculatedTdee = Math.round(calculatedBmr * 1.375);

    const updatedObj = {
      name: editName, goal: editGoal, phone: editPhone, email: editEmail,
      weight: w, height: h, age: a, bmr: calculatedBmr, tdee: calculatedTdee,
      clinicalnotes: editNotes, avatar: editAvatar || editingClient.avatar
    };

    await supabase.from('clients').update(updatedObj).eq('id', editingClient.id);
    setClients(clients.map(c => c.id === editingClient.id ? { ...c, ...updatedObj } : c));
    setSelectedClient(editName);
    setEditingClient(null);
    alert('✅ Τα στοιχεία του προφίλ ενημερώθηκαν επιτυχώς!');
  };

  const addMeasurement = async (e) => {
    e.preventDefault();
    if (!mWeight) return;
    const newM = {
      id: Date.now(),
      client_name: selectedClient,
      date: new Date().toLocaleDateString('el-GR'),
      weight: Number(mWeight),
      fat: Number(mFat) || 0,
      waist: Number(mWaist) || 0,
      hips: Number(mHips) || 0
    };

    await supabase.from('measurements').insert([newM]);
    const current = clientMeasurements[selectedClient] || [];
    setClientMeasurements({ ...clientMeasurements, [selectedClient]: [...current, newM] });
    setMWeight(''); setMFat(''); setMWaist(''); setMHips('');
    alert('✅ Η νέα μέτρηση αποθηκεύτηκε!');
  };

  const calculateBmr = async (e) => {
    if (e) e.preventDefault();
    let bmrVal = calcFormula === 'mifflin'
      ? (10 * calcWeight) + (6.25 * calcHeight) - (5 * calcAge) + (calcGender === 'female' ? -161 : 5)
      : (calcGender === 'female' ? 447.593 + (9.247 * calcWeight) + (3.098 * calcHeight) - (4.330 * calcAge) : 88.362 + (13.397 * calcWeight) + (4.799 * calcHeight) - (5.677 * calcAge));
    
    const calculatedBmr = Math.round(bmrVal);
    const calculatedTdee = Math.round(bmrVal * calcActivity);
    const heightInM = calcHeight / 100;
    const calculatedBmi = (calcWeight / (heightInM * heightInM)).toFixed(1);

    setCalcResult({ bmr: calculatedBmr, tdee: calculatedTdee, bmi: calculatedBmi });

    if (activeClientObj) {
      await supabase.from('clients').update({
        weight: calcWeight, height: calcHeight, age: calcAge, gender: calcGender,
        activity: calcActivity, bmr: calculatedBmr, tdee: calculatedTdee, bmi: calculatedBmi
      }).eq('id', activeClientObj.id);

      setClients(clients.map(c => c.id === activeClientObj.id ? {
        ...c, weight: calcWeight, height: calcHeight, age: calcAge, gender: calcGender, activity: calcActivity, bmr: calculatedBmr, tdee: calculatedTdee, bmi: calculatedBmi
      } : c));
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#022c22', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <h2>🌿 Φόρτωση NutriCharis Cloud OS...</h2>
      </div>
    );
  }

  const filteredAvailableSlots = availableSlots.filter(s => s.date === selectedCalendarDate);

  return (
    <div style={{ minHeight: '100vh', background: '#022c22', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: '60px' }}>
      
      {/* NAVBAR */}
      <nav style={{ background: '#064e3b', borderBottom: '1px solid rgba(16, 185, 129, 0.25)', padding: '12px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🌿</span>
            <div>
              <h1 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>NutriCharis</h1>
              <span style={{ fontSize: '10px', color: '#34d399', fontWeight: '600' }}>{isAdmin ? 'Admin OS' : 'Client Portal'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isAdmin && (
              <button 
                onClick={() => { setTempApiKey(apiKey); setShowApiKeyModal(true); }} 
                style={{ background: apiKey ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.25)', border: apiKey ? '1px solid #10b981' : '1px solid #ef4444', color: apiKey ? '#34d399' : '#fca5a5', padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
              >
                🔑 {apiKey ? 'API Connected' : 'Βάλε API Key'}
              </button>
            )}

            {isAdmin ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', padding: '4px 10px', borderRadius: '20px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#34d399' }}>👑 Admin</span>
                <button onClick={handleLogoutAdmin} title="Έξοδος" style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '12px' }}>🔒</button>
              </div>
            ) : (
              <button onClick={() => setShowPinModal(true)} style={{ background: 'rgba(234, 179, 8, 0.15)', border: '1px solid #eab308', color: '#fde047', padding: '5px 12px', borderRadius: '20px', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}>
                🔑 Admin Login
              </button>
            )}
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          {isAdmin && (
            <button onClick={() => setActiveTab('clients')} style={{ whiteSpace: 'nowrap', padding: '8px 12px', borderRadius: '10px', border: 'none', background: activeTab === 'clients' ? '#059669' : 'rgba(2, 44, 34, 0.6)', color: '#fff', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>👥 Πελάτες & Φάκελοι</button>
          )}
          
          <button onClick={() => setActiveTab('mealplanner')} style={{ whiteSpace: 'nowrap', padding: '8px 12px', borderRadius: '10px', border: 'none', background: activeTab === 'mealplanner' ? '#059669' : 'rgba(2, 44, 34, 0.6)', color: '#fff', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
            {isAdmin ? '📋 Εβδομαδιαίο Πλάνο AI' : '📋 Εβδομαδιαίο Πλάνο & Καταγραφές'}
          </button>

          <button onClick={() => setActiveTab('appointments')} style={{ whiteSpace: 'nowrap', padding: '8px 12px', borderRadius: '10px', border: 'none', background: activeTab === 'appointments' ? '#059669' : 'rgba(2, 44, 34, 0.6)', color: '#fff', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>📅 Ραντεβού</button>
          <button onClick={() => setActiveTab('progress')} style={{ whiteSpace: 'nowrap', padding: '8px 12px', borderRadius: '10px', border: 'none', background: activeTab === 'progress' ? '#059669' : 'rgba(2, 44, 34, 0.6)', color: '#fff', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>📈 Πρόοδος</button>

          {isAdmin && (
            <>
              <button onClick={() => setActiveTab('calc')} style={{ whiteSpace: 'nowrap', padding: '8px 12px', borderRadius: '10px', border: 'none', background: activeTab === 'calc' ? '#059669' : 'rgba(2, 44, 34, 0.6)', color: '#fff', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>⚡ BMR / TDEE</button>
              <button onClick={() => setActiveTab('measurements')} style={{ whiteSpace: 'nowrap', padding: '8px 12px', borderRadius: '10px', border: 'none', background: activeTab === 'measurements' ? '#059669' : 'rgba(2, 44, 34, 0.6)', color: '#fff', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>📏 Σώμα</button>
            </>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '16px auto', padding: '0 12px' }}>

        {/* ACTIVE CLIENT HEADER */}
        {activeClientObj && (
          <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src={activeClientObj.avatar} 
                alt="avatar" 
                onClick={() => isAdmin && startEditClient(activeClientObj)} 
                title={isAdmin ? "Κάντε κλικ για επεξεργασία προφίλ" : ""}
                style={{ width: '58px', height: '58px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #10b981', cursor: isAdmin ? 'pointer' : 'default' }} 
              />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '10px', color: '#34d399', fontWeight: '800' }}>ΕΝΕΡΓΟΣ ΠΕΛΑΤΗΣ:</span>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#fff' }}>{activeClientObj.name}</h2>
                <div style={{ fontSize: '11px', color: '#6ee7b7', marginTop: '2px' }}>
                  🎯 {activeClientObj.goal || 'Στόχος'} | 📞 {activeClientObj.phone || 'N/A'} | ✉️ {activeClientObj.email || 'N/A'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', border: '1px solid #10b981' }}>⚡ BMR: {activeClientObj.bmr || 1350} kcal</span>
                <span style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#fde047', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', border: '1px solid #eab308' }}>🔥 TDEE: {activeClientObj.tdee || 1850} kcal</span>
              </div>

              {isAdmin && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => startEditClient(activeClientObj)} style={{ padding: '6px 12px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>✏️ Επεξεργασία Προφίλ</button>
                  <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #059669', background: '#022c22', color: '#ffffff', fontWeight: '600', fontSize: '12px', outline: 'none' }}>
                    {clients.map(c => <option key={c.id} value={c.name} style={{ background: '#022c22', color: '#fff' }}>{c.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: CLIENT MANAGEMENT HUB */}
        {activeTab === 'clients' && isAdmin && (
          <div>
            <div style={{ background: '#064e3b', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#ffffff', fontWeight: '700' }}>✨ Προσθήκη Νέου Πελάτη (Πλήρης Φάκελος & Ανθρωπομετρικά)</h3>
              <form onSubmit={addClient} style={{ display: 'grid', gap: '12px' }}>
                <input type="text" placeholder="Ονοματεπώνυμο" value={clientName} onChange={(e) => setClientName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
                <input type="text" placeholder="Στόχος Διατροφής" value={clientGoal} onChange={(e) => setClientGoal(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input type="text" placeholder="Τηλέφωνο" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} style={{ padding: '10px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
                  <input type="email" placeholder="Email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} style={{ padding: '10px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#34d399' }}>Βάρος (kg):</label>
                    <input type="number" value={clientWeight} onChange={(e) => setClientWeight(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#34d399' }}>Ύψος (cm):</label>
                    <input type="number" value={clientHeight} onChange={(e) => setClientHeight(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#34d399' }}>Ηλικία:</label>
                    <input type="number" value={clientAge} onChange={(e) => setClientAge(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#34d399' }}>Φύλο:</label>
                    <select value={clientGender} onChange={(e) => setClientGender(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }}>
                      <option value="female">Γυναίκα</option>
                      <option value="male">Άνδρας</option>
                    </select>
                  </div>
                </div>

                <textarea placeholder="Κλινικές Σημειώσεις / Ιστορικό..." value={clientNotes} onChange={(e) => setClientNotes(e.target.value)} rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />

                <button type="submit" style={{ width: '100%', padding: '12px', background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>+ Δημιουργία Πλήρους Φακέλου Πελάτη</button>
              </form>
            </div>

            <div style={{ background: '#064e3b', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#ffffff', fontWeight: '700' }}>📁 Κατάλογος Πελατών ({clients.length})</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {clients.map(c => (
                  <div key={c.id} style={{ background: '#022c22', padding: '14px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={c.avatar} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <h4 style={{ margin: 0, color: '#fff', fontSize: '14px' }}>{c.name}</h4>
                        <div style={{ fontSize: '11px', color: '#6ee7b7' }}>{c.goal} — BMR: {c.bmr || '-'} | TDEE: {c.tdee || '-'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => { setSelectedClient(c.name); setActiveTab('mealplanner'); }} style={{ padding: '6px 10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>Πλάνο</button>
                      <button onClick={() => startEditClient(c)} style={{ padding: '6px 10px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>✏️ Προφίλ</button>
                      <button onClick={() => deleteClient(c.id)} style={{ padding: '6px 10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MEAL PLANNER & DYNAMIC SPEEDOMETER */}
        {activeTab === 'mealplanner' && (
          <div>
            {isAdmin && (
              <div style={{ background: '#064e3b', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#ffffff', fontWeight: '700' }}>🤖 Admin: Δημιουργία Πλάνου μέσω Gemini AI (Μόνο Τρόφιμα & Γραμμάρια)</h3>
                <div style={{ display: 'grid', gap: '10px', marginBottom: '10px' }}>
                  <select value={targetMealDay} onChange={(e) => setTargetMealDay(e.target.value)} style={{ padding: '10px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }}>
                    {daysOfWeek.map(d => <option key={d}>{d}</option>)}
                  </select>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button onClick={handleGenerateSingle} style={{ padding: '10px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>✨ Μόνο για {targetMealDay}</button>
                    <button onClick={handleGenerateFullWeek} style={{ padding: '10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>🚀 Ολόκληρη Εβδομάδα (7 Ημέρες)</button>
                  </div>
                </div>
              </div>
            )}

            {/* EXCEL TABLE VIEW FOR PRINTING */}
            <div style={{ background: '#064e3b', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#ffffff', fontWeight: '700' }}>📊 Πίνακας Εβδομαδιαίου Πλάνου (Clean View)</h3>
                <button onClick={() => window.print()} style={{ padding: '8px 14px', background: '#334155', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>🖨️ Εκτύπωση PDF / Excel</button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#022c22', color: '#34d399' }}>
                      <th style={{ padding: '8px', border: '1px solid #047857' }}>ΓΕΥΜΑ</th>
                      {daysOfWeek.map(d => <th key={d} style={{ padding: '8px', border: '1px solid #047857' }}>{d.toUpperCase()}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {mealTypesList.map(mType => (
                      <tr key={mType}>
                        <td style={{ padding: '8px', border: '1px solid #047857', fontWeight: '700', color: '#fde047' }}>{mType}</td>
                        {daysOfWeek.map(day => {
                          const mealItem = (clientMeals[selectedClient] || []).find(m => m.day === day && m.type === mType);
                          return (
                            <td key={day} style={{ padding: '8px', border: '1px solid #047857', color: '#cbd5e1' }}>
                              {mealItem ? cleanMealText(mealItem.text) : (mType.includes('Σνακ') ? '1 φρούτο εποχής ή 30g ξηροί καρποί' : '-')}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CLIENT VIEW: DYNAMIC SPEEDOMETER + TODAY'S PLAN */}
            {!isAdmin && (
              <div style={{ background: '#064e3b', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                <div style={{ background: '#022c22', padding: '16px', borderRadius: '12px', textAlign: 'center', marginBottom: '20px', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#34d399' }}>⚡ Πρόοδος Ημερήσιων Γευμάτων (Σήμερα)</h4>
                  <div style={{ position: 'relative', width: '160px', height: '80px', margin: '0 auto', overflow: 'hidden' }}>
                    <div style={{ width: '160px', height: '160px', borderRadius: '50%', background: 'conic-gradient(from 180deg at 50% 100%, #ef4444 0deg, #eab308 90deg, #10b981 180deg)', position: 'absolute', top: 0, left: 0 }}></div>
                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#022c22', position: 'absolute', top: '20px', left: '20px' }}></div>
                    <div style={{ width: '4px', height: '50px', background: '#fff', position: 'absolute', bottom: '0px', left: '78px', transformOrigin: 'bottom center', transform: `rotate(${needleRotation}deg)`, transition: 'transform 0.5s ease' }}></div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#fff', marginTop: '8px', fontWeight: '700' }}>
                    Συμπλήρωση: <span style={{ color: '#fde047' }}>{speedometerPercentage}%</span> ({loggedTodayCount}/5 γεύματα)
                  </div>
                </div>

                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#fff', fontWeight: '700' }}>📅 Πλάνο Ημέρας (Πέμπτη)</h3>
                <div style={{ display: 'grid', gap: '8px', marginBottom: '20px' }}>
                  {mealTypesList.map(mType => {
                    const mealObj = (clientMeals[selectedClient] || []).find(m => m.day === 'Πέμπτη' && m.type === mType);
                    const defaultSnackText = mType.includes('Σνακ 1') ? '1 φρούτο εποχής & 5 κάσιους' : mType.includes('Σνακ 2') ? '1 γιαούρτι 2% ή 30g αμύγδαλα' : 'Δεν έχει οριστεί γεύμα';
                    const displayText = mealObj ? cleanMealText(mealObj.text) : defaultSnackText;

                    return (
                      <div key={mType} style={{ background: '#022c22', padding: '10px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <div style={{ fontSize: '12px', flex: 1, paddingRight: '8px' }}>
                          <strong style={{ color: '#fde047' }}>{mType}:</strong> <span style={{ color: '#fff' }}>{displayText}</span>
                        </div>
                        <button 
                          onClick={() => handleLogMealFromPlan(displayText, mType)} 
                          title="Προσθήκη στις καταγραφές"
                          style={{ background: '#059669', color: '#fff', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontWeight: '700', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                        >
                          +
                        </button>
                      </div>
                    );
                  })}
                </div>

                <h4 style={{ fontSize: '13px', color: '#34d399', marginBottom: '8px' }}>📜 Καταγεγραμμένα Γεύματα Σήμερα ({todayDateStr})</h4>
                {todayLogs.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Δεν έχετε προσθέσει ακόμα γεύματα για σήμερα. Πατήστε το (+) παραπάνω.</p>
                ) : (
                  todayLogs.map(item => (
                    <div key={item.id} style={{ background: '#022c22', padding: '10px', borderRadius: '8px', marginBottom: '6px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #10b981' }}>
                      <span>✅ {item.description}</span>
                      <button onClick={() => handleRemoveJournalEntry(item.id)} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>✕ Αφαίρεση</button>
                    </div>
                  ))
                )}

                <h4 style={{ margin: '16px 0 8px 0', fontSize: '14px', color: '#fff' }}>Φάγαμε κάτι άλλο;</h4>
                <form onSubmit={handleExtraFoodSubmit} style={{ display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                    <input type="text" placeholder="Τρόφιμο / ποσότητα..." value={extraFoodText} onChange={(e) => setExtraFoodText(e.target.value)} style={{ padding: '10px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857', fontSize: '12px' }} />
                    <input type="time" value={extraFoodTime} onChange={(e) => setExtraFoodTime(e.target.value)} style={{ padding: '10px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857', fontSize: '12px' }} />
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, false, true)} style={{ padding: '6px', borderRadius: '8px', background: '#022c22', color: '#cbd5e1', fontSize: '11px' }} />
                  {extraFoodImage && <img src={extraFoodImage} alt="extra" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />}
                  <button type="submit" style={{ padding: '10px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>+ Καταγραφή Έξτρα Γεύματος</button>
                </form>

              </div>
            )}
          </div>
        )}

        {/* TAB 3: APPOINTMENTS WITH DATE RANGE GENERATOR & PERMANENT SLOTS */}
        {activeTab === 'appointments' && (
          <div style={{ display: 'grid', gap: '20px' }}>
            {isAdmin && (
              <div style={{ background: '#064e3b', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#ffffff', fontWeight: '700' }}>👑 Admin: Μαζικός Ορισμός Εύρους Διαθέσιμων Ώρων (Date Range)</h3>
                <form onSubmit={generateRangeSlots} style={{ display: 'grid', gap: '12px' }}>
                  
                  {/* DATE RANGE SELECTOR */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#34d399', fontWeight: '700' }}>Από Ημερομηνία:</label>
                      <input type="date" value={slotStartDate} onChange={(e) => setSlotStartDate(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#34d399', fontWeight: '700' }}>Έως Ημερομηνία:</label>
                      <input type="date" value={slotEndDate} onChange={(e) => setSlotEndDate(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#34d399', fontWeight: '700' }}>Βήμα Ώρας:</label>
                      <select value={slotStep} onChange={(e) => setSlotStep(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }}>
                        <option value={30}>Ανά 30 λεπτά</option>
                        <option value={60}>Ανά 1 ώρα</option>
                        <option value={15}>Ανά 15 λεπτά</option>
                      </select>
                    </div>
                  </div>

                  {/* TIME RANGE SELECTOR */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#fde047', fontWeight: '700' }}>Πρωινό Εύρος (Από - Έως):</label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input type="time" value={slotTimeStart1} onChange={(e) => setSlotTimeStart1(e.target.value)} style={{ padding: '8px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857', width: '50%' }} />
                        <input type="time" value={slotTimeEnd1} onChange={(e) => setSlotTimeEnd1(e.target.value)} style={{ padding: '8px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857', width: '50%' }} />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: '#fde047', fontWeight: '700' }}>Απογευματινό Εύρος (Από - Έως):</label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input type="time" value={slotTimeStart2} onChange={(e) => setSlotTimeStart2(e.target.value)} style={{ padding: '8px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857', width: '50%' }} />
                        <input type="time" value={slotTimeEnd2} onChange={(e) => setSlotTimeEnd2(e.target.value)} style={{ padding: '8px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857', width: '50%' }} />
                      </div>
                    </div>
                  </div>

                  <button type="submit" style={{ padding: '12px', background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>🚀 Αυτόματη Δημιουργία Slots για ΟΛΕΣ τις Ημέρες</button>
                </form>

                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ color: '#34d399', fontSize: '12px', marginBottom: '8px' }}>Ενεργά Διαθέσιμα Slots ({availableSlots.length}):</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                    {availableSlots.map(s => (
                      <span key={s.id} style={{ background: '#022c22', border: '1px solid #047857', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        📅 {s.date} ⏰ {s.time}
                        <button onClick={() => deleteSlot(s.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div style={{ background: '#064e3b', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#ffffff', fontWeight: '700' }}>📅 Κλείσιμο Ραντεβού (Calendar-based)</h3>
              
              <h4 style={{ color: '#34d399', fontSize: '13px', marginBottom: '8px' }}>📋 Επόμενο Προγραμματισμένο Ραντεβού:</h4>
              <div style={{ display: 'grid', gap: '8px', marginBottom: '20px' }}>
                {appointments.filter(a => a.client === selectedClient).length === 0 ? (
                  <p style={{ color: '#cbd5e1', fontSize: '12px' }}>Δεν υπάρχουν ενεργά ραντεβού.</p>
                ) : (
                  appointments.filter(a => a.client === selectedClient).map(app => (
                    <div key={app.id} style={{ background: '#022c22', padding: '12px', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.3)', fontSize: '13px' }}>
                      📅 <strong>{app.date} στις {app.time}</strong> — <span style={{ color: '#fde047', fontWeight: '700' }}>{app.type}</span>
                    </div>
                  ))
                )}
              </div>

              {!isAdmin && (
                <form onSubmit={handleBookSlot} style={{ display: 'grid', gap: '16px', background: '#022c22', padding: '20px', borderRadius: '14px', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div>
                    <label style={{ fontSize: '13px', color: '#fde047', fontWeight: '700', display: 'block', marginBottom: '6px' }}>1️⃣ Επιλέξτε Τύπο Συνεδρίας:</label>
                    <select value={bookingType} onChange={(e) => setBookingType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#064e3b', color: '#fff', border: '1px solid #047857', fontSize: '12px', fontWeight: '600' }}>
                      {Object.keys(sessionDurations).map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', color: '#fde047', fontWeight: '700', display: 'block', marginBottom: '6px' }}>2️⃣ Επιλέξτε Ημερομηνία από το Ημερολόγιο:</label>
                    <input 
                      type="date" 
                      value={selectedCalendarDate} 
                      onChange={(e) => { setSelectedCalendarDate(e.target.value); setSelectedSlotTime(null); }} 
                      style={{ padding: '10px', borderRadius: '8px', background: '#064e3b', color: '#fff', border: '1px solid #047857', fontSize: '13px', width: '100%' }} 
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', color: '#34d399', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
                      3️⃣ Διαθέσιμες Ώρες για τις <span style={{ color: '#fff', textDecoration: 'underline' }}>{selectedCalendarDate}</span>:
                    </label>
                    
                    {filteredAvailableSlots.length === 0 ? (
                      <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#fca5a5', fontSize: '12px' }}>
                        ❌ Δεν υπάρχουν διαθέσιμες ώρες για την επιλεγμένη ημερομηνία.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px' }}>
                        {filteredAvailableSlots.map(slot => (
                          <button
                            type="button"
                            key={slot.id}
                            onClick={() => setSelectedSlotTime(slot.time)}
                            style={{
                              padding: '10px 6px',
                              borderRadius: '8px',
                              border: selectedSlotTime === slot.time ? '2px solid #fde047' : '1px solid #047857',
                              background: selectedSlotTime === slot.time ? '#059669' : '#064e3b',
                              color: '#fff',
                              fontSize: '13px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              textAlign: 'center'
                            }}
                          >
                            ⏰ {slot.time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedSlotTime && (
                    <button type="submit" style={{ padding: '12px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', marginTop: '6px' }}>
                      🚀 Κλείσιμο Ραντεβού στις {selectedSlotTime} ({bookingType})
                    </button>
                  )}
                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PROGRESS */}
        {activeTab === 'progress' && (
          <div style={{ background: '#064e3b', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#ffffff', fontWeight: '700' }}>📈 Πρόοδος & Ποσοστό Επιτυχίας Στόχου</h3>
            <div style={{ background: '#022c22', padding: '20px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#fde047', marginBottom: '12px', fontWeight: '600' }}>Γραμμική Πρόοδος Συμμόρφωσης Στόχου</div>
              <div style={{ height: '12px', background: '#064e3b', borderRadius: '6px', overflow: 'hidden', position: 'relative', marginBottom: '16px' }}>
                <div style={{ width: '85%', height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '6px' }}></div>
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1' }}>Εξαιρετική πορεία επίτευξης κλινικών στόχων διατροφής. Συνεχίστε έτσι!</div>
            </div>
          </div>
        )}

        {/* TAB 5: CALCULATOR (ADMIN ONLY) */}
        {activeTab === 'calc' && isAdmin && (
          <div style={{ background: '#064e3b', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#fff', fontWeight: '700' }}>⚡ Υπολογιστής BMR & TDEE (Admin Only)</h3>
            <form onSubmit={calculateBmr} style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input type="number" value={calcWeight} onChange={(e) => setCalcWeight(Number(e.target.value))} placeholder="Βάρος (kg)" style={{ padding: '10px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
                <input type="number" value={calcHeight} onChange={(e) => setCalcHeight(Number(e.target.value))} placeholder="Ύψος (cm)" style={{ padding: '10px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input type="number" value={calcAge} onChange={(e) => setCalcAge(Number(e.target.value))} placeholder="Ηλικία" style={{ padding: '10px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
                <select value={calcGender} onChange={(e) => setCalcGender(e.target.value)} style={{ padding: '10px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }}>
                  <option value="female">Γυναίκα</option>
                  <option value="male">Άνδρας</option>
                </select>
              </div>
              <button type="submit" style={{ padding: '10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Υπολογισμός & Αποθήκευση στον Πελάτη</button>
            </form>

            {calcResult && (
              <div style={{ marginTop: '16px', background: '#022c22', padding: '14px', borderRadius: '10px', border: '1px solid #10b981', display: 'flex', justifyContent: 'space-around' }}>
                <div>⚡ BMR: <strong>{calcResult.bmr} kcal</strong></div>
                <div>🔥 TDEE: <strong>{calcResult.tdee} kcal</strong></div>
                <div>📏 BMI: <strong>{calcResult.bmi}</strong></div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: MEASUREMENTS (ADMIN ONLY) */}
        {activeTab === 'measurements' && isAdmin && (
          <div style={{ background: '#064e3b', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#fff', fontWeight: '700' }}>📏 Σωματικές Μετρήσεις & Λιπομέτρηση</h3>
            <form onSubmit={addMeasurement} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr)) auto', gap: '8px', marginBottom: '16px' }}>
              <input type="number" placeholder="Βάρος (kg)" value={mWeight} onChange={(e) => setMWeight(e.target.value)} required style={{ padding: '10px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
              <input type="number" placeholder="Λίπος (%)" value={mFat} onChange={(e) => setMFat(e.target.value)} style={{ padding: '10px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
              <input type="number" placeholder="Μέση (cm)" value={mWaist} onChange={(e) => setMWaist(e.target.value)} style={{ padding: '10px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
              <input type="number" placeholder="Περιφέρεια (cm)" value={mHips} onChange={(e) => setMHips(e.target.value)} style={{ padding: '10px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
              <button type="submit" style={{ padding: '10px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>+ Καταγραφή</button>
            </form>

            <div style={{ display: 'grid', gap: '8px' }}>
              {(clientMeasurements[selectedClient] || []).map(m => (
                <div key={m.id} style={{ background: '#022c22', padding: '10px', borderRadius: '8px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>📅 {m.date}</span>
                  <span>⚖️ {m.weight} kg | 🩸 {m.fat}% Λίπος | 📏 Μέση: {m.waist} cm</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* EDIT CLIENT PROFILE MODAL */}
      {editingClient && isAdmin && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2, 44, 34, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000, padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '480px', background: '#064e3b', padding: '24px', borderRadius: '20px', border: '1px solid #10b981', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 14px 0', color: '#fff' }}>✏️ Επεξεργασία Προφίλ: {editingClient.name}</h3>
            <form onSubmit={saveClientEdit} style={{ display: 'grid', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#34d399' }}>Ονοματεπώνυμο:</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#34d399' }}>Στόχος:</label>
                <input type="text" value={editGoal} onChange={(e) => setEditGoal(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#34d399' }}>Τηλέφωνο:</label>
                  <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#34d399' }}>Email:</label>
                  <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#34d399' }}>Βάρος (kg):</label>
                  <input type="number" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#34d399' }}>Ύψος (cm):</label>
                  <input type="number" value={editHeight} onChange={(e) => setEditHeight(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#34d399' }}>Ηλικία:</label>
                  <input type="number" value={editAge} onChange={(e) => setEditAge(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#34d399' }}>Κλινικές Σημειώσεις:</label>
                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows="3" style={{ width: '100%', padding: '8px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                <button type="submit" style={{ padding: '10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Αποθήκευση</button>
                <button type="button" onClick={() => setEditingClient(null)} style={{ padding: '10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Ακύρωση</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN PIN MODAL */}
      {showPinModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2, 44, 34, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '360px', background: '#064e3b', padding: '24px', borderRadius: '20px', textAlign: 'center', border: '1px solid #10b981' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>Είσοδος Διαχειριστή</h3>
            <form onSubmit={handlePinSubmit} style={{ display: 'grid', gap: '10px' }}>
              <input type="password" maxLength="4" placeholder="****" value={inputPin} onChange={(e) => setInputPin(e.target.value)} required autoFocus style={{ padding: '10px', textAlign: 'center', fontSize: '20px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
              <button type="submit" style={{ padding: '10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Είσοδος</button>
              <button type="button" onClick={() => setShowPinModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>Ακύρωση</button>
            </form>
          </div>
        </div>
      )}

      {/* API KEY MODAL */}
      {showApiKeyModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2, 44, 34, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '400px', background: '#064e3b', padding: '24px', borderRadius: '20px', border: '1px solid #10b981' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>🔑 Ρύθμιση Gemini API Key</h3>
            <form onSubmit={handleSaveApiKey} style={{ display: 'grid', gap: '10px' }}>
              <input type="text" placeholder="AIzaSy..." value={tempApiKey} onChange={(e) => setTempApiKey(e.target.value)} required style={{ padding: '10px', borderRadius: '8px', background: '#022c22', color: '#fff', border: '1px solid #047857' }} />
              <button type="submit" style={{ padding: '10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Αποθήκευση</button>
              <button type="button" onClick={() => setShowApiKeyModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>Ακύρωση</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
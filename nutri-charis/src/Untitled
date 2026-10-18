import React, { useState, useEffect } from 'react';
import './index.css';

const MAIN_DB_KEY = 'nutricharis_app_db_v2';
const APPOINTMENTS_KEY = 'nutricharis_app_appointments_v1';
const MEALS_KEY = 'nutricharis_app_meals_v1';
const MEASUREMENTS_KEY = 'nutricharis_app_measurements_v1';
const GEMINI_API_KEY_STORAGE = 'nutricharis_gemini_api_key';
const ADMIN_SESSION_KEY = 'nutricharis_admin_session';
const ADMIN_PIN = '2026';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem(ADMIN_SESSION_KEY) === 'true');
  const [showPinModal, setShowPinModal] = useState(false);
  const [inputPin, setInputPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const [activeTab, setActiveTab] = useState('mealplanner');
  const [selectedClient, setSelectedClient] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  const [apiKey, setApiKey] = useState(() => localStorage.getItem(GEMINI_API_KEY_STORAGE) || '');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  const [clients, setClients] = useState(() => {
    try {
      const saved = localStorage.getItem(MAIN_DB_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      { 
        id: 1, 
        name: "Χάρις Φ", 
        goal: "Κλινική Απώλεια Λίπους & Ρύθμιση Μεταβολισμού", 
        phone: "6986515179", 
        email: "charis@nutricharis.gr",
        age: 22, 
        weight: 59, 
        height: 162, 
        gender: 'female', 
        activity: 1.2, 
        bmr: 1332, 
        tdee: 1832, 
        bmi: '22.5',
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
        clinicalNotes: "ΑΥΤΙΣΜΟΣ"
      }
    ];
  });

  const [appointments, setAppointments] = useState(() => {
    try {
      const saved = localStorage.getItem(APPOINTMENTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [clientMeals, setClientMeals] = useState(() => {
    try {
      const saved = localStorage.getItem(MEALS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  const [clientMeasurements, setClientMeasurements] = useState(() => {
    try {
      const saved = localStorage.getItem(MEASUREMENTS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  useEffect(() => { setIsLoaded(true); }, []);

  useEffect(() => {
    if (isLoaded) try { localStorage.setItem(MAIN_DB_KEY, JSON.stringify(clients)); } catch (err) {}
  }, [clients, isLoaded]);

  useEffect(() => {
    if (isLoaded) try { localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments)); } catch (err) {}
  }, [appointments, isLoaded]);

  useEffect(() => {
    if (isLoaded) try { localStorage.setItem(MEALS_KEY, JSON.stringify(clientMeals)); } catch (err) {}
  }, [clientMeals, isLoaded]);

  useEffect(() => {
    if (isLoaded) try { localStorage.setItem(MEASUREMENTS_KEY, JSON.stringify(clientMeasurements)); } catch (err) {}
  }, [clientMeasurements, isLoaded]);

  useEffect(() => {
    if (clients.length > 0 && (!selectedClient || !clients.find(c => c.name === selectedClient))) {
      setSelectedClient(clients[0].name);
    }
  }, [clients, selectedClient]);

  const activeClientObj = clients.find(c => c.name === selectedClient) || clients[0];

  const [clientName, setClientName] = useState('');
  const [clientGoal, setClientGoal] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [clientAvatar, setClientAvatar] = useState('');

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
  const [targetMealDay, setTargetMealDay] = useState('Δευτέρα');
  const [mealDay, setMealDay] = useState('Δευτέρα');
  const [mealType, setMealType] = useState('🌅 1. Πρωινό');
  const [mealText, setMealText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');

  const [appDate, setAppDate] = useState(new Date().toISOString().split('T')[0]);
  const [appTime, setAppTime] = useState('');
  const [appType, setAppType] = useState('1η Κλινική Συνεδρία & Λιπομέτρηση');

  const [calcFormula, setCalcFormula] = useState('harris');
  const [calcGender, setCalcGender] = useState('female');
  const [calcAge, setCalcAge] = useState(22);
  const [calcWeight, setCalcWeight] = useState(59);
  const [calcHeight, setCalcHeight] = useState(162);
  const [calcActivity, setCalcActivity] = useState(1.2);
  const [calcResult, setCalcResult] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeClientObj) {
      setCalcWeight(activeClientObj.weight || 59);
      setCalcHeight(activeClientObj.height || 162);
      setCalcAge(activeClientObj.age || 22);
      setCalcGender(activeClientObj.gender || 'female');
      setCalcActivity(activeClientObj.activity || 1.2);
    }
  }, [selectedClient]);

  const [mWeight, setMWeight] = useState('');
  const [mFat, setMFat] = useState('');

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

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    if (!tempApiKey) return;
    const cleanKey = tempApiKey.trim();
    localStorage.setItem(GEMINI_API_KEY_STORAGE, cleanKey);
    setApiKey(cleanKey);
    setShowApiKeyModal(false);
    setTempApiKey('');
  };

  const calculateBmr = (e) => {
    if (e) e.preventDefault();
    let bmrVal = calcFormula === 'mifflin'
      ? (10 * calcWeight) + (6.25 * calcHeight) - (5 * calcAge) + (calcGender === 'female' ? -161 : 5)
      : (calcGender === 'female' ? 447.593 + (9.247 * calcWeight) + (3.098 * calcHeight) - (4.330 * calcAge) : 88.362 + (13.397 * calcWeight) + (4.799 * calcHeight) - (5.677 * calcAge));
    
    const calculatedBmr = Math.round(bmrVal);
    const calculatedTdee = Math.round(bmrVal * calcActivity);
    const heightInM = calcHeight / 100;
    const calculatedBmi = (calcWeight / (heightInM * heightInM)).toFixed(1);

    setCalcResult({ bmr: calculatedBmr, tdee: calculatedTdee, bmi: calculatedBmi });

    const updatedClients = clients.map(c => c.name === selectedClient ? {
      ...c,
      weight: calcWeight,
      height: calcHeight,
      age: calcAge,
      gender: calcGender,
      activity: calcActivity,
      bmr: calculatedBmr,
      tdee: calculatedTdee,
      bmi: calculatedBmi
    } : c);

    setClients(updatedClients);
  };

  const generateRealAiMeals = async () => {
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

    if (!activeClientObj) return;

    setAiLoading(true);

    const promptText = `
Είσαι κορυφαίος Κλινικός Διαιτολόγος.
Στοιχεία πελάτη:
- Όνομα: ${activeClientObj.name}
- Φύλο: ${activeClientObj.gender === 'female' ? 'Γυναίκα' : 'Άνδρας'}
- Ηλικία: ${activeClientObj.age}
- Βάρος: ${activeClientObj.weight} kg, Ύψος: ${activeClientObj.height} cm
- BMR: ${activeClientObj.bmr || 'N/A'}, TDEE: ${activeClientObj.tdee || 'N/A'}
- Στόχος: ${activeClientObj.goal}
- Κλινικές Σημειώσεις: ${activeClientObj.clinicalNotes || 'Καμία'}
- Ημέρα Σχεδιασμού: ${targetMealDay}
- Οδηγία χρήστη: ${aiCustomPrompt || 'Πλήρες ημερήσιο πλάνο.'}

ΟΔΗΓΙΕΣ:
Δημιούργησε ένα ΠΛΗΡΕΣ ημερήσιο πλάνο ακριβώς 5 ΓΕΥΜΑΤΩΝ για την ημέρα ${targetMealDay} (1. Πρωινό, 2. Δεκατιανό, 3. Μεσημεριανό, 4. Απογευματινό, 5. Βραδινό).
Για κάθε γεύμα γράψε: τρόφιμα, μακροθρεπτικά (Π, Υ, Λ), θερμίδες (kcal) και κλινική ανάλυση.

Επίστρεψε ΑΠΟΚΛΕΙΣΤΙΚΑ ΚΑΙ ΜΟΝΟ ένα έγκυρο JSON array με 5 αντικείμενα (χωρίς markdown codeblocks, χωρίς άλλα σχόλια):
[
  {"day": "${targetMealDay}", "type": "🌅 1. Πρωινό", "text": "Περιγραφή... | Μακρο: 25g Π, 35g Υ, 10g Λ (320 kcal) | Κλινική Ανάλυση: ..."},
  {"day": "${targetMealDay}", "type": "🍏 2. Δεκατιανό", "text": "Περιγραφή... | Μακρο: 10g Π, 20g Υ, 5g Λ (150 kcal) | Κλινική Ανάλυση: ..."},
  {"day": "${targetMealDay}", "type": "🥗 3. Μεσημεριανό", "text": "Περιγραφή... | Μακρο: 40g Π, 45g Υ, 15g Λ (480 kcal) | Κλινική Ανάλυση: ..."},
  {"day": "${targetMealDay}", "type": "🥜 4. Απογευματινό", "text": "Περιγραφή... | Μακρο: 12g Π, 15g Υ, 8g Λ (170 kcal) | Κλινική Ανάλυση: ..."},
  {"day": "${targetMealDay}", "type": "🌙 5. Βραδινό", "text": "Περιγραφή... | Μακρο: 35g Π, 20g Υ, 10g Λ (310 kcal) | Κλινική Ανάλυση: ..."}
]
`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Σφάλμα API');
      }

      const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedMeals = JSON.parse(cleanJson);

      if (Array.isArray(parsedMeals)) {
        setAiSuggestions(parsedMeals);
      } else {
        alert('Σφάλμα στη μορφή απόκρισης του AI.');
      }
    } catch (err) {
      console.error(err);
      alert(`Σφάλμα AI: ${err.message}.`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleImageUpload = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 150;
        canvas.height = 150;
        ctx.drawImage(img, 0, 0, 150, 150);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

        if (isEdit) setEditAvatar(compressedBase64);
        else setClientAvatar(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const addClient = (e) => {
    e.preventDefault();
    if (!clientName) return;
    const defaultAvatar = clientAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(clientName)}`;
    
    const newClient = {
      id: Date.now(),
      name: clientName,
      goal: clientGoal || 'Κλινική Διατροφή & Ευεξία',
      phone: clientPhone || '',
      email: clientEmail || '',
      avatar: defaultAvatar,
      age: 28,
      weight: 65,
      height: 170,
      gender: 'female',
      activity: 1.375,
      bmr: 1400,
      tdee: 1900,
      clinicalNotes: clientNotes || 'Χωρίς σημειώσεις.'
    };

    setClients(prev => [...prev, newClient]);
    setSelectedClient(clientName);
    setClientName(''); setClientGoal(''); setClientPhone(''); setClientEmail(''); setClientNotes(''); setClientAvatar('');
  };

  const deleteClient = (id) => {
    if (!isAdmin) return;
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const startEditClient = (client) => {
    if (!isAdmin) {
      setShowPinModal(true);
      return;
    }
    setEditingClient(client);
    setEditName(client.name);
    setEditGoal(client.goal || '');
    setEditPhone(client.phone || '');
    setEditEmail(client.email || '');
    setEditWeight(client.weight || 60);
    setEditHeight(client.height || 165);
    setEditAge(client.age || 25);
    setEditNotes(client.clinicalNotes || '');
    setEditAvatar(client.avatar || '');
  };

  const saveClientEdit = (e) => {
    e.preventDefault();
    if (!editingClient || !editName || !isAdmin) return;

    const w = Number(editWeight) || 60;
    const h = Number(editHeight) || 165;
    const a = Number(editAge) || 25;
    
    const calculatedBmr = Math.round((10 * w) + (6.25 * h) - (5 * a) - 161);
    const calculatedTdee = Math.round(calculatedBmr * 1.375);

    const updated = clients.map(c => c.id === editingClient.id ? {
      ...c,
      name: editName,
      goal: editGoal,
      phone: editPhone,
      email: editEmail,
      weight: w,
      height: h,
      age: a,
      bmr: calculatedBmr,
      tdee: calculatedTdee,
      clinicalNotes: editNotes,
      avatar: editAvatar || c.avatar
    } : c);

    setClients(updated);
    setSelectedClient(editName);
    setEditingClient(null);
  };

  const applyAiSuggestions = () => {
    if (!aiSuggestions) return;
    const current = clientMeals[selectedClient] || [];
    const newItems = aiSuggestions.map((s, idx) => ({ id: Date.now() + idx, ...s }));
    setClientMeals({ ...clientMeals, [selectedClient]: [...current, ...newItems] });
    setAiSuggestions(null);
  };

  const addMeal = (e) => {
    e.preventDefault();
    if (!mealText) return;
    const current = clientMeals[selectedClient] || [];
    const updated = [...current, { id: Date.now(), day: mealDay, type: mealType, text: mealText }];
    setClientMeals({ ...clientMeals, [selectedClient]: updated });
    setMealText('');
  };

  const addAppointment = (e) => {
    e.preventDefault();
    if (!appDate || !appTime) return;
    setAppointments([...appointments, { id: Date.now(), date: appDate, time: appTime, client: selectedClient, type: appType }]);
    setAppTime('');
  };

  const addMeasurement = (e) => {
    e.preventDefault();
    if (!mWeight) return;
    const current = clientMeasurements[selectedClient] || [];
    const updated = [...current, { id: Date.now(), date: new Date().toLocaleDateString('el-GR'), weight: Number(mWeight), fat: Number(mFat) || 0 }];
    setClientMeasurements({ ...clientMeasurements, [selectedClient]: updated });
    setMWeight(''); setMFat('');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#022c22', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: '60px' }}>
      
      {/* NAVBAR */}
      <nav style={{ background: '#064e3b', borderBottom: '1px solid rgba(16, 185, 129, 0.25)', padding: '12px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🌿</span>
            <div>
              <h1 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>NutriCharis</h1>
              <span style={{ fontSize: '10px', color: '#34d399', fontWeight: '600' }}>Clinical AI OS</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={() => { setTempApiKey(apiKey); setShowApiKeyModal(true); }} 
              style={{ background: apiKey ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.25)', border: apiKey ? '1px solid #10b981' : '1px solid #ef4444', color: apiKey ? '#34d399' : '#fca5a5', padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              🔑 {apiKey ? 'API Connected' : 'Βάλε API Key'}
            </button>

            {isAdmin ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', padding: '4px 10px', borderRadius: '20px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#34d399' }}>👑 Admin</span>
                <button onClick={handleLogoutAdmin} title="Έξοδος Admin" style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '12px' }}>🔒</button>
              </div>
            ) : (
              <button onClick={() => setShowPinModal(true)} style={{ background: 'rgba(234, 179, 8, 0.15)', border: '1px solid #eab308', color: '#fde047', padding: '5px 12px', borderRadius: '20px', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}>
                🔑 Admin
              </button>
            )}
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          {isAdmin && (
            <button onClick={() => setActiveTab('clients')} style={{ whiteSpace: 'nowrap', padding: '8px 12px', borderRadius: '10px', border: 'none', background: activeTab === 'clients' ? '#059669' : 'rgba(2, 44, 34, 0.6)', color: activeTab === 'clients' ? '#fff' : '#94a3b8', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>👥 Πελάτες</button>
          )}
          <button onClick={() => setActiveTab('mealplanner')} style={{ whiteSpace: 'nowrap', padding: '8px 12px', borderRadius: '10px', border: 'none', background: activeTab === 'mealplanner' ? '#059669' : 'rgba(2, 44, 34, 0.6)', color: activeTab === 'mealplanner' ? '#fff' : '#94a3b8', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>📋 Εβδομαδιαίο Πλάνο AI</button>
          <button onClick={() => setActiveTab('appointments')} style={{ whiteSpace: 'nowrap', padding: '8px 12px', borderRadius: '10px', border: 'none', background: activeTab === 'appointments' ? '#059669' : 'rgba(2, 44, 34, 0.6)', color: activeTab === 'appointments' ? '#fff' : '#94a3b8', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>📅 Ραντεβού</button>
          <button onClick={() => setActiveTab('calc')} style={{ whiteSpace: 'nowrap', padding: '8px 12px', borderRadius: '10px', border: 'none', background: activeTab === 'calc' ? '#059669' : 'rgba(2, 44, 34, 0.6)', color: activeTab === 'calc' ? '#fff' : '#94a3b8', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>⚡ BMR / TDEE</button>
          <button onClick={() => setActiveTab('measurements')} style={{ whiteSpace: 'nowrap', padding: '8px 12px', borderRadius: '10px', border: 'none', background: activeTab === 'measurements' ? '#059669' : 'rgba(2, 44, 34, 0.6)', color: activeTab === 'measurements' ? '#fff' : '#94a3b8', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>📈 Σώμα</button>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '16px auto', padding: '0 12px' }}>

        {/* ACTIVE CLIENT HEADER */}
        {activeClientObj && (
          <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={activeClientObj.avatar} alt="avatar" onClick={() => startEditClient(activeClientObj)} style={{ width: '58px', height: '58px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #10b981', cursor: 'pointer' }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '10px', color: '#34d399', fontWeight: '800' }}>ΕΝΕΡΓΟΣ ΠΕΛΑΤΗΣ:</span>
                <h2 onClick={() => startEditClient(activeClientObj)} style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#fff', cursor: 'pointer' }}>
                  {activeClientObj.name} {isAdmin && '✏️'}
                </h2>
                <div style={{ fontSize: '11px', color: '#6ee7b7', marginTop: '2px' }}>
                  🎯 {activeClientObj.goal || 'Στόχος'} | ⚖️ {activeClientObj.weight || 60} kg | 📏 {activeClientObj.height || 165} cm | ✉️ {activeClientObj.email || 'Χωρίς email'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>⚡ BMR: {activeClientObj.bmr || 1350}</span>
                <span style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#fde047', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>🔥 TDEE: {activeClientObj.tdee || 1850}</span>
              </div>

              {isAdmin && (
                <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #059669', background: '#022c22', color: '#ffffff', fontWeight: '600', fontSize: '12px', outline: 'none' }}>
                  {clients.map(c => <option key={c.id} value={c.name} style={{ background: '#022c22', color: '#fff' }}>{c.name}</option>)}
                </select>
              )}
            </div>

            {isAdmin && activeClientObj.clinicalNotes && (
              <div onClick={() => startEditClient(activeClientObj)} style={{ fontSize: '11px', color: '#fde047', background: 'rgba(202, 138, 4, 0.2)', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}>
                🩺 <strong>Σημειώσεις (Admin Only):</strong> {activeClientObj.clinicalNotes}
              </div>
            )}
          </div>
        )}

        {/* TAB 1: CLIENTS */}
        {activeTab === 'clients' && isAdmin && (
          <div>
            <div style={{ background: '#064e3b', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#ffffff', fontWeight: '700' }}>✨ Προσθήκη Νέου Πελάτη</h3>
              <form onSubmit={addClient} style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Ονοματεπώνυμο</label>
                  <input type="text" placeholder="π.χ. Μαρία Παπαδοπούλου" value={clientName} onChange={(e) => setClientName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#ffffff', outline: 'none', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Στόχος Διατροφής</label>
                  <input type="text" placeholder="π.χ. Απώλεια Βάρους" value={clientGoal} onChange={(e) => setClientGoal(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#ffffff', outline: 'none', fontSize: '13px' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Τηλέφωνο</label>
                    <input type="text" placeholder="6912345678" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#ffffff', outline: 'none', fontSize: '13px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Email</label>
                    <input type="email" placeholder="client@gmail.com" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#ffffff', outline: 'none', fontSize: '13px' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#fde047', fontWeight: '600', display: 'block', marginBottom: '4px' }}>🩺 Ιατρικό Ιστορικό & Σημειώσεις</label>
                  <textarea placeholder="π.χ. Hashimoto, αυτισμός..." value={clientNotes} onChange={(e) => setClientNotes(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#ffffff', outline: 'none', minHeight: '50px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Φωτογραφία (JPG, PNG)</label>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, false)} style={{ width: '100%', padding: '6px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#cbd5e1', fontSize: '12px' }} />
                </div>
                <button type="submit" style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', marginTop: '6px' }}>+ Δημιουργία Φακέλου</button>
              </form>
            </div>

            <div style={{ background: '#064e3b', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#ffffff', fontWeight: '700' }}>📁 Κατάλογος Πελατών ({clients.length})</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {clients.map(c => (
                  <div key={c.id} style={{ background: '#022c22', padding: '14px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                      <img src={c.avatar} alt="avatar" onClick={() => startEditClient(c)} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #10b981', cursor: 'pointer' }} />
                      <div style={{ flex: 1 }}>
                        <h4 onClick={() => startEditClient(c)} style={{ margin: 0, color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>{c.name} ✏️</h4>
                        <div style={{ fontSize: '11px', color: '#6ee7b7', marginTop: '2px' }}>🎯 {c.goal || 'Στόχος'} | 📞 {c.phone || 'N/A'} | ✉️ {c.email || 'N/A'}</div>
                        <div style={{ fontSize: '11px', color: '#34d399', marginTop: '2px' }}>⚖️ <strong>{c.weight || 60} kg</strong> | 📏 {c.height || 165} cm | ⚡ BMR: {c.bmr || 1350} | TDEE: {c.tdee || 1850}</div>
                      </div>
                    </div>

                    {c.clinicalNotes && (
                      <div style={{ fontSize: '10px', color: '#fde047', background: 'rgba(202, 138, 4, 0.15)', padding: '6px 8px', borderRadius: '6px', marginBottom: '10px' }}>
                        🩺 {c.clinicalNotes}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => { setSelectedClient(c.name); setActiveTab('mealplanner'); }} style={{ flex: 1, padding: '8px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '11px', cursor: 'pointer' }}>📋 Πλάνο</button>
                      <button onClick={() => startEditClient(c)} style={{ flex: 1, padding: '8px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '11px', cursor: 'pointer' }}>✏️ Προφίλ</button>
                      <button onClick={() => deleteClient(c.id)} style={{ padding: '8px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '11px', cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div style={{ background: '#064e3b', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#ffffff', fontWeight: '700' }}>📅 Προγραμματισμός Ραντεβού</h3>
            {isAdmin && (
              <form onSubmit={addAppointment} style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Ημερομηνία</label>
                  <input type="date" value={appDate} onChange={(e) => setAppDate(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Ώρα</label>
                  <input type="time" value={appTime} onChange={(e) => setAppTime(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Τύπος Συνεδρίας</label>
                  <select value={appType} onChange={(e) => setAppType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', fontSize: '13px' }}>
                    <option>1η Κλινική Συνεδρία & Λιπομέτρηση</option>
                    <option>Επανεξέταση & Μέτρηση</option>
                    <option>Online Coaching</option>
                  </select>
                </div>
                <button type="submit" style={{ width: '100%', padding: '12px', background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>+ Κλείσιμο Ραντεβού</button>
              </form>
            )}

            <h4 style={{ color: '#fff', marginBottom: '10px', fontSize: '14px' }}>📋 Ιστορικό Ραντεβού για: {selectedClient}</h4>
            <div style={{ display: 'grid', gap: '8px' }}>
              {appointments.filter(a => a.client === selectedClient).length === 0 ? (
                <p style={{ color: '#6ee7b7', fontSize: '13px' }}>Δεν υπάρχουν προγραμματισμένα ραντεβού.</p>
              ) : (
                appointments.filter(a => a.client === selectedClient).map(app => (
                  <div key={app.id} style={{ background: '#022c22', padding: '12px', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px' }}>📅 <strong>{app.date} στις {app.time}</strong> — <span style={{ color: '#34d399' }}>{app.type}</span></div>
                    {isAdmin && <button onClick={() => setAppointments(appointments.filter(x => x.id !== app.id))} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>✕</button>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MEALS & DIRECT GEMINI AI */}
        {activeTab === 'mealplanner' && (
          <div>
            <div style={{ background: '#064e3b', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#ffffff', fontWeight: '700' }}>🤖 Gemini Clinical AI: Εβδομαδιαίο Πλάνο 5 Γευμάτων ανά Ημέρα</h3>
                <span style={{ fontSize: '11px', color: '#6ee7b7' }}>Επιλέξτε ημέρα για άμεση παραγωγή για: <strong>{selectedClient}</strong></span>
              </div>

              {isAdmin && (
                <div style={{ display: 'grid', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label style={{ fontSize: '12px', color: '#6ee7b7', fontWeight: '600', whiteSpace: 'nowrap' }}>📅 Ημέρα AI:</label>
                    <select value={targetMealDay} onChange={(e) => setTargetMealDay(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', fontSize: '12px' }}>
                      {daysOfWeek.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Επιπλέον οδηγίες (π.χ. 'Χωρίς γαλακτοκομικά, έμφαση σε Ω3')..." 
                    value={aiCustomPrompt} 
                    onChange={(e) => setAiCustomPrompt(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', fontSize: '12px' }} 
                  />
                  <button onClick={generateRealAiMeals} style={{ padding: '12px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                    {aiLoading ? `🔄 Δημιουργία για ${targetMealDay}...` : `✨ Δημιουργία 5 Γευμάτων για ${targetMealDay} (Gemini)`}
                  </button>
                </div>
              )}

              <button onClick={() => window.print()} style={{ width: '100%', padding: '10px', background: '#334155', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>🖨️ Εκτύπωση Εβδομαδιαίου Διαιτολογίου</button>
            </div>

            {aiSuggestions && (
              <div style={{ background: '#2e1065', border: '1px solid #7c3aed', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#f3e8ff', fontSize: '14px' }}>🤖 Προτεινόμενα Γεύματα AI για {targetMealDay}:</h4>
                <div style={{ display: 'grid', gap: '10px', marginBottom: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                  {aiSuggestions.map((item, idx) => (
                    <div key={idx} style={{ background: '#4c1d95', padding: '12px', borderRadius: '10px', fontSize: '12px', color: '#ede9fe', borderLeft: '4px solid #c084fc' }}>
                      <strong style={{ color: '#fbcfe8', fontSize: '13px', display: 'block', marginBottom: '4px' }}>{item.day} — {item.type}</strong>
                      <div>{item.text}</div>
                    </div>
                  ))}
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={applyAiSuggestions} style={{ flex: 1, padding: '10px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>+ Προσθήκη στο Πλάνο Πελάτη</button>
                    <button onClick={() => setAiSuggestions(null)} style={{ padding: '10px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>✕</button>
                  </div>
                )}
              </div>
            )}

            {isAdmin && (
              <div style={{ background: '#064e3b', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#ffffff', fontWeight: '700' }}>✍️ Χειροκίνητη Προσθήκη Γεύματος</h3>
                <form onSubmit={addMeal} style={{ display: 'grid', gap: '10px' }}>
                  <select value={mealDay} onChange={(e) => setMealDay(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', fontSize: '12px' }}>
                    {daysOfWeek.map(d => <option key={d}>{d}</option>)}
                  </select>
                  <select value={mealType} onChange={(e) => setMealType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', fontSize: '12px' }}>
                    <option>🌅 1. Πρωινό</option><option>🍏 2. Δεκατιανό</option><option>🥗 3. Μεσημεριανό</option><option>🥜 4. Απογευματινό</option><option>🌙 5. Βραδινό</option>
                  </select>
                  <input type="text" placeholder="Περιγραφή & ανάλυση..." value={mealText} onChange={(e) => setMealText(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', fontSize: '12px' }} />
                  <button type="submit" style={{ width: '100%', padding: '10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>+ Προσθήκη</button>
                </form>
              </div>
            )}

            <div style={{ background: '#064e3b', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#ffffff', fontWeight: '700' }}>📋 Ενεργό Εβδομαδιαίο Διαιτολόγιο: {selectedClient}</h3>
              
              {daysOfWeek.map(day => {
                const dayMeals = (clientMeals[selectedClient] || []).filter(m => m.day === day);
                if (dayMeals.length === 0) return null;
                return (
                  <div key={day} style={{ marginBottom: '16px', background: '#022c22', padding: '14px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <h4 style={{ color: '#34d399', margin: '0 0 10px 0', fontSize: '14px', borderBottom: '1px solid rgba(16, 185, 129, 0.2)', paddingBottom: '6px' }}>📅 {day}</h4>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {dayMeals.map(m => (
                        <div key={m.id} style={{ background: '#064e3b', padding: '10px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '12px' }}><strong style={{ color: '#fde047' }}>{m.type}:</strong> {m.text}</div>
                          {isAdmin && (
                            <button onClick={() => {
                              const updated = clientMeals[selectedClient].filter(x => x.id !== m.id);
                              setClientMeals({ ...clientMeals, [selectedClient]: updated });
                            }} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', marginLeft: '8px' }}>✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {(!clientMeals[selectedClient] || clientMeals[selectedClient].length === 0) && (
                <p style={{ color: '#6ee7b7', fontSize: '13px' }}>Δεν υπάρχουν καταχωρημένα γεύματα για την εβδομάδα.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CALCULATOR */}
        {activeTab === 'calc' && (
          <div style={{ background: '#064e3b', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#ffffff', fontWeight: '700' }}>⚡ Υπολογιστής BMR & TDEE</h3>
            <p style={{ fontSize: '12px', color: '#6ee7b7', marginBottom: '16px' }}>
              Αυτόματα φορτωμένα στοιχεία από τον πελάτη: <strong style={{ color: '#fff' }}>{selectedClient}</strong>
            </p>
            
            <form onSubmit={calculateBmr} style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Τύπος Υπολογισμού</label>
                <select value={calcFormula} onChange={(e) => setCalcFormula(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', fontSize: '12px' }}>
                  <option value="harris">Harris-Benedict (Κλασικός)</option>
                  <option value="mifflin">Mifflin-St Jeor (Σύγχρονος)</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Φύλο</label>
                  <select value={calcGender} onChange={(e) => setCalcGender(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', fontSize: '12px' }}>
                    <option value="female">Γυναίκα</option>
                    <option value="male">Άνδρας</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Ηλικία</label>
                  <input type="number" value={calcAge} onChange={(e) => setCalcAge(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', fontSize: '12px' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Βάρος (kg)</label>
                  <input type="number" value={calcWeight} onChange={(e) => setCalcWeight(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Ύψος (cm)</label>
                  <input type="number" value={calcHeight} onChange={(e) => setCalcHeight(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', fontSize: '12px' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Δραστηριότητα</label>
                <select value={calcActivity} onChange={(e) => setCalcActivity(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', fontSize: '12px' }}>
                  <option value={1.2}>Καθιστική ζωή (1.2)</option>
                  <option value={1.375}>Ελαφριά άσκηση (1.375)</option>
                  <option value={1.55}>Μέτρια άσκηση (1.55)</option>
                  <option value={1.725}>Εντατική άσκηση (1.725)</option>
                </select>
              </div>
              <button type="submit" style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>⚡ Υπολογισμός & Ενημέρωση Προφίλ</button>
            </form>

            {calcResult && (
              <div style={{ background: '#022c22', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.3)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#34d399', fontWeight: '700' }}>BMR</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginTop: '2px' }}>{calcResult.bmr} <span style={{ fontSize: '10px', color: '#6ee7b7' }}>kcal</span></div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#34d399', fontWeight: '700' }}>TDEE</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#fde047', marginTop: '2px' }}>{calcResult.tdee} <span style={{ fontSize: '10px', color: '#6ee7b7' }}>kcal</span></div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#34d399', fontWeight: '700' }}>BMI</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#38bdf8', marginTop: '2px' }}>{calcResult.bmi}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: MEASUREMENTS */}
        {activeTab === 'measurements' && (
          <div>
            <div style={{ background: '#064e3b', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#ffffff', fontWeight: '700' }}>📈 Σωματομετρικά για: {selectedClient}</h3>
              <form onSubmit={addMeasurement} style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Βάρος (kg)</label>
                    <input type="number" step="0.1" placeholder="58.5" value={mWeight} onChange={(e) => setMWeight(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', fontSize: '12px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Λίπος %</label>
                    <input type="number" step="0.1" placeholder="26.5" value={mFat} onChange={(e) => setMFat(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', fontSize: '12px' }} />
                  </div>
                </div>
                <button type="submit" style={{ width: '100%', padding: '10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>+ Καταγραφή</button>
              </form>

              <div style={{ display: 'grid', gap: '8px' }}>
                {(!clientMeasurements[selectedClient] || clientMeasurements[selectedClient].length === 0) ? (
                  <p style={{ color: '#6ee7b7', fontSize: '13px' }}>Δεν υπάρχουν μετρήσεις.</p>
                ) : (
                  clientMeasurements[selectedClient].map(m => (
                    <div key={m.id} style={{ background: '#022c22', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '12px' }}>🗓️ <strong>{m.date}</strong> — Βάρος: <strong>{m.weight} kg</strong> | Λίπος: <strong style={{ color: '#fde047' }}>{m.fat}%</strong></div>
                      {isAdmin && (
                        <button onClick={() => {
                          const updated = clientMeasurements[selectedClient].filter(x => x.id !== m.id);
                          setClientMeasurements({ ...clientMeasurements, [selectedClient]: updated });
                        }} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>✕</button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* EASY API KEY MODAL */}
      {showApiKeyModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2, 44, 34, 0.95)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '400px', background: '#064e3b', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '24px', borderRadius: '20px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '18px', fontWeight: '800' }}>🔑 Ρύθμιση Gemini API Key</h3>
            <p style={{ fontSize: '12px', color: '#6ee7b7', marginBottom: '16px' }}>
              Επικολλήστε το API Key από το Google AI Studio (<code style={{ color: '#fde047' }}>AIzaSy...</code>).
            </p>
            <form onSubmit={handleSaveApiKey} style={{ display: 'grid', gap: '12px' }}>
              <input 
                type="text" 
                placeholder="Επικόλληση API Key..." 
                value={tempApiKey} 
                onChange={(e) => setTempApiKey(e.target.value)} 
                required 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', fontSize: '13px' }} 
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setShowApiKeyModal(false)} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.1)', color: '#cbd5e1', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Ακύρωση</button>
                <button type="submit" style={{ flex: 1, padding: '10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>💾 Αποθήκευση</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN PIN MODAL */}
      {showPinModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2, 44, 34, 0.95)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '360px', background: '#064e3b', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '24px', borderRadius: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔑</div>
            <h3 style={{ margin: '0 0 6px 0', color: '#ffffff', fontSize: '18px', fontWeight: '800' }}>Είσοδος Διαχειριστή</h3>
            <p style={{ fontSize: '12px', color: '#6ee7b7', marginBottom: '16px' }}>Εισάγετε το PIN Admin (`2026`).</p>
            <form onSubmit={handlePinSubmit} style={{ display: 'grid', gap: '12px' }}>
              <input type="password" maxLength="4" placeholder="****" value={inputPin} onChange={(e) => setInputPin(e.target.value)} required autoFocus style={{ width: '100%', padding: '12px', borderRadius: '10px', border: pinError ? '2px solid #ef4444' : '1px solid #047857', background: '#022c22', color: '#fff', textAlign: 'center', fontSize: '24px', letterSpacing: '8px', outline: 'none' }} />
              {pinError && <span style={{ color: '#fca5a5', fontSize: '11px', fontWeight: '600' }}>⚠️ Λανθασμένος κωδικός!</span>}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowPinModal(false)} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.1)', color: '#cbd5e1', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Ακύρωση</button>
                <button type="submit" style={{ flex: 1, padding: '10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Είσοδος</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CLIENT MODAL */}
      {editingClient && isAdmin && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2, 44, 34, 0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '480px', background: '#064e3b', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '20px', borderRadius: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '18px', fontWeight: '700' }}>👤 Πλήρες Προφίλ Πελάτη</h3>
              <button onClick={() => setEditingClient(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={saveClientEdit} style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Ονοματεπώνυμο</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', fontSize: '13px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Τηλέφωνο</label>
                  <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Email</label>
                  <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', fontSize: '13px' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Στόχος</label>
                  <input type="text" value={editGoal} onChange={(e) => setEditGoal(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Ηλικία</label>
                  <input type="number" value={editAge} onChange={(e) => setEditAge(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', fontSize: '13px' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Βάρος (kg)</label>
                  <input type="number" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Ύψος (cm)</label>
                  <input type="number" value={editHeight} onChange={(e) => setEditHeight(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', fontSize: '13px' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#fde047', fontWeight: '600', display: 'block', marginBottom: '4px' }}>🩺 Ιατρικό / Κλινικό Ιστορικό & Σημειώσεις</label>
                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #047857', background: '#022c22', color: '#fff', outline: 'none', minHeight: '80px', fontSize: '13px' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(2, 44, 34, 0.5)', padding: '10px', borderRadius: '10px' }}>
                <img src={editAvatar || editingClient.avatar} alt="preview" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #10b981' }} />
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Αλλαγή Φωτογραφίας</label>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} style={{ width: '100%', padding: '4px', borderRadius: '6px', border: '1px solid #047857', background: '#022c22', color: '#cbd5e1', fontSize: '11px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditingClient(null)} style={{ flex: 1, background: 'rgba(220, 38, 38, 0.2)', border: '1px solid #dc2626', color: '#fca5a5', padding: '10px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>Ακύρωση</button>
                <button type="submit" style={{ flex: 1, background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>💾 Αποθήκευση</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
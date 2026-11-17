import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import ClientManager from './ClientManager';
import MealPlanner from './MealPlanner';

export default function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('mealplanner');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState('');

  // ================= STATE ΓΙΑ ΤΟ MEAL PLANNER =================
  const [clientMeals, setClientMeals] = useState({});
  const [cheatLogs, setCheatLogs] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [mealDay, setMealDay] = useState('Δευτέρα');
  const [mealType, setMealType] = useState('Πρωινό');
  const [mealText, setMealText] = useState('');
  const [cheatText, setCheatText] = useState('');
  const [foodPhoto, setFoodPhoto] = useState('');
  const [analyzingFood, setAnalyzingFood] = useState(false);
  const [aiFoodAnalysis, setAiFoodAnalysis] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const { data: cData } = await supabase.from('clients').select('*').order('created_at', { ascending: true });
      if (cData && cData.length > 0) {
        setClients(cData);
        if (!selectedClient) setSelectedClient(cData[0].name);
      }

      const { data: mData } = await supabase.from('meals').select('*');
      if (mData) {
        const mealsObj = {};
        mData.forEach(m => {
          if (!mealsObj[m.client_name]) mealsObj[m.client_name] = [];
          mealsObj[m.client_name].push(m);
        });
        setClientMeals(mealsObj);
      }

      const { data: jData } = await supabase.from('journal').select('*').order('created_at', { ascending: false });
      if (jData) {
        const jObj = {};
        jData.forEach(j => {
          if (!jObj[j.client_name]) jObj[j.client_name] = [];
          jObj[j.client_name].push({ id: j.id, date: j.date, text: j.description, photo: j.image_url });
        });
        setCheatLogs(jObj);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeClientObj = clients.find(c => c.name === selectedClient) || null;

  // ================= ΛΕΙΤΟΥΡΓΙΕΣ MEAL PLANNER =================
  const applyAiSuggestions = async () => {
    if (!aiSuggestions) return;
    const rowsToInsert = aiSuggestions.map((m, idx) => ({
      id: Date.now() + idx,
      client_name: selectedClient,
      day: m.day,
      type: m.type,
      text: m.text
    }));
    await supabase.from('meals').insert(rowsToInsert);
    const current = clientMeals[selectedClient] || [];
    setClientMeals({ ...clientMeals, [selectedClient]: [...current, ...rowsToInsert] });
    setAiSuggestions(null);
  };

  const addMeal = async (e) => {
    e.preventDefault();
    const newMeal = { id: Date.now(), client_name: selectedClient, day: mealDay, type: mealType, text: mealText };
    await supabase.from('meals').insert([newMeal]);
    const current = clientMeals[selectedClient] || [];
    setClientMeals({ ...clientMeals, [selectedClient]: [...current, newMeal] });
    setMealText('');
  };

  const addCheatLog = async (e) => {
    e.preventDefault();
    if (!cheatText && !foodPhoto) return;
    const newEntry = {
      id: Date.now(),
      client_name: selectedClient,
      date: new Date().toLocaleDateString('el-GR'),
      entry_type: foodPhoto ? 'photo' : 'text',
      image_url: foodPhoto || null,
      description: cheatText || 'Φωτογραφία γεύματος'
    };
    await supabase.from('journal').insert([newEntry]);
    const current = cheatLogs[selectedClient] || [];
    setCheatLogs({ ...cheatLogs, [selectedClient]: [{ id: newEntry.id, date: newEntry.date, text: newEntry.description, photo: newEntry.image_url }, ...current] });
    setCheatText('');
    setFoodPhoto('');
  };

  const handleFoodPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 400; canvas.height = 400;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setFoodPhoto(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* NAVBAR */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-xl shadow-sm">🌿</div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">NutriCharis</h1>
              <span className="text-xs font-semibold text-emerald-600 tracking-wide uppercase">Admin Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={selectedClient} 
              onChange={(e) => setSelectedClient(e.target.value)}
              className="bg-slate-100 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none font-semibold cursor-pointer"
            >
              {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <button onClick={onLogout} className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors flex items-center gap-2">
              <span>Αποσύνδεση</span>
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="max-w-7xl mx-auto mt-6 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {[
            { id: 'mealplanner', label: '📋 Εβδομαδιαίο Πλάνο AI' },
            { id: 'clients', label: '👥 Πελάτες & Φάκελοι' },
            { id: 'appointments', label: '📅 Ραντεβού' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto p-6 mt-4">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {activeTab === 'clients' && <ClientManager clients={clients} onClientUpdate={fetchAllData} />}
            {activeTab === 'mealplanner' && (
              <MealPlanner 
                selectedClient={selectedClient}
                activeClientObj={activeClientObj}
                userRole="admin"
                aiLoading={aiLoading}
                setAiLoading={setAiLoading}
                aiSuggestions={aiSuggestions}
                setAiSuggestions={setAiSuggestions}
                applyAiSuggestions={applyAiSuggestions}
                mealDay={mealDay}
                setMealDay={setMealDay}
                mealType={mealType}
                setMealType={setMealType}
                mealText={mealText}
                setMealText={setMealText}
                addMeal={addMeal}
                clientMeals={clientMeals}
                setClientMeals={setClientMeals}
                cheatText={cheatText}
                setCheatText={setCheatText}
                addCheatLog={addCheatLog}
                cheatLogs={cheatLogs}
                foodPhoto={foodPhoto}
                handleFoodPhotoUpload={handleFoodPhotoUpload}
                analyzingFood={analyzingFood}
                aiFoodAnalysis={aiFoodAnalysis}
              />
            )}
            {activeTab === 'appointments' && <div className="p-8 text-center text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">Σύστημα Ραντεβού (Επόμενο βήμα)</div>}
          </>
        )}
      </main>
    </div>
  );
}
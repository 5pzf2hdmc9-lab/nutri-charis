import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ClientManager({ clients, onClientUpdate }) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '', goal: '', phone: '', email: '', 
    weight: 65, height: 170, age: 28, gender: 'female', notes: ''
  });

  const handleAddClient = async (e) => {
    e.preventDefault();
    
    // Απλοποιημένος υπολογισμός για το παράδειγμα
    const bmr = Math.round((10 * formData.weight) + (6.25 * formData.height) - (5 * formData.age) + (formData.gender === 'female' ? -161 : 5));
    
    const newClient = {
      name: formData.name,
      goal: formData.goal,
      phone: formData.phone,
      email: formData.email,
      weight: formData.weight,
      height: formData.height,
      age: formData.age,
      gender: formData.gender,
      bmr: bmr,
      tdee: Math.round(bmr * 1.2),
      clinicalnotes: formData.notes
    };

    const { error } = await supabase.from('clients').insert([newClient]);
    if (!error) {
      setIsAdding(false);
      onClientUpdate();
    } else {
      alert("Σφάλμα κατά την προσθήκη: " + error.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER ACTION */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Πελάτες ({clients.length})</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold shadow-sm transition-colors"
        >
          {isAdding ? '✕ Ακύρωση' : '+ Νέος Πελάτης'}
        </button>
      </div>

      {/* ADD NEW CLIENT FORM */}
      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-fade-in-down">
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Στοιχεία Νέου Πελάτη</h3>
          <form onSubmit={handleAddClient} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Ονοματεπώνυμο</label>
                <input type="text" required className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Στόχος (π.χ. Απώλεια Λίπους)</label>
                <input type="text" className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Βάρος (kg)</label>
                <input type="number" className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none" value={formData.weight} onChange={e => setFormData({...formData, weight: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Ύψος (cm)</label>
                <input type="number" className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none" value={formData.height} onChange={e => setFormData({...formData, height: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Ηλικία</label>
                <input type="number" className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none" value={formData.age} onChange={e => setFormData({...formData, age: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Φύλο</label>
                <select className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                  <option value="female">Γυναίκα</option>
                  <option value="male">Άνδρας</option>
                </select>
              </div>
            </div>

            <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg mt-4 transition-colors">
              Αποθήκευση Πελάτη
            </button>
          </form>
        </div>
      )}

      {/* CLIENTS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map(client => (
          <div key={client.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg border border-emerald-200">
                {client.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-lg leading-tight">{client.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{client.goal || 'Χωρίς Στόχο'}</p>
                <div className="flex gap-2 mt-3">
                  <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded">BMR: {client.bmr}</span>
                  <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100">TDEE: {client.tdee}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
}
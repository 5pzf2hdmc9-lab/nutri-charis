import React, { useState } from 'react';

export default function MealPlanner({
  selectedClient,
  activeClientObj,
  userRole,
  aiLoading,
  setAiLoading,
  aiSuggestions,
  setAiSuggestions,
  applyAiSuggestions,
  mealDay,
  setMealDay,
  mealType,
  setMealType,
  mealText,
  setMealText,
  addMeal,
  clientMeals,
  setClientMeals,
  cheatText,
  setCheatText,
  addCheatLog,
  cheatLogs,
  foodPhoto,
  handleFoodPhotoUpload,
  analyzingFood,
  aiFoodAnalysis
}) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('charis_openai_key') || '');
  const [useLiveAI, setUseLiveAI] = useState(false);

  const saveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('charis_openai_key', key);
  };

  // Live OpenAI API Handler
  const generateLiveAiMeals = async () => {
    if (useLiveAI && !apiKey) {
      alert('Παρακαλώ εισάγετε OpenAI API Key για ζωντανή σύνδεση GPT-4o!');
      return;
    }

    setAiLoading(true);
    const active = activeClientObj || { goal: 'Απώλεια Λίπους', weight: 70, height: 170, age: 30, tdee: 2000 };

    if (!useLiveAI) {
      // Fallback Smart Simulator αν δεν είναι επιλεγμένο το Live API
      setTimeout(() => {
        setAiSuggestions([
          { day: 'Δευτέρα', type: '🌅 Πρωινό', text: `35g Βρώμη, 1 scoop Whey, 10g chia & μύρτιλα (~410 kcal | 32g P)` },
          { day: 'Δευτέρα', type: '🍏 Δεκατιανό', text: `1 πράσινο μήλο & 12 αμύγδαλα (~180 kcal | 4g P)` },
          { day: 'Δευτέρα', type: '🥗 Μεσημεριανό', text: `160g κοτόπουλο σχάρας, 180g κινόα & λαχανικά (~520 kcal | 45g P)` },
          { day: 'Δευτέρα', type: '🍵 Απογευματινό', text: `200g Γιαούρτι 2% με κανέλα & 5 καρύδια (~190 kcal | 18g P)` },
          { day: 'Δευτέρα', type: '🌙 Βραδινό', text: `200g ψάρι λευκό με ψητά σπαράγγια & λάδι-λεμόνι (~380 kcal | 38g P)` }
        ]);
        setAiLoading(false);
      }, 900);
      return;
    }

    // Πραγματική κλήση στο OpenAI API (GPT-4o)
    try {
      const prompt = `Είσαι κορυφαίος κλινικός διαιτολόγος. Δημιούργησε ένα εξατομικευμένο ημερήσιο διατροφικό πλάνο 5 γευμάτων (Πρωινό, Δεκατιανό, Μεσημεριανό, Απογευματινό, Βραδινό) για τον/την πελάτη ${selectedClient}. 
      Στόχος: ${active.goal}. 
      Βάρος: ${active.weight}kg, Ύψος: ${active.height}cm, Ηλικία: ${active.age} ετών, TDEE: ${active.tdee} kcal.
      Απάντησε ΑΥΣΤΗΡΑ σε μορφή JSON array από objects με πεδία: "day" (Δευτέρα), "type" (π.χ. 🌅 Πρωινό), "text" (περιγραφή γεύματος μαζί με εκτιμώμενες θερμίδες και πρωτεΐνη). Μην βάλεις markdown codeblocks εξωτερικά.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7
        })
      });

      const data = await response.json();
      if (data.error) {
        alert('Σφάλμα OpenAI API: ' + data.error.message);
        setAiLoading(false);
        return;
      }

      const content = data.choices[0].message.content;
      let parsed = JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
      setAiSuggestions(parsed);
    } catch (err) {
      alert('Αποτυχία σύνδεσης με OpenAI API. Ελέγξτε το κλειδί σας.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div>
      <div className="card client-selector-card no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#064e3b', fontSize: '20px', fontWeight: '700' }}>📋 Εβδομαδιαίο Πλάνο Διατροφής & Live AI</h3>
          <span style={{ marginTop: '6px', display: 'inline-block', background: '#ecfdf5', color: '#065f46', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>Πελάτης: {selectedClient}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {userRole === 'admin' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                <input type="checkbox" checked={useLiveAI} onChange={(e) => setUseLiveAI(e.target.checked)} style={{ marginRight: '4px' }} />
                🤖 Live OpenAI GPT-4o
              </label>
              {useLiveAI && (
                <input 
                  type="password" 
                  placeholder="sk-proj-..." 
                  value={apiKey} 
                  onChange={(e) => saveApiKey(e.target.value)} 
                  style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '130px' }}
                />
              )}
            </div>
          )}
          {userRole === 'admin' && (
            <button onClick={generateLiveAiMeals} style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              {aiLoading ? '🤖 GPT-4o Επεξεργασία...' : (useLiveAI ? '⚡ Live AI GPT-4o Πρόταση' : '🤖 Clinical AI Πρόταση')}
            </button>
          )}
          <button onClick={() => window.print()} style={{ padding: '10px 22px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>🖨️ Εκτύπωση</button>
        </div>
      </div>

      {aiSuggestions && userRole === 'admin' && (
        <div className="card no-print" style={{ background: '#f3e8ff', borderColor: '#c084fc', marginBottom: '20px', padding: '20px', borderRadius: '16px', border: '1px solid #d8b4fe' }}>
          <h3 style={{ color: '#581c87', marginBottom: '8px', fontSize: '16px', fontWeight: '700' }}>🤖 Παραγόμενο AI Πλάνο για: {selectedClient}</h3>
          <p style={{ fontSize: '13px', color: '#6b21a8', marginBottom: '14px' }}>
            🎯 Στόχος: <strong>{activeClientObj?.goal || 'Γενική Διατροφή'}</strong> | ⚖️ Βάρος: <strong>{activeClientObj?.weight || 65}kg</strong> | 🔥 TDEE: <strong>{activeClientObj?.tdee || 1800} kcal</strong>
          </p>
          <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
            {aiSuggestions.map((item, idx) => (
              <div key={idx} style={{ padding: '12px 16px', background: 'white', borderRadius: '10px', fontSize: '13px', color: '#4c1d95', border: '1px solid #e9d5ff' }}>
                <strong>{item.type}:</strong> {item.text}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={applyAiSuggestions} style={{ padding: '10px 18px', background: '#7e22ce', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>+ Προσθήκη όλων στο Διαιτολόγιο</button>
            <button onClick={() => setAiSuggestions(null)} style={{ padding: '10px 18px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Ακύρωση</button>
          </div>
        </div>
      )}

      {userRole === 'admin' && (
        <div className="card add-form-card no-print" style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '16px', color: '#064e3b', fontSize: '18px', fontWeight: '700' }}>✍️ Προσθήκη Γεύματος</h3>
          <form onSubmit={addMeal}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Ημέρα</label>
                <select className="form-control" value={mealDay} onChange={(e) => setMealDay(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <option>Δευτέρα</option><option>Τρίτη</option><option>Τετάρτη</option><option>Πέμπτη</option><option>Παρασκευή</option><option>Σάββατο</option><option>Κυριακή</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Γεύμα</label>
                <select className="form-control" value={mealType} onChange={(e) => setMealType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <option>Πρωινό</option><option>Δεκατιανό</option><option>Μεσημεριανό</option><option>Απογευματινό</option><option>Βραδινό</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Περιγραφή</label>
                <input className="form-control" placeholder="π.χ. 150g Κοτόπουλο & σαλάτα" value={mealText} onChange={(e) => setMealText(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>
            </div>
            <button className="btn-primary" type="submit" style={{ marginTop: '16px', padding: '12px 28px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>+ Προσθήκη στο Πλάνο</button>
          </form>
        </div>
      )}

      <div className="card" style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginBottom: '16px', color: '#064e3b', fontSize: '18px', fontWeight: '700' }}>📋 Καταχωρημένα Γεύματα</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          {(!clientMeals[selectedClient] || clientMeals[selectedClient].length === 0) ? (
            <p style={{ color: '#64748b', fontSize: '14px' }}>Δεν έχουν προστεθεί γεύματα για αυτόν τον πελάτη.</p>
          ) : (
            clientMeals[selectedClient].map(m => (
              <div key={m.id} style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', borderLeft: '5px solid #059669', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0', borderLeftWidth: '5px' }}>
                <div><strong style={{ color: '#064e3b' }}>{m.day} — {m.type}:</strong> {m.text}</div>
                {userRole === 'admin' && (
                  <button onClick={() => {
                    const updated = clientMeals[selectedClient].filter(x => x.id !== m.id);
                    setClientMeals({ ...clientMeals, [selectedClient]: updated });
                  }} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}>✕</button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI FOOD RECOGNITION SECTION */}
      <div className="card" style={{ marginTop: '24px', borderColor: '#fcd34d', background: '#fffbeb', borderRadius: '16px', padding: '24px', border: '1px solid #fde68a' }}>
        <h3 style={{ marginBottom: '8px', color: '#92400e', fontSize: '18px', fontWeight: '700' }}>📸 AI Food OCR & Καταγραφή Γευμάτων</h3>
        <p style={{ fontSize: '12px', color: '#b45309', marginBottom: '16px' }}>Φωτογράφισε το πιάτο σου για να το αναλύσει αυτόματα το AI!</p>
        
        <form onSubmit={addCheatLog} style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input 
              className="form-control" 
              placeholder="π.χ. Σημείωση γεύματος..." 
              value={cheatText} 
              onChange={(e) => setCheatText(e.target.value)} 
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #fcd34d' }}
            />
            <label style={{ background: '#059669', color: 'white', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '13px' }}>
              📷 Φωτογραφία Πιάτου
              <input type="file" accept="image/*" onChange={handleFoodPhotoUpload} style={{ display: 'none' }} />
            </label>
          </div>

          {foodPhoto && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'white', padding: '10px', borderRadius: '10px', border: '1px solid #fde68a' }}>
              <img src={foodPhoto} alt="food preview" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
              <div style={{ flex: 1, fontSize: '13px' }}>
                {analyzingFood && <span style={{ color: '#d97706', fontWeight: 'bold' }}>🤖 AI Vision: Αναλύω συστατικά...</span>}
                {!analyzingFood && aiFoodAnalysis && (
                  <div>
                    <strong style={{ color: '#065f46' }}>{aiFoodAnalysis.dish}</strong>
                    <div style={{ color: '#b45309', fontWeight: '600', marginTop: '2px' }}>
                      {aiFoodAnalysis.calories} | {aiFoodAnalysis.protein}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <button type="submit" style={{ width: 'auto', background: '#d97706', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>+ Αποθήκευση Καταγραφής</button>
        </form>

        <div style={{ display: 'grid', gap: '8px' }}>
          {(!cheatLogs[selectedClient] || cheatLogs[selectedClient].length === 0) ? (
            <p style={{ color: '#b45309', fontSize: '13px' }}>Δεν υπάρχουν πρόσφατες καταγραφές.</p>
          ) : (
            cheatLogs[selectedClient].map(log => (
              <div key={log.id} style={{ padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #fef3c7', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {log.photo && <img src={log.photo} alt="log" style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }} />}
                <div style={{ fontSize: '13px', color: '#78350f', flex: 1 }}>
                  <strong>🗓️ {log.date}:</strong> {log.text}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
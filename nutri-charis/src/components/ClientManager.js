import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { parseStrictNum, calculateMetabolism } from '../lib/nutrition-math';
import { requireSessionUser, sanitizeText } from '../lib/authAccess';
import GdprConsentFields from './GdprConsentFields';
import LegalModal from './LegalModal';

export default function ClientManager({ clients, onClientUpdate }) {
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [legalDoc, setLegalDoc] = useState(null);
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [art9Accepted, setArt9Accepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    goal: '',
    phone: '',
    email: '',
    weight: 65,
    height: 170,
    age: 28,
    gender: 'female',
    notes: ''
  });

  const handleAddClient = async (e) => {
    e.preventDefault();
    setError('');
    if (!gdprAccepted || !art9Accepted || !termsAccepted) {
      setError('Απαιτείται ρητή συγκατάθεση GDPR / Άρθρου 9 / Όρων Χρήσης.');
      return;
    }
    const age = parseStrictNum(formData.age, 5, 115);
    const weight = parseStrictNum(formData.weight, 25, 350);
    const height = parseStrictNum(formData.height, 90, 240);
    if (Number.isNaN(age) || Number.isNaN(weight) || Number.isNaN(height)) {
      setError('Μη έγκυρα ανθρωπομετρικά (αρνητικές/μηδενικές τιμές απορρίπτονται).');
      return;
    }

    setLoading(true);
    try {
      const user = await requireSessionUser();
      const met = calculateMetabolism({
        gender: formData.gender,
        age,
        weight,
        height,
        activity: 1.2
      });
      const consentAt = new Date().toISOString();
      const newClient = {
        name: sanitizeText(formData.name, 120),
        goal: sanitizeText(formData.goal, 200),
        phone: sanitizeText(formData.phone, 40),
        email: sanitizeText(formData.email, 180).toLowerCase(),
        weight,
        height,
        age,
        gender: formData.gender === 'male' ? 'male' : 'female',
        bmr: met.mifflin.bmr,
        tdee: met.mifflin.tdee,
        clinicalnotes: sanitizeText(formData.notes, 1000),
        dietitian_id: user.id,
        gdpr_consent_at: consentAt,
        art9_consent_at: consentAt,
        terms_accepted_at: consentAt,
        questionnaire: {
          gdprAcceptedAt: consentAt,
          art9AcceptedAt: consentAt,
          termsAcceptedAt: consentAt
        }
      };

      const { error: insertErr } = await supabase.from('clients').insert([newClient]);
      if (insertErr) {
        setError(insertErr.message);
        return;
      }
      setIsAdding(false);
      setGdprAccepted(false);
      setArt9Accepted(false);
      setTermsAccepted(false);
      onClientUpdate();
    } catch (err) {
      setError(err?.message || 'Αποτυχία αποθήκευσης.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Πελάτες ({clients.length})</h2>
        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold shadow-sm transition-colors"
        >
          {isAdding ? '✕ Ακύρωση' : '+ Νέος Πελάτης'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Στοιχεία Νέου Πελάτη</h3>
          <form onSubmit={handleAddClient} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Ονοματεπώνυμο</label>
                <input
                  type="text"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Στόχος</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Βάρος (kg)</label>
                <input
                  type="number"
                  min={25}
                  max={350}
                  className="w-full p-2 border border-slate-300 rounded-md"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Ύψος (cm)</label>
                <input
                  type="number"
                  min={90}
                  max={240}
                  className="w-full p-2 border border-slate-300 rounded-md"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Ηλικία</label>
                <input
                  type="number"
                  min={5}
                  max={115}
                  className="w-full p-2 border border-slate-300 rounded-md"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Φύλο</label>
                <select
                  className="w-full p-2 border border-slate-300 rounded-md"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="female">Γυναίκα</option>
                  <option value="male">Άνδρας</option>
                </select>
              </div>
            </div>

            <GdprConsentFields
              variant="light"
              gdprAccepted={gdprAccepted}
              setGdprAccepted={setGdprAccepted}
              art9Accepted={art9Accepted}
              setArt9Accepted={setArt9Accepted}
              termsAccepted={termsAccepted}
              setTermsAccepted={setTermsAccepted}
              onOpenLegal={setLegalDoc}
            />

            {error && (
              <div className="text-red-700 text-sm bg-red-50 border border-red-100 rounded-lg p-3">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg mt-4 transition-colors disabled:opacity-60"
            >
              {loading ? 'Αποθήκευση…' : 'Αποθήκευση Πελάτη'}
            </button>
          </form>
        </div>
      )}

      {!loading && clients.length === 0 && (
        <div className="text-slate-500 text-sm bg-white border border-slate-200 rounded-xl p-6">
          Δεν υπάρχουν πελάτες ακόμη.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <div key={client.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg border border-emerald-200">
                {(client.name || '?').charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-lg leading-tight">{client.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{client.goal || 'Χωρίς Στόχο'}</p>
                <div className="flex gap-2 mt-3">
                  <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                    BMR: {client.bmr}
                  </span>
                  <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100">
                    TDEE: {client.tdee}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {legalDoc && <LegalModal docKey={legalDoc} onClose={() => setLegalDoc(null)} />}
    </div>
  );
}

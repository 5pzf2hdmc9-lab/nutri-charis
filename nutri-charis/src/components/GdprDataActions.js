import React, { useState } from 'react';
import { buildClientExportBundle, downloadJsonFile } from '../lib/gdprExport';
import { supabase } from '../supabaseClient';

/**
 * GDPR Art.20 export + Art.17 erasure with double confirmation.
 */
export default function GdprDataActions({
  client,
  appointments,
  measurements,
  onPermanentDelete,
  disabled = false
}) {
  const [confirmStep, setConfirmStep] = useState(0);
  const [confirmName, setConfirmName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!client) return null;

  const handleExport = async () => {
    setError('');
    try {
      const cid = Number(client.id);
      const [notesRes, billRes] = await Promise.all([
        supabase.from('clinical_notes').select('*').eq('client_id', cid),
        supabase.from('billing_packages').select('*').eq('client_id', cid)
      ]);
      const warnings = [notesRes.error?.message, billRes.error?.message].filter(Boolean);
      const bundle = buildClientExportBundle({
        client,
        appointments,
        measurements,
        clinicalNotes: notesRes.data || [],
        billingPackages: billRes.data || [],
        warnings
      });
      const safeName = String(client.name || 'client').replace(/\s+/g, '_');
      downloadJsonFile(`NutriCharis_GDPR_Export_${safeName}.json`, bundle);
      if (warnings.length) setError('Η εξαγωγή ολοκληρώθηκε με ελλείψεις σε SOAP/πακέτα.');
    } catch (err) {
      setError(err?.message || 'Αποτυχία εξαγωγής.');
    }
  };

  const handleDelete = async () => {
    setError('');
    if (confirmStep === 0) {
      setConfirmStep(1);
      return;
    }
    if (confirmStep === 1) {
      setConfirmStep(2);
      return;
    }
    const expected = String(client.name || '').trim();
    if (confirmName.trim() !== expected) {
      setError('Πληκτρολογήστε ακριβώς το ονοματεπώνυμο του πελάτη για επιβεβαίωση.');
      return;
    }
    setBusy(true);
    try {
      await onPermanentDelete(client);
      setConfirmStep(0);
      setConfirmName('');
    } catch (err) {
      setError(err?.message || 'Η οριστική διαγραφή απέτυχε.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        marginTop: '14px',
        padding: '14px',
        borderRadius: '14px',
        border: '1px solid rgba(248, 113, 113, 0.28)',
        background: 'rgba(127, 29, 29, 0.18)',
        display: 'grid',
        gap: '10px'
      }}
    >
      <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#fecaca' }}>GDPR — Δικαιώματα Υποκειμένου</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <button
          type="button"
          disabled={disabled || busy}
          onClick={handleExport}
          style={btnPrimary}
        >
          Εξαγωγή Δεδομένων Πελάτη (JSON)
        </button>
        <button
          type="button"
          disabled={disabled || busy}
          onClick={handleDelete}
          style={btnDanger}
        >
          {confirmStep === 0
            ? 'Οριστική Διαγραφή Φακέλου'
            : confirmStep === 1
            ? 'Επιβεβαίωση 1/2 — Συνέχεια'
            : busy
            ? 'Διαγραφή…'
            : 'Επιβεβαίωση 2/2 — Οριστική Διαγραφή'}
        </button>
        {confirmStep > 0 && (
          <button
            type="button"
            onClick={() => {
              setConfirmStep(0);
              setConfirmName('');
              setError('');
            }}
            style={btnGhost}
          >
            Ακύρωση
          </button>
        )}
      </div>
      {confirmStep === 2 && (
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: '#fca5a5', marginBottom: '4px' }}>
            Πληκτρολογήστε «{client.name}» για οριστική διαγραφή (Άρθρο 17 — Δικαίωμα στη Λήθη)
          </label>
          <input
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            className="luxury-input"
            style={{ width: '100%' }}
            placeholder={client.name}
            disabled={busy}
          />
        </div>
      )}
      {error && (
        <div style={{ fontSize: '12px', color: '#fecaca', background: 'rgba(239,68,68,0.15)', padding: '8px 10px', borderRadius: '8px' }}>
          {error}
        </div>
      )}
      {!client && (
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>Δεν υπάρχει επιλεγμένος φάκελος.</div>
      )}
    </div>
  );
}

const btnPrimary = {
  padding: '10px 12px',
  background: '#0f766e',
  color: '#ecfdf5',
  border: 'none',
  borderRadius: '10px',
  fontWeight: 800,
  fontSize: '12px',
  cursor: 'pointer'
};

const btnDanger = {
  padding: '10px 12px',
  background: '#b91c1c',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  fontWeight: 800,
  fontSize: '12px',
  cursor: 'pointer'
};

const btnGhost = {
  padding: '10px 12px',
  background: 'rgba(255,255,255,0.08)',
  color: '#cbd5e1',
  border: 'none',
  borderRadius: '10px',
  fontWeight: 700,
  fontSize: '12px',
  cursor: 'pointer'
};

import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { requireSessionUser, assertClientAccess, sanitizeText } from '../../lib/authAccess';
import { parseSoapNote } from '../../lib/practiceSchemas';

const emptyForm = () => ({
  visit_date: new Date().toISOString().slice(0, 10),
  subjective: '',
  objective: '',
  assessment: '',
  plan: '',
  adherence_score: 7
});

/**
 * SOAP clinical notes timeline for one client (dietitian-only writes).
 */
export default function SoapNotesPanel({ client, isAdmin }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);

  const loadNotes = useCallback(async () => {
    if (!client?.id || !isAdmin) {
      setNotes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error: qErr } = await supabase
        .from('clinical_notes')
        .select('*')
        .eq('client_id', client.id)
        .order('visit_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (qErr) throw qErr;
      setNotes(data || []);
    } catch (err) {
      setError(err?.message || 'Αποτυχία φόρτωσης σημειώσεων.');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [client?.id, isAdmin]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const onChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin || !client) return;
    setSaving(true);
    setError('');
    try {
      const user = await requireSessionUser();
      assertClientAccess(client, user, true);
      const parsed = parseSoapNote({ ...form, client_id: client.id });
      if (!parsed.success) {
        throw new Error(parsed.error.issues?.[0]?.message || 'Μη έγκυρα πεδία SOAP.');
      }
      const payload = { ...parsed.data, dietitian_id: user.id };
      const { data, error: insErr } = await supabase
        .from('clinical_notes')
        .insert([payload])
        .select()
        .single();
      if (insErr) throw insErr;
      setNotes((prev) => [data, ...prev]);
      setForm(emptyForm());
    } catch (err) {
      setError(err?.message || 'Αποτυχία αποθήκευσης.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin || !window.confirm('Διαγραφή αυτής της SOAP σημείωσης;')) return;
    setError('');
    try {
      const user = await requireSessionUser();
      assertClientAccess(client, user, true);
      const { error: delErr } = await supabase
        .from('clinical_notes')
        .delete()
        .eq('id', id)
        .eq('dietitian_id', user.id);
      if (delErr) throw delErr;
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      setError(err?.message || 'Αποτυχία διαγραφής.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="empty-state" role="status">
        <div className="empty-state__glyph" aria-hidden="true">🔒</div>
        <p className="empty-state__title font-display">Κλινικές σημειώσεις</p>
        <p className="empty-state__hint">Διαθέσιμες μόνο στον διαιτολόγο.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <div>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#e2e8f0' }}>
          Ιστορικό & SOAP Notes — {sanitizeText(client?.name, 80)}
        </h4>
        <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: '#94a3b8' }}>
          Subjective · Objective · Assessment · Plan · Συμμόρφωση 1–10
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'grid',
          gap: '9px',
          background: 'rgba(5,9,8,0.75)',
          padding: '13px',
          borderRadius: '13px',
          border: '1px solid rgba(255,255,255,0.07)'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '9px' }}>
          <div>
            <label className="field-label" htmlFor="soap-date">Ημερομηνία επίσκεψης</label>
            <input id="soap-date" className="luxury-input" type="date" required value={form.visit_date} onChange={onChange('visit_date')} />
          </div>
          <div>
            <label className="field-label" htmlFor="soap-adhere">Βαθμός συμμόρφωσης (1–10)</label>
            <input
              id="soap-adhere"
              className="luxury-input font-mono-num"
              type="number"
              min={1}
              max={10}
              required
              value={form.adherence_score}
              onChange={onChange('adherence_score')}
            />
          </div>
        </div>
        {[
          { id: 'subjective', label: 'Υποκειμενικά (Subjective)', key: 'subjective', ph: 'Συμπτώματα, δίαιτα, ενέργεια…' },
          { id: 'objective', label: 'Αντικειμενικά (Objective)', key: 'objective', ph: 'Βάρος, λιπομέτρηση, ζωτικά…' },
          { id: 'assessment', label: 'Αξιολόγηση (Assessment)', key: 'assessment', ph: 'Κλινική εκτίμηση προόδου…' },
          { id: 'plan', label: 'Πλάνο (Plan)', key: 'plan', ph: 'Επόμενα βήματα, στόχοι…' }
        ].map((f) => (
          <div key={f.key}>
            <label className="field-label" htmlFor={`soap-${f.id}`}>{f.label}</label>
            <textarea
              id={`soap-${f.id}`}
              className="luxury-input"
              rows={2}
              value={form[f.key]}
              onChange={onChange(f.key)}
              placeholder={f.ph}
              style={{ resize: 'vertical', minHeight: 52 }}
            />
          </div>
        ))}
        <button type="submit" className="btn-emerald" disabled={saving} style={{ padding: '11px', fontSize: '12px', cursor: 'pointer' }}>
          {saving ? 'Αποθήκευση…' : '+ Καταγραφή συνεδρίας'}
        </button>
      </form>

      {error ? (
        <div role="alert" style={{ fontSize: '12px', color: '#fca5a5' }}>{error}</div>
      ) : null}

      {loading ? (
        <div className="skeleton-block" style={{ height: 80 }} aria-busy="true" />
      ) : notes.length === 0 ? (
        <div className="empty-state" role="status">
          <div className="empty-state__glyph" aria-hidden="true">✎</div>
          <p className="empty-state__title font-display">Καμία SOAP σημείωση ακόμα</p>
          <p className="empty-state__hint">Καταγράψτε την πρώτη επίσκεψη παραπάνω — εμφανίζεται χρονολογικά.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }} aria-label="Χρονολόγιο SOAP">
          {notes.map((n) => (
            <article
              key={n.id}
              style={{
                background: 'rgba(5,9,8,0.75)',
                padding: '12px 14px',
                borderRadius: '13px',
                border: '1px solid rgba(255,255,255,0.07)',
                borderLeft: '3px solid #10b981'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <strong style={{ fontSize: '13px', color: '#fff' }}>📅 {n.visit_date}</strong>
                <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
                  <span className="status-badge status-badge--info font-mono-num">Συμμόρφωση {n.adherence_score}/10</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(n.id)}
                    aria-label="Διαγραφή σημείωσης"
                    style={{ background: 'rgba(239,68,68,0.14)', border: 'none', color: '#fca5a5', borderRadius: '8px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
              {[
                ['S', n.subjective],
                ['O', n.objective],
                ['A', n.assessment],
                ['P', n.plan]
              ].map(([lab, text]) =>
                text ? (
                  <p key={lab} style={{ margin: '0 0 6px', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.45 }}>
                    <span style={{ color: '#34d399', fontWeight: 800 }}>{lab}: </span>
                    {text}
                  </p>
                ) : null
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

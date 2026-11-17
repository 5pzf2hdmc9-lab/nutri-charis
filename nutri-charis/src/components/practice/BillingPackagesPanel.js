import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { requireSessionUser, assertClientAccess, sanitizeText } from '../../lib/authAccess';
import { parseBillingPackage } from '../../lib/practiceSchemas';
import { monthKey } from '../../lib/billingReceipt';
import BillingPackageCard from './BillingPackageCard';

const emptyForm = () => ({
  package_name: 'Πακέτο 6 συνεδριών',
  total_sessions: 6,
  used_sessions: 0,
  amount_eur: 180,
  payment_status: 'pending',
  payment_method: 'Μετρητά',
  notes: ''
});

/**
 * Session packages, monthly revenue, pending payments, printable receipt.
 */
export default function BillingPackagesPanel({ client, isAdmin }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    if (!client?.id || !isAdmin) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error: qErr } = await supabase
        .from('billing_packages')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });
      if (qErr) throw qErr;
      setRows(data || []);
    } catch (err) {
      setError(err?.message || 'Αποτυχία φόρτωσης πακέτων.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [client?.id, isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const thisMonth = monthKey(new Date().toISOString());
  const monthRevenue = useMemo(
    () =>
      rows
        .filter((r) => r.payment_status === 'paid' && monthKey(r.created_at) === thisMonth)
        .reduce((sum, r) => sum + Number(r.amount_eur || 0), 0),
    [rows, thisMonth]
  );
  const pendingCount = useMemo(
    () => rows.filter((r) => r.payment_status === 'pending' || r.payment_status === 'overdue').length,
    [rows]
  );

  const onChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin || !client) return;
    setSaving(true);
    setError('');
    try {
      const user = await requireSessionUser();
      assertClientAccess(client, user, true);
      const parsed = parseBillingPackage({ ...form, client_id: client.id });
      if (!parsed.success) {
        throw new Error(parsed.error.issues?.[0]?.message || 'Μη έγκυρα πεδία πακέτου.');
      }
      if (parsed.data.used_sessions > parsed.data.total_sessions) {
        throw new Error('Οι ολοκληρωμένες συνεδρίες δεν μπορούν να υπερβαίνουν το σύνολο.');
      }
      const payload = { ...parsed.data, dietitian_id: user.id };
      const { data, error: insErr } = await supabase.from('billing_packages').insert([payload]).select().single();
      if (insErr) throw insErr;
      setRows((prev) => [data, ...prev]);
      setForm(emptyForm());
    } catch (err) {
      setError(err?.message || 'Αποτυχία αποθήκευσης.');
    } finally {
      setSaving(false);
    }
  };

  const bumpSession = async (pkg) => {
    if (!isAdmin) return;
    if (pkg.used_sessions >= pkg.total_sessions) {
      setError('Το πακέτο έχει ήδη εξαντληθεί.');
      return;
    }
    setError('');
    try {
      const user = await requireSessionUser();
      assertClientAccess(client, user, true);
      const { data, error: upErr } = await supabase
        .from('billing_packages')
        .update({ used_sessions: pkg.used_sessions + 1 })
        .eq('id', pkg.id)
        .eq('dietitian_id', user.id)
        .select()
        .single();
      if (upErr) throw upErr;
      setRows((prev) => prev.map((r) => (r.id === pkg.id ? data : r)));
    } catch (err) {
      setError(err?.message || 'Αποτυχία ενημέρωσης συνεδρίας.');
    }
  };

  const setStatusPaid = async (pkg) => {
    try {
      const user = await requireSessionUser();
      assertClientAccess(client, user, true);
      const { data, error: upErr } = await supabase
        .from('billing_packages')
        .update({ payment_status: 'paid' })
        .eq('id', pkg.id)
        .eq('dietitian_id', user.id)
        .select()
        .single();
      if (upErr) throw upErr;
      setRows((prev) => prev.map((r) => (r.id === pkg.id ? data : r)));
    } catch (err) {
      setError(err?.message || 'Αποτυχία ενημέρωσης πληρωμής.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="empty-state" role="status">
        <div className="empty-state__glyph" aria-hidden="true">🔒</div>
        <p className="empty-state__title font-display">Πακέτα & Πληρωμές</p>
        <p className="empty-state__hint">Οικονομικός έλεγχος διαθέσιμος μόνο στον διαιτολόγο.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <div>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#e2e8f0' }}>
          Πακέτα & Πληρωμές — {sanitizeText(client?.name, 80)}
        </h4>
        <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: '#94a3b8' }}>
          Ενεργές συνεδρίες · έσοδα μήνα · εκκρεμότητες · εκτυπώσιμη σύνοψη
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '9px' }}>
        <div style={{ background: 'rgba(5,9,8,0.75)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="field-label">Έσοδα μήνα</div>
          <div className="font-mono-num" style={{ fontSize: '20px', fontWeight: 800, color: '#34d399' }}>
            {monthRevenue.toFixed(2)} €
          </div>
        </div>
        <div style={{ background: 'rgba(5,9,8,0.75)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="field-label">Εκκρεμείς / ληξιπρόθεσμες</div>
          <div className="font-mono-num" style={{ fontSize: '20px', fontWeight: 800, color: pendingCount ? '#fbbf24' : '#94a3b8' }}>
            {pendingCount}
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '9px',
          background: 'rgba(5,9,8,0.75)',
          padding: '13px',
          borderRadius: '13px',
          border: '1px solid rgba(255,255,255,0.07)'
        }}
      >
        <div>
          <label className="field-label" htmlFor="pkg-name">Όνομα πακέτου</label>
          <input id="pkg-name" className="luxury-input" required value={form.package_name} onChange={onChange('package_name')} />
        </div>
        <div>
          <label className="field-label" htmlFor="pkg-total">Σύνολο συνεδριών</label>
          <input id="pkg-total" className="luxury-input" type="number" min={1} max={100} required value={form.total_sessions} onChange={onChange('total_sessions')} />
        </div>
        <div>
          <label className="field-label" htmlFor="pkg-amount">Ποσό (€)</label>
          <input id="pkg-amount" className="luxury-input" type="number" min={0} step="0.01" required value={form.amount_eur} onChange={onChange('amount_eur')} />
        </div>
        <div>
          <label className="field-label" htmlFor="pkg-status">Κατάσταση πληρωμής</label>
          <select id="pkg-status" className="luxury-input" value={form.payment_status} onChange={onChange('payment_status')}>
            <option value="paid">Εξοφλημένο</option>
            <option value="pending">Εκκρεμές</option>
            <option value="overdue">Ληξιπρόθεσμο</option>
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="pkg-method">Τρόπος πληρωμής</label>
          <input id="pkg-method" className="luxury-input" value={form.payment_method} onChange={onChange('payment_method')} placeholder="Μετρητά / IRIS / Κάρτα" />
        </div>
        <div>
          <label className="field-label" htmlFor="pkg-notes">Σημειώσεις</label>
          <input id="pkg-notes" className="luxury-input" value={form.notes} onChange={onChange('notes')} />
        </div>
        <button type="submit" className="btn-emerald" disabled={saving} style={{ padding: '11px', fontSize: '12px', cursor: 'pointer', alignSelf: 'end' }}>
          {saving ? 'Αποθήκευση…' : '+ Νέο πακέτο'}
        </button>
      </form>

      {error ? <div role="alert" style={{ fontSize: '12px', color: '#fca5a5' }}>{error}</div> : null}

      {loading ? (
        <div className="skeleton-block" style={{ height: 80 }} aria-busy="true" />
      ) : rows.length === 0 ? (
        <div className="empty-state" role="status">
          <div className="empty-state__glyph" aria-hidden="true">€</div>
          <p className="empty-state__title font-display">Κανένα πακέτο ακόμα</p>
          <p className="empty-state__hint">Προσθέστε πακέτο συνεδριών για πρόοδο και πληρωμές.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {rows.map((pkg) => (
            <BillingPackageCard
              key={pkg.id}
              pkg={pkg}
              client={client}
              onBump={bumpSession}
              onMarkPaid={setStatusPaid}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import GdprConsentFields from '../GdprConsentFields';
import { supabase } from '../../supabaseClient';

/**
 * One-time gate: stamps gdpr/art9/terms on public.dietitians when missing.
 */
export default function DietitianConsentGate({ isAdmin, session, setLegalDoc, showToast }) {
  const [needed, setNeeded] = useState(false);
  const [checking, setChecking] = useState(false);
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [art9Accepted, setArt9Accepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin || !session?.user?.id) {
      setNeeded(false);
      return undefined;
    }
    let cancelled = false;
    setChecking(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('dietitians')
          .select('gdpr_consent_at, art9_consent_at, terms_accepted_at')
          .eq('user_id', session.user.id)
          .maybeSingle();
        if (cancelled) return;
        if (error || !data) {
          setNeeded(false);
          return;
        }
        const missing = !data.gdpr_consent_at || !data.art9_consent_at || !data.terms_accepted_at;
        setNeeded(missing);
      } catch {
        if (!cancelled) setNeeded(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, session?.user?.id]);

  const handleStamp = async (e) => {
    e.preventDefault();
    if (!gdprAccepted || !art9Accepted || !termsAccepted || saving) return;
    setSaving(true);
    try {
      const consentAt = new Date().toISOString();
      const { error } = await supabase
        .from('dietitians')
        .update({
          gdpr_consent_at: consentAt,
          art9_consent_at: consentAt,
          terms_accepted_at: consentAt
        })
        .eq('user_id', session.user.id);
      if (error) throw new Error(error.message);
      setNeeded(false);
      showToast?.('✓ Καταχωρήθηκε συγκατάθεση GDPR / Όρων στο προφίλ διαιτολόγου');
    } catch (err) {
      showToast?.(`⚠️ ${err.message || 'Αποτυχία καταγραφής συγκατάθεσης'}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin || checking || !needed) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dietitian-consent-title"
      className="glass-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 650,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <form
        className="luxury-card glass-elevated"
        onSubmit={handleStamp}
        style={{ width: '100%', maxWidth: '520px', padding: '22px', display: 'grid', gap: '12px' }}
      >
        <h2 id="dietitian-consent-title" className="font-display" style={{ margin: 0, fontSize: '17px', color: '#ecfdf5' }}>
          Συγκατάθεση διαιτολόγου (GDPR)
        </h2>
        <p style={{ margin: 0, fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.55 }}>
          Απαιτείται καταγραφή timestamp αποδοχής Όρων, Πολιτικής Απορρήτου και Άρθρου 9 στο προφίλ
          <span className="font-mono-num"> dietitians</span> πριν συνεχίσετε την κλινική χρήση.
        </p>
        <GdprConsentFields
          gdprAccepted={gdprAccepted}
          setGdprAccepted={setGdprAccepted}
          art9Accepted={art9Accepted}
          setArt9Accepted={setArt9Accepted}
          termsAccepted={termsAccepted}
          setTermsAccepted={setTermsAccepted}
          onOpenLegal={setLegalDoc}
        />
        <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: 1.45 }}>
          Διαφάνεια AI:{' '}
          <button
            type="button"
            onClick={() => setLegalDoc?.('ai')}
            style={{
              background: 'none',
              border: 'none',
              color: '#34d399',
              fontWeight: 800,
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'underline',
              fontSize: 'inherit'
            }}
          >
            AI Transparency Notice
          </button>
        </p>
        <button type="submit" className="btn-emerald" disabled={saving || !gdprAccepted || !art9Accepted || !termsAccepted} style={{ padding: '12px', cursor: 'pointer' }}>
          {saving ? 'Αποθήκευση…' : 'Καταγραφή συγκατάθεσης'}
        </button>
      </form>
    </div>
  );
}

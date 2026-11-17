import React from 'react';
import { BILLING_STATUS_CLASS, BILLING_STATUS_LABEL, printPackageReceipt } from '../../lib/billingReceipt';

/** One billing package row: progress, +1 session, pay mark, print. */
export default function BillingPackageCard({ pkg, client, onBump, onMarkPaid }) {
  const pct = Math.min(100, Math.round((pkg.used_sessions / Math.max(1, pkg.total_sessions)) * 100));
  const active = pkg.used_sessions < pkg.total_sessions;

  return (
    <div
      style={{
        background: 'rgba(5,9,8,0.75)',
        padding: '13px 14px',
        borderRadius: '13px',
        border: '1px solid rgba(255,255,255,0.07)',
        opacity: active ? 1 : 0.78
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
        <div>
          <strong style={{ color: '#fff', fontSize: '13.5px' }}>{pkg.package_name}</strong>
          <div className="font-mono-num" style={{ fontSize: '12px', color: '#34d399', marginTop: 2 }}>
            {pkg.used_sessions}/{pkg.total_sessions} συνεδρίες · {Number(pkg.amount_eur).toFixed(2)} €
          </div>
        </div>
        <span className={`status-badge ${BILLING_STATUS_CLASS[pkg.payment_status] || ''}`}>
          {BILLING_STATUS_LABEL[pkg.payment_status] || pkg.payment_status}
        </span>
      </div>
      <div
        style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: '10px' }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#059669,#34d399)' }} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
        <button
          type="button"
          className="btn-emerald"
          disabled={!active}
          onClick={() => onBump(pkg)}
          style={{ padding: '7px 12px', fontSize: '11px', cursor: active ? 'pointer' : 'not-allowed' }}
        >
          +1 Ολοκληρωμένη Συνεδρία
        </button>
        {pkg.payment_status !== 'paid' ? (
          <button
            type="button"
            onClick={() => onMarkPaid(pkg)}
            style={{
              padding: '7px 12px',
              fontSize: '11px',
              borderRadius: 99,
              border: '1px solid rgba(16,185,129,0.4)',
              background: 'rgba(16,185,129,0.12)',
              color: '#6ee7b7',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            Σήμανση εξοφλημένου
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => printPackageReceipt({ client, pkg })}
          style={{
            padding: '7px 12px',
            fontSize: '11px',
            borderRadius: 99,
            border: '1px solid rgba(148,163,184,0.35)',
            background: 'rgba(255,255,255,0.04)',
            color: '#cbd5e1',
            cursor: 'pointer',
            fontWeight: 700
          }}
        >
          Εκτύπωση σύνοψης
        </button>
      </div>
    </div>
  );
}


/** Linear/Stripe-grade empty state — one job, clear CTA, no misleading chrome. */
export default function EmptyState({ icon = '◇', glyph, title, body, hint, actionLabel, onAction }) {
  const detail = body || hint;
  const mark = glyph || icon;
  return (
    <div className="empty-state" role="status">
      <div className="empty-state__glyph" aria-hidden="true">
        {mark}
      </div>
      <p className="empty-state__title font-display">{title}</p>
      {detail ? <p className="empty-state__hint">{detail}</p> : null}
      {actionLabel && typeof onAction === 'function' ? (
        <button type="button" className="btn-emerald" onClick={onAction} style={{ padding: '10px 16px', marginTop: '10px' }}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

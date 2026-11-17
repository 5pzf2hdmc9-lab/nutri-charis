
export default function DataSkeleton() {
  return (
    <div className="luxury-card" style={{ padding: '16px', display: 'grid', gap: '12px' }} aria-busy="true" aria-label="Φόρτωση δεδομένων">
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div className="skeleton-block" style={{ width: 42, height: 42, borderRadius: 13 }} />
        <div style={{ flex: 1, display: 'grid', gap: 8 }}>
          <div className="skeleton-block" style={{ height: 14, width: '42%' }} />
          <div className="skeleton-block" style={{ height: 10, width: '28%' }} />
        </div>
      </div>
      <div className="telemetry-core-grid">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-block" style={{ height: 64 }} />
        ))}
      </div>
      <div className="skeleton-block" style={{ height: 120 }} />
    </div>
  );
}

import { usePlatform } from '../platformContext';

export default function PlanAdherence() {
  const { activeClientObj, adjustWaterGlass, dayAdherence, isAdmin, selectedDay, waterGlasses } = usePlatform();
  const todayWaterGlasses = activeClientObj ? waterGlasses[`${activeClientObj.id}_${selectedDay}`] || 0 : 0;
  return (
!isAdmin && (
              <section className="luxury-card" style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div style={{ background: 'rgba(5,9,8,0.75)', padding: '13px 15px', borderRadius: '14px', border: '1px solid rgba(16,185,129,0.28)' }}>
                  <div style={{ fontSize: '10.5px', color: '#6ee7b7', fontWeight: '800' }}>ΣΥΜΜΟΡΦΩΣΗ ({selectedDay})</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '4px 0' }}>
                    <span className="font-mono-num" style={{ fontSize: '24px', fontWeight: '800', color: '#34d399' }}>{dayAdherence.pct}%</span>
                    <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>({dayAdherence.done}/{dayAdherence.total} γεύματα)</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${dayAdherence.pct}%`, height: '100%', background: '#10b981', transition: 'width 0.3s ease' }} />
                  </div>
                </div>

                <div style={{ background: 'rgba(5,9,8,0.75)', padding: '13px 15px', borderRadius: '14px', border: '1px solid rgba(56,189,248,0.28)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '10.5px', color: '#7dd3fc', fontWeight: '800' }}>ΕΝΥΔΑΤΩΣΗ ({selectedDay})</div>
                    <div className="font-mono-num" style={{ fontSize: '21px', fontWeight: '800', color: '#38bdf8', margin: '3px 0' }}>
                      {todayWaterGlasses * 250} ml
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>{todayWaterGlasses} ποτήρια (250ml)</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => adjustWaterGlass(-1)}
                      style={{ width: '34px', height: '34px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '18px', fontWeight: '800', cursor: 'pointer' }}
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustWaterGlass(1)}
                      style={{ width: '34px', height: '34px', borderRadius: '10px', border: 'none', background: '#0284c7', color: '#fff', fontSize: '18px', fontWeight: '800', cursor: 'pointer' }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </section>
            )
  );
}


export default function WeeklyEnergySvgChart({ weeklyStats, targetKcal, selectedDay, onSelectDay }) {
  const maxVal = Math.max(targetKcal * 1.2, ...weeklyStats.map((d) => d.kcal), 1800);
  const targetY = 120 - Math.round((targetKcal / maxVal) * 100);

  return (
    <div style={{ background: 'rgba(5, 9, 8, 0.78)', padding: '13px 14px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
        <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#e2e8f0' }}>
          📊 Εβδομαδιαία Ενεργειακή Καμπύλη
        </span>
        <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: '700' }}>--- Στόχος {targetKcal} kcal</span>
      </div>

      <svg viewBox="0 0 700 146" style={{ width: '100%', height: '118px', overflow: 'visible' }}>
        <line x1="20" y1={targetY} x2="680" y2={targetY} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.85" />
        <text x="680" y={targetY - 5} fill="#fbbf24" fontSize="10.5" fontWeight="700" textAnchor="end">
          {targetKcal} kcal
        </text>

        {weeklyStats.map((d, idx) => {
          const x = 42 + idx * 92;
          const barH = Math.max(4, Math.round((d.kcal / maxVal) * 100));
          const y = 120 - barH;
          const active = d.day === selectedDay;
          return (
            <g key={d.day} onClick={() => onSelectDay(d.day)} style={{ cursor: 'pointer' }}>
              <rect
                x={x}
                y={y}
                width="44"
                height={barH}
                rx="8"
                fill={active ? '#10b981' : 'rgba(52, 211, 153, 0.28)'}
                stroke={active ? '#6ee7b7' : 'rgba(52, 211, 153, 0.4)'}
                strokeWidth="1.2"
              />
              <text x={x + 22} y={y - 5} fill={active ? '#fff' : '#94a3b8'} fontSize="11" fontWeight="800" textAnchor="middle">
                {d.kcal > 0 ? d.kcal : '—'}
              </text>
              <text x={x + 22} y="138" fill={active ? '#34d399' : '#94a3b8'} fontSize="11.5" fontWeight={active ? '800' : '600'} textAnchor="middle">
                {d.day.slice(0, 3)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

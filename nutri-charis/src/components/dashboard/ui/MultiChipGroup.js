
export default function MultiChipGroup({ options, values = [], onToggle }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {options.map((opt) => {
        const active = (values || []).includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            style={{
              padding: '6px 11px',
              borderRadius: '99px',
              fontSize: '11.5px',
              fontWeight: active ? '700' : '500',
              background: active ? 'rgba(16, 185, 129, 0.22)' : 'rgba(255, 255, 255, 0.04)',
              color: active ? '#6ee7b7' : '#cbd5e1',
              border: active ? '1px solid rgba(16, 185, 129, 0.55)' : '1px solid rgba(255, 255, 255, 0.08)',
              cursor: 'pointer'
            }}
          >
            {active ? `✓ ${opt}` : opt}
          </button>
        );
      })}
    </div>
  );
}

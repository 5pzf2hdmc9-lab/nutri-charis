import { useState } from 'react';
import { DAYS, GREEK_FOOD_EXCHANGES, MEAL_TYPES } from '../../../constants/dietPlan';
import { EXCHANGE_LABELS } from '../../../lib/exchangeCoverage';
import { usePlatform } from '../platformContext';

export default function ExchangeLibrary() {
  const { activeClientObj, handleSelectMealOption, selectedDay, showToast } = usePlatform();
  const [mealSlot, setMealSlot] = useState('Μεσημεριανό');
  const day = selectedDay || DAYS[0];

  const insert = (item) => {
    if (!activeClientObj) return;
    const line = `${item.grams}γρ ${item.food}`;
    const current = String(activeClientObj.meal_plan?.[day]?.[mealSlot] || '');
    if (current.toLowerCase().includes(String(item.food).toLowerCase())) {
      showToast('Υπάρχει ήδη σε αυτό το γεύμα.');
      return;
    }
    const next = current.trim() ? `${current.trim()}, ${line}` : line;
    handleSelectMealOption(day, mealSlot, next);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'end', flexWrap: 'wrap', marginBottom: 8 }}>
        <h4 className="font-display" style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#6ee7b7' }}>
          Ελληνικά ισοδύναμα · 1-click
        </h4>
        <div style={{ minWidth: 160 }}>
          <label className="field-label" htmlFor="exchange-slot">Γεύμα ({day})</label>
          <select id="exchange-slot" className="luxury-input" value={mealSlot} onChange={(e) => setMealSlot(e.target.value)}>
            {MEAL_TYPES.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="exchange-grid">
        {Object.entries(GREEK_FOOD_EXCHANGES).map(([key, items]) => (
          <div key={key} className="exchange-tile">
            <div className="field-label" style={{ marginBottom: 6 }}>{EXCHANGE_LABELS[key] || key}</div>
            <div style={{ display: 'grid', gap: 4 }}>
              {items.map((it) => (
                <button
                  key={it.food}
                  type="button"
                  onClick={() => insert(it)}
                  style={{
                    textAlign: 'left',
                    background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(52,211,153,0.28)',
                    color: '#d1fae5',
                    borderRadius: 8,
                    padding: '5px 7px',
                    fontSize: 11,
                    cursor: 'pointer'
                  }}
                >
                  <span className="font-mono-num">{it.grams}γρ</span> {it.food}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { DAYS } from '../../constants/dietPlan';
import { EXCHANGE_LABELS, countDayExchanges, exchangeTone } from '../../lib/exchangeCoverage';
import { usePlatform } from '../dashboard/platformContext';

const TONE = { under: 'info', ok: 'success', over: 'warn' };
const TONE_WORD = { under: 'κάτω', ok: 'στόχος', over: 'πάνω' };

export default function ExchangeCoverage() {
  const { activeClientObj, activeTab, selectedDay } = usePlatform();
  if (activeTab !== 'plan' || !activeClientObj) return null;
  const day = selectedDay || DAYS[0];
  const meals = activeClientObj.meal_plan?.[day] || {};
  const hasMeals = Object.values(meals).some((t) => String(t || '').trim());
  const { counts, targets } = countDayExchanges(meals);

  return (
    <section className="luxury-card" style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <div>
          <h3 className="font-display" style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Ισοδύναμα ημέρας</h3>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: '#94a3b8' }}>
            {day} · διακριτά τρόφιμα της λίστας έναντι μεσογειακού στόχου 4 / 4 / 3 / 4
          </p>
        </div>
      </div>
      {!hasMeals ? (
        <div className="empty-state" role="status" style={{ minHeight: 0, padding: '16px 12px' }}>
          <p className="empty-state__title font-display" style={{ fontSize: 13 }}>Κενή ημέρα</p>
          <p className="empty-state__hint">Εφαρμόστε πρότυπο ή προσθέστε ισοδύναμο με 1-click από τη βιβλιοθήκη.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
          {Object.keys(targets).map((key) => {
            const tone = exchangeTone(counts[key], targets[key]);
            return (
              <div key={key} style={{ background: 'rgba(5,9,8,0.75)', borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="field-label">{EXCHANGE_LABELS[key]}</div>
                <div className="font-mono-num" style={{ fontSize: 18, fontWeight: 800, color: '#ecfdf5' }}>
                  {counts[key]}<span style={{ fontSize: 12, color: '#94a3b8' }}>/{targets[key]}</span>
                </div>
                <span className={`status-badge status-badge--${TONE[tone]}`} style={{ marginTop: 6 }}>{TONE_WORD[tone]}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

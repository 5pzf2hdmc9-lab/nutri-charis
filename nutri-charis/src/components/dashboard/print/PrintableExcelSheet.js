import { DAYS, MEAL_TYPES } from '../../../constants/dietPlan';
import { cleanMealText } from '../../../lib/mealText';

export default function PrintableExcelSheet({ id, theme = 'green', clientObj, mealPlan }) {
  const palette =
    theme === 'blue'
      ? {
          sheetBg: '#e4eff8',
          bannerBg: '#184e77',
          bannerAccent: '#bae6fd',
          thBg: '#276694',
          thText: '#f0f9ff',
          mealColBg: '#cde2f2',
          mealColText: '#103754',
          rowEven: '#dfeef9',
          rowOdd: '#d4e7f6',
          border: '#99c1de',
          cellText: '#102a43'
        }
      : {
          sheetBg: '#e4f3ec',
          bannerBg: '#165b44',
          bannerAccent: '#a7f3d0',
          thBg: '#217558',
          thText: '#ecfdf5',
          mealColBg: '#cbe7da',
          mealColText: '#0f3d2e',
          rowEven: '#dff1e8',
          rowOdd: '#d3eadf',
          border: '#93cbb3',
          cellText: '#0f2e24'
        };

  return (
    <div
      id={id}
      style={{
        background: palette.sheetBg,
        borderRadius: '14px',
        overflow: 'hidden',
        border: `2px solid ${palette.bannerBg}`,
        color: palette.cellText,
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <div
        style={{
          background: palette.bannerBg,
          padding: '15px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.01em' }}>
            Χάρις Φωτούδη
          </div>
          <div style={{ fontSize: '11.5px', color: palette.bannerAccent, fontWeight: '600', marginTop: '2px' }}>
            Κλινική Διαιτολόγος – Διατροφολόγος • Εξατομικευμένο Εβδομαδιαίο Διαιτολόγιο
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc' }}>
            Πελάτης: {clientObj?.name || '—'}
          </div>
          <div style={{ fontSize: '11px', color: palette.bannerAccent, marginTop: '2px' }}>
            {clientObj?.goal ? `Στόχος: ${clientObj.goal}` : 'Εβδομαδιαίο Πρόγραμμα Διατροφής'}
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '11px' }}>
          <thead>
            <tr>
              <th
                style={{
                  width: '10.5%',
                  background: palette.thBg,
                  color: palette.thText,
                  padding: '8px 8px',
                  textAlign: 'left',
                  fontWeight: '800',
                  border: `1px solid ${palette.border}`,
                  textTransform: 'uppercase'
                }}
              >
                Γεύμα
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  style={{
                    width: '12.78%',
                    background: palette.thBg,
                    color: palette.thText,
                    padding: '8px 8px',
                    textAlign: 'center',
                    fontWeight: '800',
                    border: `1px solid ${palette.border}`,
                    textTransform: 'uppercase'
                  }}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEAL_TYPES.map((m, idx) => (
              <tr key={m.key}>
                <td
                  style={{
                    background: palette.mealColBg,
                    color: palette.mealColText,
                    fontWeight: '800',
                    padding: '8px 8px',
                    border: `1px solid ${palette.border}`,
                    verticalAlign: 'top'
                  }}
                >
                  {m.label}
                </td>
                {DAYS.map((day) => {
                  const cleanText = cleanMealText(mealPlan?.[day]?.[m.key] || '');
                  return (
                    <td
                      key={day}
                      style={{
                        background: idx % 2 === 0 ? palette.rowEven : palette.rowOdd,
                        color: palette.cellText,
                        padding: '8px 9px',
                        border: `1px solid ${palette.border}`,
                        verticalAlign: 'top',
                        lineHeight: '1.4',
                        fontWeight: '500',
                        wordBreak: 'break-word'
                      }}
                    >
                      {cleanText || '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          background: palette.mealColBg,
          padding: '7px 16px',
          fontSize: '9.5px',
          color: palette.mealColText,
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: `1px solid ${palette.border}`,
          fontWeight: '600'
        }}
      >
        <span>Εξατομικευμένο διαιτολογικό πρόγραμμα • Δεν υποκαθιστά ιατρική γνωμάτευση.</span>
        <span>Προστασία Προσωπικών Δεδομένων (GDPR) • Χάρις Φωτούδη</span>
      </div>
    </div>
  );
}

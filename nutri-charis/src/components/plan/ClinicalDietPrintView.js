import React from 'react';
import { computeMacroTargets } from '../../lib/macroTargets';

function clean(text) {
  return String(text || '')
    .replace(/^\s+|\s+$/g, '')
    .replace(/^[-•*]+\s*/, '');
}

/**
 * White clinical A4 print document — header, macros, 7-day plan, shopping, disclaimer.
 */
export default function ClinicalDietPrintView({
  id = 'clinical-diet-print',
  clientObj,
  mealPlan = {},
  days = [],
  mealTypes = [],
  shoppingList = [],
  targetKcal,
  bmr,
  tdee
}) {
  const targets = computeMacroTargets({
    targetKcal,
    weightKg: clientObj?.weight
  });
  const plan = mealPlan || {};
  const meals = mealTypes.length
    ? mealTypes
    : [
        { key: 'Πρωινό', label: 'Πρωινό' },
        { key: 'Σνακ 1', label: 'Σνακ 1' },
        { key: 'Μεσημεριανό', label: 'Μεσημεριανό' },
        { key: 'Σνακ 2', label: 'Σνακ 2' },
        { key: 'Βραδινό', label: 'Βραδινό' }
      ];

  return (
    <div id={id} className="clinical-print-doc" style={{ background: '#fff', color: '#111', fontFamily: 'Georgia, "Times New Roman", serif' }}>
      <header style={{ borderBottom: '2px solid #111', paddingBottom: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.01em' }}>
          Χάρις Φωτούδη • Κλινικό Διαιτολογικό Γραφείο
        </div>
        <div style={{ fontSize: 11, color: '#333', marginTop: 4 }}>Εξατομικευμένο Εβδομαδιαίο Διαιτολόγιο · NutriCharis</div>
      </header>

      <section style={{ marginBottom: 14, fontSize: 12, lineHeight: 1.45 }}>
        <strong>Στοιχεία πελάτη</strong>
        <div>Ονοματεπώνυμο: {clientObj?.name || '—'}</div>
        <div>
          Ηλικία: {clientObj?.age || '—'} · Φύλο:{' '}
          {clientObj?.gender === 'male' ? 'Άνδρας' : clientObj?.gender === 'female' ? 'Γυναίκα' : '—'} · Βάρος:{' '}
          {clientObj?.weight || '—'} kg · Ύψος: {clientObj?.height || '—'} cm
        </div>
        {clientObj?.goal ? <div>Στόχος: {clientObj.goal}</div> : null}
      </section>

      <section style={{ marginBottom: 14, fontSize: 12 }}>
        <strong>Στόχοι μακροθρεπτικών (ημερήσια)</strong>
        <div style={{ marginTop: 4 }}>
          BMR {bmr || '—'} kcal · TDEE {tdee || '—'} kcal · Στόχος {targets.kcal} kcal
        </div>
        <div>
          Πρωτεΐνη {targets.protein} g · Υδατάνθρακες {targets.carbs} g · Λιπαρά {targets.fat} g · Φυτικές ίνες{' '}
          {targets.fiber} g
        </div>
      </section>

      <section style={{ marginBottom: 14 }}>
        <strong style={{ fontSize: 12 }}>Πρόγραμμα 7 ημερών</strong>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6, fontSize: 9.5 }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #999', padding: 4, textAlign: 'left', background: '#f5f5f5' }}>Γεύμα</th>
              {days.map((d) => (
                <th key={d} style={{ border: '1px solid #999', padding: 4, background: '#f5f5f5' }}>
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {meals.map((meal) => {
              const key = meal.key || meal;
              const label = meal.label || meal.key || meal;
              return (
                <tr key={key}>
                  <td style={{ border: '1px solid #999', padding: 4, fontWeight: 700, verticalAlign: 'top' }}>{label}</td>
                  {days.map((day) => (
                    <td key={day} style={{ border: '1px solid #999', padding: 4, verticalAlign: 'top', lineHeight: 1.35 }}>
                      {clean(plan?.[day]?.[key]) || '—'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {shoppingList.length > 0 && (
        <section style={{ marginBottom: 14, fontSize: 11 }}>
          <strong>Λίστα αγορών</strong>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
            {shoppingList.map((g) => (
              <div key={g.category}>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{g.category}</div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {g.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer
        style={{
          borderTop: '1px solid #999',
          paddingTop: 10,
          fontSize: 9.5,
          color: '#333',
          lineHeight: 1.4
        }}
      >
        <strong>Ιατρική Αποποίηση:</strong> Το παρόν διαιτολόγιο αποτελεί εργαλείο διατροφικής υποστήριξης και δεν
        υποκαθιστά ιατρική διάγνωση, θεραπεία ή φαρμακευτική αγωγή. Σε περίπτωση παθολογικής κατάστασης, συμβουλευτείτε
        τον θεράποντα ιατρό σας. Επεξεργασία δεδομένων ειδικών κατηγοριών κατά GDPR Άρθρο 9.
        <div style={{ marginTop: 6 }}>© Χάρις Φωτούδη · Κλινικό Διαιτολογικό Γραφείο · NutriCharis</div>
      </footer>
    </div>
  );
}

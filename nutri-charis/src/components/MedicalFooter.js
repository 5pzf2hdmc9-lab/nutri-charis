import React from 'react';
import { LegalLinks } from './LegalModal';

const DISCLAIMER =
  'Το NutriCharis αποτελεί εργαλείο υποστήριξης διαιτολογικού σχεδιασμού (Π.Δ. 133/2014 · Κώδικας Δεοντολογίας Διαιτολόγων) και δεν υποκαθιστά ιατρική διάγνωση, φαρμακευτική αγωγή ή θεραπεία. Οι AI προτάσεις γευμάτων ελέγχονται υποχρεωτικά από πτυχιούχο διαιτολόγο πριν δοθούν σε πελάτη.';

export default function MedicalFooter({ onOpenLegal, compact = false }) {
  return (
    <footer
      className="no-print"
      style={{
        marginTop: compact ? '14px' : '28px',
        padding: compact ? '14px 14px 12px' : '18px 16px',
        border: '1px solid rgba(255,255,255,0.07)',
        background:
          'linear-gradient(180deg, rgba(8, 18, 14, 0.55) 0%, rgba(2, 12, 9, 0.82) 100%)',
        borderRadius: '14px',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
      }}
    >
      <p
        style={{
          margin: '0 0 10px 0',
          fontSize: compact ? '11px' : '12px',
          lineHeight: 1.55,
          color: '#94a3b8',
          textAlign: 'center'
        }}
      >
        <strong style={{ color: '#fbbf24' }}>Ιατρική Αποποίηση:</strong> {DISCLAIMER}
      </p>
      {onOpenLegal && <LegalLinks onOpen={onOpenLegal} />}
      <p style={{ margin: '10px 0 0 0', fontSize: '10.5px', color: '#64748b', textAlign: 'center' }}>
        GDPR Άρθρο 9 • Ν. 4624/2019 • AI Act διαφάνεια • Π.Δ. 133/2014 • Χάρις Φωτούδη
      </p>
    </footer>
  );
}

export { DISCLAIMER };

import React, { useEffect } from 'react';

const DOCS = {
  privacy: {
    title: 'Πολιτική Απορρήτου (GDPR)',
    body: [
      'Η παρούσα Πολιτική Απορρήτου περιγράφει τον τρόπο με τον οποίο η Χάρις Φωτούδη («Υπεύθυνος Επεξεργασίας») μέσω της πλατφόρμας NutriCharis συλλέγει και επεξεργάζεται προσωπικά δεδομένα, συμπεριλαμβανομένων ειδικών κατηγοριών δεδομένων υγείας κατά το Άρθρο 9 ΓΚΠΔ / GDPR και τον Ν. 4624/2019.',
      'Κατηγορίες δεδομένων: στοιχεία ταυτότητας επικοινωνίας, ανθρωπομετρικά (βάρος, ύψος, ηλικία, φύλο), ποσοστό λίπους/μυϊκής μάζας, στόχοι διατροφής, αλλεργίες/παθήσεις που δηλώνετε, διαιτολόγια, μετρήσεις και ραντεβού.',
      'Νομική βάση: ρητή συγκατάθεση (Άρθρο 6 §1α και Άρθρο 9 §2α GDPR) για επεξεργασία δεδομένων υγείας στο πλαίσιο παροχής διαιτολογικών υπηρεσιών. Μπορείτε να ανακαλέσετε τη συγκατάθεση ανά πάσα στιγμή χωρίς να θίγεται η νομιμότητα της επεξεργασίας πριν την ανάκληση.',
      'Διαβιβάσεις: τα δεδομένα φιλοξενούνται σε υποδομές Supabase (ΕΕ/πιστοποιημένοι πάροχοι με κατάλληλες εγγυήσεις). Δεν πωλούνται σε τρίτους για διαφημιστικούς σκοπούς.',
      'Δικαιώματα: πρόσβαση, διόρθωση, διαγραφή (Άρθρο 17), περιορισμός, φορητότητα (Άρθρο 20), εναντίωση και καταγγελία στην Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα (www.dpa.gr).',
      'Χρόνος τήρησης: για όσο διάστημα υφίσταται η επαγγελματική σχέση και έως ότου ασκήσετε δικαίωμα διαγραφής, εκτός αν επιβάλλεται μεγαλύτερη διατήρηση από φορολογική/επαγγελματική υποχρέωση.',
      'Επικοινωνία Υπευθύνου: μέσω των στοιχείων επικοινωνίας του διατροφολογικού γραφείου Χάρις Φωτούδη στην πλατφόρμα NutriCharis.'
    ]
  },
  terms: {
    title: 'Όροι Χρήσης',
    body: [
      'Η πλατφόρμα NutriCharis παρέχεται αποκλειστικά για υποστήριξη διαιτολογικού σχεδιασμού μεταξύ πιστοποιημένου επαγγελματία υγείας/διατροφής και πελατών του.',
      'Ο λογαριασμός είναι προσωπικός. Απαγορεύεται η κοινή χρήση κωδικών, η απόπειρα πρόσβασης σε φακέλους τρίτων και κάθε κακόβουλη χρήση (scraping, brute-force, injection).',
      'Τα διαιτολόγια και οι υπολογισμοί BMR/TDEE/μικροθρεπτικών αποτελούν εργαλεία υποστήριξης και δεν υποκαθιστούν ιατρική διάγνωση ή θεραπεία.',
      'Ο χρήστης δηλώνει ότι τα στοιχεία που καταχωρεί είναι ακριβή και ότι έχει δικαίωμα να τα παράσχει.',
      'Η Χάρις Φωτούδη διατηρεί το δικαίωμα προσωρινής αναστολής πρόσβασης σε περίπτωση παραβίασης των παρόντων όρων ή κινδύνου για την ασφάλεια των δεδομένων.',
      'Εφαρμοστέο δίκαιο: Ελληνικό δίκαιο και Κανονισμός (ΕΕ) 2016/679 (GDPR).'
    ]
  },
  cookies: {
    title: 'Πολιτική Cookies & Τοπικής Αποθήκευσης',
    body: [
      'Η NutriCharis χρησιμοποιεί απαραίτητη τοπική αποθήκευση (localStorage / sessionStorage) για: συνεδρία Supabase Auth, προτιμήσεις UI, καταγραφή υδατικής πρόσληψης/συμμόρφωσης γευμάτων, πρόχειρα πρότυπα εβδομάδας και (προαιρετικά) κλειδί AI που εισάγει ο ίδιος ο διαχειριστής στη συσκευή του.',
      'Δεν χρησιμοποιούμε διαφημιστικά cookies τρίτων ούτε trackers marketing.',
      'Μπορείτε να διαγράψετε τα δεδομένα τοπικής αποθήκευσης από τις ρυθμίσεις του προγράμματος περιήγησης. Η διαγραφή cookies συνεδρίας θα σας αποσυνδέσει.',
      'Για λειτουργίες AI, το κλειδί API αποθηκεύεται μόνο τοπικά στη συσκευή του διαχειριστή και δεν αποστέλλεται στη βάση NutriCharis.'
    ]
  }
};

export default function LegalModal({ docKey, onClose }) {
  const doc = DOCS[docKey];

  useEffect(() => {
    if (!doc) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doc, onClose]);

  if (!doc) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="glass-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="luxury-card glass-elevated"
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '85vh',
          overflow: 'auto',
          padding: '24px',
          animation: 'fadeInSlide 0.22s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="legal-modal-title" style={{ margin: '0 0 14px 0', fontSize: '18px', color: '#ecfdf5' }}>
          {doc.title}
        </h2>
        <div style={{ display: 'grid', gap: '12px' }}>
          {doc.body.map((p) => (
            <p key={p.slice(0, 40)} style={{ margin: 0, fontSize: '13px', lineHeight: 1.65, color: '#cbd5e1' }}>
              {p}
            </p>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: '18px',
            width: '100%',
            padding: '12px',
            background: '#059669',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          Κλείσιμο
        </button>
      </div>
    </div>
  );
}

export function LegalLinks({ onOpen }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', fontSize: '11px' }}>
      <button type="button" onClick={() => onOpen('privacy')} style={linkBtn}>
        Πολιτική Απορρήτου
      </button>
      <button type="button" onClick={() => onOpen('terms')} style={linkBtn}>
        Όροι Χρήσης
      </button>
      <button type="button" onClick={() => onOpen('cookies')} style={linkBtn}>
        Cookies / Storage
      </button>
    </div>
  );
}

const linkBtn = {
  background: 'none',
  border: 'none',
  color: '#34d399',
  fontWeight: 700,
  cursor: 'pointer',
  padding: 0,
  textDecoration: 'underline'
};

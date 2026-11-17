import React, { useMemo, useState } from 'react';
import { buildGoogleCalendarUrl, buildIcsContent, downloadIcsFile } from '../../lib/calendarLinks';
import { buildNotifyPayload } from '../../lib/notifyLinks';
import { buildJitsiRoomUrl, copyTelehealthLink } from '../../lib/telehealth';

const btn = {
  padding: '7px 11px',
  borderRadius: '10px',
  fontSize: '11px',
  fontWeight: 800,
  cursor: 'pointer',
  border: '1px solid rgba(16,185,129,0.4)',
  background: 'rgba(16,185,129,0.16)',
  color: '#6ee7b7',
  whiteSpace: 'nowrap',
  fontFamily: "Plus Jakarta Sans, sans-serif"
};

function ToolCard({ title, liveLabel, children, body }) {
  return (
    <div
      style={{
        padding: '13px 14px',
        borderRadius: '13px',
        background: 'rgba(5,9,8,0.78)',
        border: '1px solid rgba(16,185,129,0.22)',
        display: 'grid',
        gap: '9px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px', alignItems: 'center' }}>
        <strong className="font-display" style={{ fontSize: '12.5px', color: '#ecfdf5' }}>
          {title}
        </strong>
        <span className="status-badge status-badge--success">{liveLabel}</span>
      </div>
      <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', lineHeight: 1.45 }}>{body}</p>
      {children}
    </div>
  );
}

/**
 * Live practice ops: Jitsi telehealth, Google/.ics calendar, WhatsApp/Viber/SMS/Email notify.
 */
export default function PracticeToolsPanel({ client, nextAppointment, showToast }) {
  const [copiedMeet, setCopiedMeet] = useState(false);
  const date = nextAppointment?.date || new Date().toISOString().slice(0, 10);
  const time = String(nextAppointment?.time || '10:00').slice(0, 5);
  const clientId = client?.id || 'practice';
  const clientName = client?.name || 'Πελάτης';

  const meetUrl = useMemo(
    () => buildJitsiRoomUrl({ clientId, date }),
    [clientId, date]
  );

  const sessionTitle = `Συνεδρία · ${clientName} · Χάρις Φωτούδη`;
  const sessionDetails = [
    `Ραντεβού στο διαιτολογικό γραφείο της Χάρις Φωτούδη.`,
    nextAppointment?.notes ? `Σημειώσεις: ${nextAppointment.notes}` : '',
    `Τηλεσυνεδρία: ${meetUrl}`
  ]
    .filter(Boolean)
    .join('\n');

  const notify = useMemo(
    () =>
      buildNotifyPayload({
        clientName,
        date,
        time,
        sessionNotes: nextAppointment?.notes || 'Τηλεσυνεδρία / υπενθύμιση 24ω',
        phone: client?.phone,
        email: client?.email
      }),
    [clientName, date, time, nextAppointment?.notes, client?.phone, client?.email]
  );

  const openMeet = () => {
    window.open(meetUrl, '_blank', 'noopener,noreferrer');
    showToast?.('✓ Άνοιξε κρυπτογραφημένο δωμάτιο Jitsi');
  };

  const copyMeet = async () => {
    try {
      const ok = await copyTelehealthLink(meetUrl);
      if (!ok) throw new Error('copy');
      setCopiedMeet(true);
      window.setTimeout(() => setCopiedMeet(false), 2200);
      showToast?.('✓ Αντιγράφηκε link τηλεσυνεδρίας');
    } catch {
      showToast?.('⚠️ Αποτυχία αντιγραφής link');
    }
  };

  const addGoogle = () => {
    const url = buildGoogleCalendarUrl({
      title: sessionTitle,
      details: sessionDetails,
      date,
      time,
      durationMinutes: 60
    });
    if (!url) {
      showToast?.('⚠️ Μη έγκυρη ημερομηνία/ώρα');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const downloadIcs = () => {
    const ics = buildIcsContent({
      title: sessionTitle,
      details: sessionDetails,
      date,
      time,
      durationMinutes: 60,
      uid: `${clientId}-${date}-${time}`
    });
    if (!ics || !downloadIcsFile(`NutriCharis-${date}.ics`, ics)) {
      showToast?.('⚠️ Αποτυχία λήψης .ics');
      return;
    }
    showToast?.('✓ Λήφθηκε αρχείο .ics (Apple / Outlook)');
  };

  const openLink = (url, label) => {
    if (!url) {
      showToast?.(`⚠️ Λείπει τηλέφωνο/email για ${label}`);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <h4 className="font-display" style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#e2e8f0' }}>
          Εργαλεία Πρακτικής
        </h4>
        <span className="status-badge status-badge--success">Live</span>
      </div>
      <p style={{ margin: '0 0 10px 0', fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.5 }}>
        Τηλεσυνεδρία Jitsi, συγχρονισμός ημερολογίου και κέντρο ειδοποιήσεων 24ω — με ενεργό φάκελο
        {client ? ` (${clientName})` : ''}.
        {!nextAppointment ? ' Χωρίς επερχόμενο ραντεβού: χρησιμοποιείται σημερινή ημερομηνία / 10:00.' : ` Επόμενο: ${date} · ${time}.`}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
        <ToolCard
          title="Τηλεσυνεδρία (Live Video)"
          liveLabel="Jitsi"
          body="Εξωτερικό δωμάτιο meet.jit.si (8x8) — E2EE κατά τις δυνατότητες Jitsi· ήχος/εικόνα δεν περνούν από NutriCharis. Μοιράστε το link μόνο στον πελάτη."
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
            <button type="button" className="btn-emerald" style={{ ...btn, background: '#059669', color: '#fff', border: 'none' }} onClick={openMeet}>
              Άνοιγμα δωματίου
            </button>
            <button type="button" style={btn} onClick={copyMeet}>
              {copiedMeet ? '✓ Αντιγράφηκε' : 'Αντιγραφή Link'}
            </button>
          </div>
          <div className="font-mono-num" style={{ fontSize: '9.5px', color: '#64748b', wordBreak: 'break-all' }}>
            {meetUrl}
          </div>
          <p style={{ margin: 0, fontSize: '10px', color: '#78716c', lineHeight: 1.4 }}>
            Απόρρητο: δημόσιος πάροχος τρίτου· χωρίς σύμβαση επεξεργασίας NutriCharis↔Jitsi. Όχι για δημοσίευση του URL.
          </p>
        </ToolCard>

        <ToolCard
          title="Συγχρονισμός Ημερολογίου"
          liveLabel="GCal · ICS"
          body="1-κλικ Google Calendar ή λήψη .ics για Apple Calendar / Outlook."
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
            <button type="button" style={btn} onClick={addGoogle}>
              Προσθήκη στο Google Calendar
            </button>
            <button type="button" style={btn} onClick={downloadIcs}>
              Λήψη .ics
            </button>
          </div>
        </ToolCard>

        <ToolCard
          title="Κέντρο Ειδοποιήσεων 24ω"
          liveLabel="WA · SMS · Mail"
          body="Προ-συμπληρωμένη υπενθύμιση μέσω WhatsApp, Viber, SMS ή Email — χωρίς backend SMS stub."
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
            <button type="button" style={btn} onClick={() => openLink(notify.links.whatsapp, 'WhatsApp')}>
              WhatsApp
            </button>
            <button type="button" style={btn} onClick={() => openLink(notify.links.viber, 'Viber')}>
              Viber
            </button>
            <button type="button" style={btn} onClick={() => openLink(notify.links.sms, 'SMS')}>
              SMS
            </button>
            <button type="button" style={btn} onClick={() => openLink(notify.links.email, 'Email')}>
              Email
            </button>
          </div>
        </ToolCard>
      </div>
    </div>
  );
}

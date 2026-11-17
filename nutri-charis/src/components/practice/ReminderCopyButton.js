import React, { useState } from 'react';
import { buildAppointmentReminderMessage, copyTextToClipboard } from '../../lib/appointmentReminder';

/**
 * 1-click copy of personalized Greek appointment reminder (Viber/WhatsApp/SMS).
 */
export default function ReminderCopyButton({ clientName, date, time, sessionNotes, disabled = false }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleCopy = async () => {
    setError('');
    const msg = buildAppointmentReminderMessage({
      clientName,
      date,
      time,
      sessionNotes
    });
    try {
      const ok = await copyTextToClipboard(msg);
      if (!ok) throw new Error('clipboard');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setError('Αποτυχία αντιγραφής');
      window.setTimeout(() => setError(''), 2500);
    }
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleCopy}
      title="Αντιγραφή υπενθύμισης για Viber / WhatsApp / SMS"
      aria-label="Αντιγραφή υπενθύμισης ραντεβού"
      style={{
        padding: '5px 10px',
        borderRadius: '99px',
        background: copied ? 'rgba(16, 185, 129, 0.28)' : 'rgba(56, 189, 248, 0.14)',
        border: `1px solid ${copied ? 'rgba(16, 185, 129, 0.5)' : 'rgba(56, 189, 248, 0.4)'}`,
        color: copied ? '#6ee7b7' : '#7dd3fc',
        fontSize: '10.5px',
        fontWeight: 800,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        whiteSpace: 'nowrap'
      }}
    >
      {error ? error : copied ? '✓ Αντιγράφηκε' : '📋 Αντιγραφή Υπενθύμισης'}
    </button>
  );
}

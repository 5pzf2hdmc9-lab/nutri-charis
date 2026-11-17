import { APPOINTMENT_TYPES, nextAppointmentStatus } from '../constants/appointments';
import { guardClientWrite, requireSessionUser, sanitizeText } from '../lib/authAccess';
import { appointmentStatusSchema, parseAppointment } from '../lib/practiceSchemas';
import { supabase } from '../supabaseClient';

export function useAppointments(deps) {
  const { activeClientObj, appointments, apptDate, apptNotes, apptTime, apptType, isAdmin, setAppointments, showToast } = deps;
  const handleAddAppointment = async (e) => {
    e.preventDefault();
    if (!activeClientObj) return;
    try {
      const user = await guardClientWrite(activeClientObj, isAdmin);
      const typeLabel = sanitizeText(apptType || APPOINTMENT_TYPES[0], 80);
      const extraNotes = sanitizeText(apptNotes, 400);
      const parsed = parseAppointment({
        client_id: activeClientObj.id,
        client_name: sanitizeText(activeClientObj.name, 120),
        date: apptDate,
        time: apptTime,
        notes: sanitizeText(extraNotes ? `${typeLabel} — ${extraNotes}` : typeLabel, 500),
        status: 'Προγραμματισμένο'
      });
      if (!parsed.success) {
        showToast(`⚠️ ${parsed.error.issues?.[0]?.message || 'Μη έγκυρο ραντεβού.'}`);
        return;
      }
      const payload = { ...parsed.data, dietitian_id: user.id };
      const { data, error } = await supabase.from('appointments').insert([payload]).select();
      if (error) {
        showToast(`⚠️ ${error.message}`);
        return;
      }
      if (data?.[0]) {
        setAppointments((prev) => [...prev, data[0]]);
        showToast('✓ Το ραντεβού καταχωρήθηκε!');
      }
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
    }
  };

  const handleCycleAppointmentStatus = async (id) => {
    try {
      const user = await requireSessionUser();
      const row = appointments.find((a) => String(a.id) === String(id));
      if (!row || !isAdmin || (row.dietitian_id && row.dietitian_id !== user.id)) {
        showToast('⚠️ Δεν έχετε δικαίωμα αλλαγής έκβασης.');
        return;
      }
      const parsed = appointmentStatusSchema.safeParse(nextAppointmentStatus(row.status));
      if (!parsed.success) return;
      const { error } = await supabase.from('appointments').update({ status: parsed.data }).eq('id', id);
      if (error) {
        showToast(`⚠️ ${error.message}`);
        return;
      }
      setAppointments((prev) => prev.map((a) => (String(a.id) === String(id) ? { ...a, status: parsed.data } : a)));
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (!window.confirm('Διαγραφή αυτού του ραντεβού;')) return;
    try {
      const user = await requireSessionUser();
      const row = appointments.find((a) => String(a.id) === String(id));
      if (!row || !isAdmin || (row.dietitian_id && row.dietitian_id !== user.id)) {
        showToast('⚠️ Δεν έχετε δικαίωμα διαγραφής αυτού του ραντεβού.');
        return;
      }
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) {
        showToast(`⚠️ ${error.message}`);
        return;
      }
      setAppointments((prev) => prev.filter((a) => String(a.id) !== String(id)));
      showToast('🗑️ Το ραντεβού διαγράφηκε.');
    } catch (err) {
      showToast(`⚠️ ${err?.message || 'Αποτυχία διαγραφής ραντεβού.'}`);
    }
  };
  return { handleAddAppointment, handleCycleAppointmentStatus, handleDeleteAppointment };
}

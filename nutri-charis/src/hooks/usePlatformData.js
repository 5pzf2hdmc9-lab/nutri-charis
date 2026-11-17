import { useEffect, useMemo } from 'react';
import { normalizeAppointmentStatus } from '../constants/appointments';
import { isAppointmentPast } from '../lib/practicePulse';
import { supabase } from '../supabaseClient';

/** Strip PostgREST `.or()` separators so an email cannot widen the filter. */
function safeOrToken(value) {
  return String(value || '')
    .replace(/[^a-zA-Z0-9@._+-]/g, '')
    .slice(0, 180);
}

export function usePlatformData(deps) {
  const { activeClientId, appointments, apptFilter, clientSearch, clients, isAdmin, measurements, session, setActiveClientId, setAppointments, setClients, setDataError, setDataLoading, setMeasurements, setProfileSubTab } = deps;
  const loadAllData = async () => {
    setDataLoading(true);
    setDataError('');
    try {
      // Identity from Auth session only — never trust body/URL userId.
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData?.user?.id) {
        setDataError('Η συνεδρία έληξε. Παρακαλώ συνδεθείτε ξανά.');
        setClients([]);
        return;
      }
      const uid = safeOrToken(userData.user.id);
      const userEmail = safeOrToken(
        String(userData.user.email || '')
          .trim()
          .toLowerCase()
      );

      // RLS enforces row ownership; client filter is defense-in-depth (IDOR).
      let query = supabase.from('clients').select('*').order('created_at', { ascending: false });
      if (!isAdmin) {
        query = query.or(`user_id.eq.${uid},email.eq.${userEmail}`);
      } else {
        query = query.or(`dietitian_id.eq.${uid},dietitian_id.is.null`);
      }

      const { data: clientRows, error: clientsErr } = await query;
      if (clientsErr) {
        setDataError(clientsErr.message || 'Αποτυχία φόρτωσης φακέλων.');
      } else if (clientRows) {
        const visible = isAdmin
          ? clientRows.filter((c) => !c.dietitian_id || c.dietitian_id === uid)
          : clientRows.filter(
              (c) =>
                c.user_id === uid ||
                String(c.email || '')
                  .trim()
                  .toLowerCase() === userEmail
            );
        setClients(visible);
        if (visible.length > 0 && !visible.some((c) => String(c.id) === String(activeClientId))) {
          setActiveClientId(visible[0].id);
        } else if (visible.length === 0) {
          setActiveClientId(null);
        }
      }

      const { data: apptRows } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true });
      if (apptRows) setAppointments(apptRows);

      const { data: measRows } = await supabase
        .from('measurements')
        .select('*')
        .order('date', { ascending: true });
      if (measRows) setMeasurements(measRows);
    } catch (err) {
      setDataError(err?.message || 'Σφάλμα φόρτωσης δεδομένων.');
    } finally {
      setDataLoading(false);
    }
  };

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.goal || '').toLowerCase().includes(q)
    );
  }, [clients, clientSearch]);

  /** Defense-in-depth: only show appointments tied to visible client folders. */
  const visibleAppointments = useMemo(() => {
    const idSet = new Set(clients.map((c) => String(c.id)));
    const nameSet = new Set(
      clients.map((c) => String(c.name || '').trim().toLowerCase()).filter(Boolean)
    );
    return appointments.filter((a) => {
      const cid = String(a.client_id || a.client || '');
      if (cid && idSet.has(cid)) return true;
      const cname = String(a.client_name || a.client || '')
        .trim()
        .toLowerCase();
      return Boolean(cname && nameSet.has(cname));
    });
  }, [appointments, clients]);

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    const sorted = [...visibleAppointments].sort(
      (a, b) =>
        String(a.date || '').localeCompare(String(b.date || '')) ||
        String(a.time || '').localeCompare(String(b.time || ''))
    );
    if (apptFilter === 'all') return sorted;
    if (apptFilter === 'outcome') {
      return sorted.filter(
        (a) => isAppointmentPast(a, now) && normalizeAppointmentStatus(a.status) === 'Προγραμματισμένο'
      );
    }
    return sorted.filter((a) => (apptFilter === 'past' ? isAppointmentPast(a, now) : !isAppointmentPast(a, now)));
  }, [visibleAppointments, apptFilter]);

  useEffect(() => {
    if (!session?.user) return;
    loadAllData();
  }, [session, isAdmin]);

  useEffect(() => {
    setProfileSubTab('overview');
  }, [activeClientId]);
  return { loadAllData, filteredClients, visibleAppointments, filteredAppointments };
}

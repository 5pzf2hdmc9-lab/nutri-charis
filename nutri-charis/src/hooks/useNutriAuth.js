import { useEffect, useMemo, useState } from 'react';
import { ADMIN_EMAIL_ENV, STRICT_ADMIN_EMAILS } from '../constants/admin';
import { createAuthHandlers } from './authSubmit';
import { createPasswordHandlers } from './passwordRecovery';
import { isPasswordRecoveryFromUrl } from '../lib/authUrl';
import { supabase } from '../supabaseClient';

function emailIsWhitelisted(emailRaw) {
  const email = String(emailRaw || '')
    .trim()
    .toLowerCase();
  if (!email) return false;
  const normalizedWhitelist = STRICT_ADMIN_EMAILS.map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (ADMIN_EMAIL_ENV) normalizedWhitelist.push(ADMIN_EMAIL_ENV);
  return normalizedWhitelist.includes(email);
}

export function useNutriAuth(deps) {
  const { handleAuthSubmit } = createAuthHandlers(deps);
  const { handlePasswordUpdateSubmit } = createPasswordHandlers(deps);
  const { activeTab, clients, session, setActiveClientId, setActiveTab, setAppointments, setAuthError, setAuthLoading, setAuthMode, setAuthSuccess, setClients, setConfirmPasswordInput, setDataError, setMeasurements, setNewPasswordInput, setSession, showToast } = deps;
  const [dietitianRow, setDietitianRow] = useState(false);

  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) {
      setDietitianRow(false);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('dietitians')
          .select('user_id')
          .eq('user_id', uid)
          .maybeSingle();
        if (!cancelled) setDietitianRow(Boolean(!error && data?.user_id));
      } catch {
        if (!cancelled) setDietitianRow(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    const syncRecoveryFromUrl = () => {
      if (isPasswordRecoveryFromUrl()) setAuthMode('recovery');
    };
    // URL hash/query backup: some clients emit SIGNED_IN instead of PASSWORD_RECOVERY.
    syncRecoveryFromUrl();
    window.addEventListener('hashchange', syncRecoveryFromUrl);
    window.addEventListener('popstate', syncRecoveryFromUrl);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data?.session || null);
        syncRecoveryFromUrl();
        setAuthLoading(false);
      })
      .catch(() => {
        setSession(null);
        setAuthLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && isPasswordRecoveryFromUrl())) {
        setAuthMode('recovery');
      }
      if (event === 'SIGNED_OUT') {
        setAuthMode('login');
        setClients([]);
        setAppointments([]);
        setMeasurements([]);
        setActiveClientId(null);
        setDataError('');
      }
    });
    return () => {
      window.removeEventListener('hashchange', syncRecoveryFromUrl);
      window.removeEventListener('popstate', syncRecoveryFromUrl);
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const isAdmin = useMemo(() => {
    // Dietitian row (RLS) OR email whitelist — email alone was flaky when session.user.email lagged.
    if (dietitianRow) return true;
    return emailIsWhitelisted(session?.user?.email);
  }, [session?.user?.email, dietitianRow]);

  // Non-admin shells hide the clients tab — never leave them on a blank tab.
  useEffect(() => {
    if (!isAdmin && activeTab === 'clients') setActiveTab('plan');
  }, [isAdmin, activeTab, setActiveTab]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      /* session cleared locally below even if network fails */
    }
    setSession(null);
    setAuthMode('login');
    setClients([]);
    setAppointments([]);
    setMeasurements([]);
    setActiveClientId(null);
    setDataError('');
    setAuthError('');
    setAuthSuccess('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    showToast('Αποσυνδεθήκατε με ασφάλεια.');
  };
  return { isAdmin, handleLogout, handleAuthSubmit, handlePasswordUpdateSubmit };
}

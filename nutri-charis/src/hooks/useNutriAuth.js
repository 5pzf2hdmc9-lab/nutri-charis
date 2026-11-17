import { useEffect, useMemo } from 'react';
import { ADMIN_EMAIL_ENV, STRICT_ADMIN_EMAILS } from '../constants/admin';
import { createAuthHandlers } from './authSubmit';
import { createPasswordHandlers } from './passwordRecovery';
import { isPasswordRecoveryFromUrl } from '../lib/authUrl';
import { supabase } from '../supabaseClient';

export function useNutriAuth(deps) {
  const { handleAuthSubmit } = createAuthHandlers(deps);
  const { handlePasswordUpdateSubmit } = createPasswordHandlers(deps);
  const { activeTab, clients, session, setActiveClientId, setActiveTab, setAppointments, setAuthError, setAuthLoading, setAuthMode, setAuthSuccess, setClients, setConfirmPasswordInput, setDataError, setMeasurements, setNewPasswordInput, setSession, showToast } = deps;
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
    const email = (session?.user?.email || '').trim().toLowerCase();
    if (!email) return false;
    const normalizedWhitelist = STRICT_ADMIN_EMAILS.map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (ADMIN_EMAIL_ENV) normalizedWhitelist.push(ADMIN_EMAIL_ENV);
    return normalizedWhitelist.includes(email);
  }, [session]);

  // Non-admin shells hide the clients tab — never leave them on a blank tab.
  useEffect(() => {
    if (!isAdmin && activeTab === 'clients') setActiveTab('plan');
  }, [isAdmin, activeTab]);

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

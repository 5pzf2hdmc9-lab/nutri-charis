import { clearAuthRedirectParamsFromUrl } from '../lib/authUrl';
import { supabase } from '../supabaseClient';

export function createPasswordHandlers(deps) {
  const { confirmPasswordInput, newPasswordInput, passwordUpdating, session, setAuthError, setAuthMode, setConfirmPasswordInput, setNewPasswordInput, setPasswordUpdating, showToast } = deps;
  const mapAuthUpdateError = (raw) => {
    const msg = String(raw || '').toLowerCase();
    if (msg.includes('session') || msg.includes('not authenticated') || msg.includes('jwt')) {
      return 'Ο σύνδεσμος επαναφοράς έληξε ή δεν είναι έγκυρος. Ζητήστε νέο link από «Ξέχασα τον κωδικό μου».';
    }
    if (msg.includes('same password') || msg.includes('should be different')) {
      return 'Ο νέος κωδικός πρέπει να διαφέρει από τον προηγούμενο.';
    }
    return raw || 'Αποτυχία ενημέρωσης κωδικού.';
  };

  const handlePasswordUpdateSubmit = async (e) => {
    e.preventDefault();
    if (passwordUpdating) return;
    setAuthError('');
    const pw = String(newPasswordInput || '');
    const confirm = String(confirmPasswordInput || '');
    if (pw.length < 6) {
      setAuthError('Ο νέος κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.');
      return;
    }
    if (pw !== confirm) {
      setAuthError('Οι κωδικοί δεν ταιριάζουν. Ελέγξτε την επιβεβαίωση.');
      return;
    }
    setPasswordUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) {
        setAuthError(mapAuthUpdateError(error.message));
        return;
      }
      clearAuthRedirectParamsFromUrl();
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setAuthMode('login');
      // Session από recovery παραμένει ενεργή → άμεση είσοδος στο dashboard.
      showToast('✓ Ο νέος κωδικός αποθηκεύτηκε! Καλωσήρθατε.');
    } catch (err) {
      setAuthError(mapAuthUpdateError(err?.message));
    } finally {
      setPasswordUpdating(false);
    }
  };
  return { handlePasswordUpdateSubmit };
}

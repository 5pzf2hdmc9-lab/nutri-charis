
/** Detect Supabase password-recovery redirect via hash or query (`type=recovery`). */
export function isPasswordRecoveryFromUrl() {
  if (typeof window === 'undefined') return false;
  const hash = String(window.location.hash || '');
  const search = String(window.location.search || '');
  try {
    const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
    const queryParams = new URLSearchParams(search);
    if (hashParams.get('type') === 'recovery' || queryParams.get('type') === 'recovery') return true;
  } catch {
    /* ignore malformed URL params */
  }
  return /(?:[?&#]|^)type=recovery(?:&|$)/i.test(`${search}${hash}`);
}

export function clearAuthRedirectParamsFromUrl() {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;
  try {
    window.history.replaceState(null, '', window.location.pathname);
  } catch {
    /* ignore */
  }
}

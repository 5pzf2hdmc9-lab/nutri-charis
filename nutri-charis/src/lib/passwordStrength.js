
/** Simple password strength meter for recovery / register UX. */
export function getPasswordStrength(pw) {
  const p = String(pw || '');
  if (!p) return { score: 0, label: '', color: '#64748b', pct: 0 };
  let score = 0;
  if (p.length >= 6) score += 1;
  if (p.length >= 10) score += 1;
  if (/[A-ZΑ-Ω]/.test(p) && /[a-zα-ω]/.test(p)) score += 1;
  if (/\d/.test(p)) score += 1;
  if (/[^A-Za-zΑ-Ωα-ω0-9]/.test(p)) score += 1;
  const labels = ['Πολύ αδύναμος', 'Αδύναμος', 'Μέτριος', 'Καλός', 'Ισχυρός'];
  const colors = ['#f87171', '#fb923c', '#fbbf24', '#34d399', '#10b981'];
  const idx = Math.min(4, Math.max(0, score - 1));
  return { score, label: labels[idx], color: colors[idx], pct: Math.min(100, score * 20) };
}

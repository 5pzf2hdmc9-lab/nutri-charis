export function buildNavTabs(isAdmin, clientCount) {
  return [
    ...(isAdmin ? [{ id: 'clients', icon: '👥', short: 'Πελάτες', label: `👥 Πελάτες (${clientCount})` }] : []),
    { id: 'plan', icon: '📅', short: 'Πλάνο', label: '📅 Σχεδιασμός Πλάνου' },
    { id: 'profile', icon: '📂', short: 'Φάκελος', label: '📂 Φάκελος Πελάτη' },
    { id: 'appointments', icon: '🗓️', short: 'Ραντεβού', label: '🗓️ Ραντεβού' },
    { id: 'measurements', icon: '📏', short: 'Πρόοδος', label: '📏 Μετρήσεις' },
    { id: 'calculator', icon: '⚡', short: 'BMR', label: '⚡ BMR / TDEE' }
  ];
}

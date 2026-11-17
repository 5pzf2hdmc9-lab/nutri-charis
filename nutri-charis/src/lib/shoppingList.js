/**
 * Aggregate weekly meal-plan ingredients into supermarket categories.
 * Categories: Πρωτεΐνες, Λαχανικά/Φρούτα, Γαλακτοκομικά, Δημητριακά (+ λοιπά λιπαρά).
 */
export function buildWeeklyShoppingList(mealPlan = {}, days = [], mealTypes = []) {
  const categories = {
    Πρωτεΐνες: new Set(),
    'Λαχανικά/Φρούτα': new Set(),
    Γαλακτοκομικά: new Set(),
    Δημητριακά: new Set(),
    'Υγιεινά Λιπαρά': new Set()
  };

  days.forEach((day) => {
    mealTypes.forEach((m) => {
      const key = typeof m === 'string' ? m : m.key;
      const txt = String(mealPlan?.[day]?.[key] || '')
        .replace(/^\s+|\s+$/g, '')
        .replace(/^[-•*]+\s*/, '');
      if (!txt) return;
      txt.split(/[,&+\n]+/).forEach((part) => {
        const cleanItem = part
          .replace(/^\d+(?:[.,]\d+)?\s*(?:γρ|gr|g|ml|τεμ|φέτ\w*|μέτρι\w*|μεγάλ\w*)\s*/i, '')
          .trim();
        if (!cleanItem || cleanItem.length < 3) return;
        const cap = cleanItem.charAt(0).toUpperCase() + cleanItem.slice(1);
        if (/κοτόπουλ|γαλοπούλ|μοσχάρ|σολομ|τόν|τσιπούρ|λαβράκ|ψάρι|αυγ|σαρδέλ|σκουμπρ|μπακαλιάρ|μπιφτέκ/i.test(cap)) {
          categories['Πρωτεΐνες'].add(cap);
        } else if (/γιαούρτ|cottage|τυρί|φέτα|γάλα|ανθότυρ|κεφίρ|κασέρι/i.test(cap)) {
          categories['Γαλακτοκομικά'].add(cap);
        } else if (/βρώμ|ψωμ|φρυγαν|ρύζ|μακαρόν|ζυμαρ|κινόα|φακ|ρεβίθ|φασόλ|πατάτ|γλυκοπατάτ|πλιγούρ|παξιμάδ|τορτίγ/i.test(cap)) {
          categories['Δημητριακά'].add(cap);
        } else if (/αμύγδαλ|καρύδ|chia|λιναρόσπορ|αβοκάντ|ελαιόλαδ|ταχίν|φιστίκ/i.test(cap)) {
          categories['Υγιεινά Λιπαρά'].add(cap);
        } else {
          categories['Λαχανικά/Φρούτα'].add(cap);
        }
      });
    });
  });

  return Object.entries(categories)
    .map(([category, set]) => ({ category, items: Array.from(set) }))
    .filter((g) => g.items.length > 0);
}

export function formatShoppingListText(shoppingList, clientName) {
  return (
    `Λίστα Αγορών Εβδομάδας (${clientName || ''}) — Χάρις Φωτούδη\n\n` +
    shoppingList.map((g) => `${g.category}:\n- ${g.items.join('\n- ')}`).join('\n\n')
  );
}

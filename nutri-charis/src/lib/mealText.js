
export function cleanMealText(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/\((?![^)]*\b\d+\s*(?:γρ|gr|g|ml|τεμ|φέτ|κ\.σ|κ\.γ)\b)[^)]{12,}\)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/^[•\-–]\s*/gm, '')
    .trim();
}

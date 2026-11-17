# NutriCharis Design System

## Visual language
- Dark clinical OS: deep greens (`#022c22`, `#050807`) with emerald accents (`#10b981`, `#34d399`).
- Typography: display headings via `.font-display`, numeric telemetry via `.font-mono-num`.
- Surfaces: `.luxury-card` / `.luxury-input` glass panels — not generic white dashboard cards in the main app shell.
- Motion: short `fadeInSlide` for modals/toasts; keep motion purposeful (2–3 cues).

## Brand rules
- Brand signal: «Χάρις Φωτούδη / NutriCharis» remains primary in header and auth hero.
- Auth split layout: brand panel + form; medical disclaimer always visible in footer.
- Avoid purple gradients, cream/terracotta broadsheet looks, and emoji-heavy chrome where a clinical icon already exists.

## Legal / compliance UI
- Consent checkboxes (GDPR + Art.9 + Terms) use compact 11px copy with emerald accent checkboxes.
- Legal modals: max-width ~640px, scrollable, Greek copy.
- Permanent medical disclaimer footer on auth + authenticated shell.

## Responsive
- Mobile-first sticky header + bottom nav; forms use `minmax` grids; no horizontal overflow (`maxWidth: 100vw`).

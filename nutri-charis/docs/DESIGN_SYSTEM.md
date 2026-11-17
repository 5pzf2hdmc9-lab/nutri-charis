# NutriCharis Design System

## Visual language
- Dark clinical OS: deep greens (`#022c22`, `#050807`) with emerald accents (`#10b981`, `#34d399`).
- Typography: display headings via `.font-display`, numeric telemetry via `.font-mono-num`.
- Surfaces: `.luxury-card` / `.luxury-input` / `.glass-elevated` glass panels — not generic white dashboard cards in the main app shell.
- Overlays: `.glass-modal-backdrop` (blur + emerald radial wash) for recovery, legal, PDF, templates, edit modals.
- Actions: `.btn-emerald` primary CTA, `.btn-ghost-danger` for logout/destructive chrome.
- Status: `.status-badge` + `--success|--danger|--warn|--info` for appointment/auth chips.
- Motion: short `fadeInSlide` for modals/toasts; hover lift on `.btn-emerald` and card border glow; keep motion purposeful (2–3 cues).

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

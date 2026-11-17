# NutriCharis Design System

## Visual language
- Dark clinical OS: deep greens (`#022c22`, `#050807`) with emerald accents (`#10b981`, `#34d399`).
- Typography: **Plus Jakarta Sans** for UI + `.font-display` headings (Inter removed); numeric telemetry via `.font-mono-num` (JetBrains Mono).
- Surfaces: `.luxury-card` / `.luxury-input` / `.glass-elevated` — deeper blur + emerald inset wash; not generic white dashboard cards.
- Overlays: `.glass-modal-backdrop` (blur + emerald radial wash) for recovery, legal, PDF, templates, edit modals.
- Actions: `.btn-emerald` primary CTA, `.btn-ghost-danger` for logout/destructive chrome; `:focus-visible` emerald ring on controls.
- Status: `.status-badge` + `--success|--danger|--warn|--info` for appointment/auth chips.
- Skeletons: `.skeleton` / `.skeleton-block` shimmer for data load (`DataSkeleton`).
- Empty states: `.empty-state` with glyph + title + hint (+ optional CTA) — appointments, measurements, clients, search.
- Motion (purposeful 2–3): `authBrandReveal`, `authFormRise`, `fadeInSlide`; boot pulse + spinner; meal-cell hover lift. Respects `prefers-reduced-motion`.

## Brand rules
- Brand signal: «Χάρις Φωτούδη» is hero-level on auth (display size); **NutriCharis** as emerald product line under it.
- Auth split: one composition — brand panel (logo + name + one headline + one sentence + meta line) + form. No pill badges or feature cards in the hero.
- Mobile (`≤880px`): brand panel hidden; `.auth-mobile-brand` strip inside the form card keeps the brand signal.
- Avoid purple gradients, cream/terracotta broadsheet looks, and emoji-heavy chrome where a clinical glyph already exists.

## Legal / compliance UI
- Consent checkboxes (GDPR + Art.9 + Terms) use compact 11px copy with emerald accent checkboxes.
- Legal modals: max-width ~640px, scrollable, Greek copy.
- Permanent medical disclaimer footer on auth + authenticated shell (`.MedicalFooter` glass panel with amber «Ιατρική Αποποίηση»).

## Practice folder (SOAP / billing)
- Client folder uses `.filter-chip` sub-tabs (Επισκόπηση / SOAP / Πακέτα) — one panel job each.
- SOAP timeline: emerald left rail; adherence via `.status-badge--info` + `.font-mono-num`.
- Billing progress: muted track + emerald gradient fill; month revenue telemetry in mono.
- Reminder copy pill: sky idle → emerald «Αντιγράφηκε»; sits beside WhatsApp deep-link.

## Responsive
- Mobile-first sticky header + bottom nav; forms use `minmax` grids; no horizontal overflow (`maxWidth: 100vw`).
- Auth form column: `.auth-form-column` full-width centered on mobile.

## Tokens (CSS variables)
`--bg-obsidian`, `--bg-surface`, `--border-subtle`, `--border-glow`, `--emerald-primary`, `--emerald-bright`, `--gold-accent`, `--text-primary`, `--text-secondary`, `--text-muted`, `--focus-ring`, `--ease-out`, `--radius-card`, `--radius-control`.

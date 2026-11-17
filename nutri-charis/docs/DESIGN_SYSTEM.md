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

## Anthropometrics + templates (Sprint 3)
- Anthro entry: `.clinical-inset` under core weight form (above submit); `.section-kicker` for περιφέρειες / δερματοπτυχές.
- History: Greek chips with units (`Λαιμός · 32 cm`); circ = `--info`, folds = `--success`; overflow `+N` stub chip.
- Equations panel: mono % labeled «Εξίσωση» (never DEXA); empty via compact `.empty-state`.
- Template library modal: Escape + backdrop; `.template-row` + 1-click apply; `.exchange-tile` Greek ισοδύναμα insert into selected meal.

## Plan + measurements (Sprint 2)
- Weekly macros: `.luxury-card` table; % of target as `.status-badge` (info/warn/success for under/over/ok).
- Shopping list modal: glass backdrop + elevated card; Escape/backdrop dismiss; `.empty-state` when no meals.
- Clinical diet print: white A4 Georgia document (print-only exception to dark OS).
- Body composition SVG: `.luxury-card` charts; compact `.empty-state` when under 2 points; waist series mint `#86efac` (no purple).
- Biomarker panel: `.field-label` + `.luxury-input` form; latest values on `.luxury-card` with `.status-badge` bands.

## Anthropometrics + week templates (Sprint 3)
- Circumference / skinfold entry sits in `.clinical-inset` under the measurement form. Kicker `.section-kicker`; each field `.field-label` + `.luxury-input.font-mono-num`. Fill count is a `.status-badge` (`n/13`).
- History chips use Greek names and units. cm chips are `--info`; mm chips are `--success`. Extra values collapse to a `.stub-chip` (`+N`).
- Week-template modal matches shopping list: dialog, Escape, backdrop dismiss, `.modal-close`, labeled save field, `.template-row`, `.exchange-tile`.
- Auth labels use `.field-label`. Register metrics use `.auth-metric-grid` (2 columns at ≤520px). Client switcher uses `.shell-select:focus-visible`.

## Responsive
- Mobile-first sticky header + bottom nav; forms use `minmax` grids; no horizontal overflow (`maxWidth: 100vw`).
- Auth form column: `.auth-form-column` full-width centered on mobile.

## Tokens (CSS variables)
`--bg-obsidian`, `--bg-surface`, `--border-subtle`, `--border-glow`, `--emerald-primary`, `--emerald-bright`, `--gold-accent`, `--text-primary`, `--text-secondary`, `--text-muted`, `--focus-ring`, `--ease-out`, `--radius-card`, `--radius-control`.

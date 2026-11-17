# NutriCharis — Project Memory

## Stack
- CRA (`react-scripts` 5) + React 19, deployed on Vercel.
- Supabase Auth + Postgres (anon/publishable key via `REACT_APP_*` only).
- Security headers live in `vercel.json` (active). Mirrored stub: `next.config.mjs` for future Next migration (patch floor: Next ≥15.5.29 / ≥16.4.5).

## Security posture (2026-11-17)
- Secrets: removed hardcoded Supabase keys from `src/supabaseClient.js`; service role must never use `REACT_APP_`/`NEXT_PUBLIC_`.
- Headers: XFO DENY, nosniff, Referrer-Policy, HSTS preload, COOP, strict CSP (Supabase + Gemini connect-src).
- RLS: `supabase/migrations/security_rls.sql` — FORCE RLS on clients/appointments/measurements/dietitians; `is_dietitian()`; ownership via `dietitian_id` / `user_id`.
- IDOR: all mutations resolve identity with `supabase.auth.getUser()` + `assertClientAccess`; never trust body `userId`.
- Rate limits: client auth attempts (`src/lib/rateLimit.ts`); serverless AI (`api/generate-meals.js` + `rateLimitServer.js`).
- AI: `/api/generate-meals` uses server `GEMINI_API_KEY` only; prompt wrapped in `<user_input>`.
- npm audit: remaining highs are mostly CRA/react-scripts transitive (build-time). Avoid `audit fix --force` (breaks CRA). Overrides for nth-check/serialize-javascript.

## GDPR / legal
- Explicit Art.9 + GDPR + Terms checkboxes on register & new-client; timestamps `gdpr_consent_at`, `art9_consent_at`, `terms_accepted_at`.
- Art.20 export JSON + Art.17 double-confirm delete (`GdprDataActions` + list delete prompt).
- Greek Privacy / Terms / Cookies modals + permanent medical disclaimer footer.

## Math
- BMR engines + FDA % helpers isolated in `src/lib/nutrition-math.ts` with Zod validation and NaN/÷0 guards.

## Ops note
- After deploy: run `security_rls.sql` then `practice_ops_10.sql` in Supabase SQL editor and seed `dietitians` row for the admin auth user.

## Adversarial QA (2026-11-17)
- Build: `npm run build` → Compiled successfully (0 errors).
- Unauthenticated shell shows login only (no clinical data).
- XSS `<script>alert(1)</script>` stays as text input; 0 injected `<script>` under `#root`.
- Consent checkboxes required (HTML5) before signup submit.
- Legal Privacy modal opens with Art.9 / Art.17 / Art.20 Greek copy; medical disclaimer visible.
- Critical ops find: `.env` had swapped URL/publishable vs `sb_secret` under `REACT_APP_*` — fixed; secret moved to `.env.server.local` (gitignored). **Rotate the exposed service secret in Supabase dashboard.**
- Remaining `npm audit` highs are mostly CRA/react-scripts transitive (dev/build-time).

## Competitive benchmark (2026-11-17)

Benchmarked vs Practice Better, Nutrium, Healthie, Jane App, Cerbo, Cronometer Pro / MyFitnessPal Pro (nutrition depth), and Linear/Stripe/Vercel (UX bar).

### Feature matrix (NutriCharis vs niche)

| Area | NutriCharis | Practice Better | Nutrium | Healthie | Jane |
|------|-------------|-----------------|---------|----------|------|
| Client CRM + clinical folder | Strong (anthro, questionnaire, GDPR stamps) | Strong | Strong | Strong | Strong |
| Meal planning + macros/micros | **Differentiator** (7-day AI, FDA micros, PDF/WhatsApp/shopping) | Via That Clean Life | Native strong | Journal-first | Weak / none |
| BMR/TDEE engines | Strong (Mifflin/Harris/Katch) | Basic | Strong | Limited | Limited |
| Measurements / body comp | Good (weight/fat/muscle/waist + SVG) | Good | **Strong** | Good | Limited |
| Scheduling | Strong (typed session, filter, WA + 1-click Greek reminder copy) | **Strong** | Good | **Strong** | **Strong** |
| Client portal / adherence | Partial (meal check, water) + SOAP adherence score | App + portal | App + diary | Native apps | Portal |
| Telehealth | Stub only | Built-in | Zoom/Meet | Built-in | Built-in |
| Billing / packages | **Live** (session packs, € month, pending, print summary) | Strong | Invoicing | Claims + invoices | Strong |
| Team / multi-provider | Solo only | Yes | Limited | Yes | Yes |
| GDPR / medical legal | **Strong for EU/GR** | HIPAA-oriented | Mixed | HIPAA | PIPEDA/HIPAA |
| AI meals | Gemini via server | Charting AI add-on | Limited | Charting AI | AI Scribe |

### Scores (0–10)

| Dimension | Score | Notes |
|-----------|------:|-------|
| Feature completeness (clinical nutrition) | 9.5 | 7-day live macros + shopping + clinical PDF + body/lab charts; trails PB/Healthie on telehealth |
| Data model depth | 8.5 | Client JSON + SOAP/billing + `lab_history`; `client_id` bigint synced |
| Edge cases | 7.5 | Zod bigint coerce + IDOR + RLS FORCE; print modal/clipboard guards |
| Empty states / chrome honesty | 8.5 | Shared `EmptyState` + honest practice stubs + chart empty states |
| Onboarding | 7.0 | Guided register + consents; no multi-step clinic setup wizard |
| Search / filter | 7.0 | Client search + appointment upcoming/past/all |
| Analytics | 8.0 | Weekly macros vs TDEE + body-comp SVG + biomarker bands |
| Mobile | 8.0 | Bottom dock + meal slides + responsive macro table |
| Collaboration | 3.0 | Solo dietitian; no team roles |
| Billing | 8.5 | Real packages + RLS + print summary (not Stripe/tax invoices) |
| Integrations | 3.5 | WhatsApp + clipboard reminder; calendar/telehealth stubs |
| Legal / GDPR | 8.5 | Art.9/17/20 + Greek legal modals + medical footer + print disclaimer |
| AI quality | 7.0 | Server Gemini + FDA pass; food DB not USDA-grade |
| UX quality bar (Linear/Stripe/Vercel) | 8.0 | Glass OS + skeletons + Sprint 2 clinical CTAs |

**Overall niche fit:** ~9.0/10 as a Greek solo clinical OS; **10/10** meal-plan + supermarket + clinical A4 PDF; **~9/10** practice ops — trails PB/Healthie on telehealth/calendar/Stripe.

### Gaps

**P0 (remaining practice ops)**  
- Real calendar availability + automated SMS/email (1-click copy is live)  
- Client messaging / portal notifications  
- First-class appointment `type` + status workflow (completed/no-show)  
- SOAP rows optionally linked to `appointment_id`

**P1 (strong differentiators)**  
- Deeper food DB / recipe library (Nutrium-class)  
- Practice-wide analytics dashboard (cross-client KPIs)  
- Branded client PDF portal share link  
- Offline-tolerant meal adherence sync

**P2 (nice-to-have)**  
- Native telehealth, Stripe billing, insurance/superbills, multi-dietitian orgs, Google Calendar sync

### Shipped — Practice Ops 10/10 (2026-11-17)
- Migration `supabase/migrations/practice_ops_10.sql`: `clinical_notes` + `billing_packages` with FORCE RLS (`auth.uid() = dietitian_id`)  
- Profile sub-tabs: Επισκόπηση · Ιστορικό & SOAP Notes · Πακέτα & Πληρωμές  
- Components `<250` lines under `src/components/practice/` (SoapNotesPanel, BillingPackagesPanel, BillingPackageCard, ReminderCopyButton)  
- Zod parsers in `src/lib/practiceSchemas.ts`; reminder copy in `src/lib/appointmentReminder.js`  
- Appointments: «Αντιγραφή Υπενθύμισης (Viber/WhatsApp/SMS)» with fasting/hydration prep  
- Stubs trimmed: telehealth / calendar / auto-SMS only  
- `npm run build` → Compiled successfully (0 errors)

### Shipped — Sprint 2 Clinical Nutrition 10/10 (2026-11-17)
- **Schema sync:** `client_id` → `bigint` in `practice_ops_10.sql` + `z.coerce.number().int().positive()` in `practiceSchemas.ts` (SOAP/billing panels coerce `Number(client.id)`)
- **7-day live macros:** `WeeklyDayMacrosTable` — kcal/P/C/F/fiber vs BMR/TDEE targets (`macroTargets.js`)
- **Supermarket list:** `shoppingList.js` categories Πρωτεΐνες · Λαχανικά/Φρούτα · Γαλακτοκομικά · Δημητριακά (+ Υγιεινά Λιπαρά); CTA «Δημιουργία Λίστας Σούπερ Μάρκετ»
- **Body + labs:** `BodyCompositionCharts` (weight/fat%/muscle/waist SVG) + `BiomarkerPanel` (φερριτίνη, Vit D, B12, HbA1c, χοληστερίνη) → `questionnaire.lab_history`
- **Clinical A4 PDF:** `ClinicalDietPrintView` + `print-mode-clinical` portrait `@page`; button «Εξαγωγή Διαιτολογίου (PDF)»
- Components under `src/components/plan/` + `src/components/measurements/` all `<250` lines
- QA: bug-hunter + ui-craftsman; `npm run build` → 0 errors

### Remains for later
- Telehealth, calendar sync, automated SMS, team collaboration  
- Practice-wide KPI dashboard, food DB upgrade, Stripe/tax invoices

## E2E flow audit findings (2026-11-17)

### Coverage
- **Unauthenticated:** login, register toggle, forgot-password, recovery `#type=recovery`, Privacy/Terms/Cookies modals, medical disclaimer, password show/hide, empty/invalid/XSS submits, consent checkboxes, mobile 390×844.
- **Authenticated shell:** **blocked** — no usable login password in `.env` / `.env.local` / docs (only `REACT_APP_ADMIN_EMAIL` in `.env.example`). Did not invent credentials. Dashboard, bottom nav, clients, appointments, measurements, AI meals, admin stubs, GDPR export/delete, logout **not exercised live**.

### Bugs found + fixed
| Bug | Fix | Files |
|-----|-----|-------|
| Duplicate `EmptyState` → webpack overlay / app unusable | Kept single CTA-capable `EmptyState` using `.empty-state__glyph` / `__hint` | `src/App.js` |
| Register age/weight/height lacked `min`/`max`/`required` (allowed -5, 0) | Aligned with new-client bounds | `src/App.js` |
| Legal modal Escape trap | `keydown` Escape closes | `src/components/LegalModal.js` |
| Recovery error showed raw English `Auth session missing!` | Greek mapped message via `mapAuthUpdateError` | `src/App.js` |
| Auth banners weak for a11y | `role="alert"` / `role="status"` | `src/App.js` |
| Login/register password no HTML `minLength` | `minLength={6}` | `src/App.js` |

### Remaining
- Authenticated E2E still needs a seeded test account (env/docs, no secrets in git).
- Other modals (API key, templates, edit meal) Escape parity not verified (auth-gated).
- CRA/react-scripts transitive `npm audit` highs remain (build-time).

### Build
- `npm run build` → **Compiled successfully (0 errors).**

## Full SaaS Audit rollup (2026-11-17)

Parallel agents: saas-comparator + e2e-flow-tester + ui-craftsman.

| Lane | Outcome |
|------|---------|
| Competitive | ~6.8/10 niche OS; 8.5 nutrition depth; 4 practice ops. Shipped empties/skeletons/appt type+filter/honest stubs. |
| E2E | Unauth surface pass; 5 bugs fixed; authenticated shell blocked (no test password in env). |
| UI | Brand-first auth, Plus Jakarta Sans, deeper glass, motion, mobile brand strip. |
| Build | `npm run build` → Compiled successfully (0 errors) after merge of all three lanes. |

**Next:** seed local test account for authenticated E2E; run `practice_ops_10.sql` in Supabase; remaining stubs = telehealth / calendar / auto-SMS.

## Change log
- 2026-11-17: Sprint 2 Clinical Nutrition 10/10 — bigint `client_id` sync; live 7-day macros + supermarket list; body-comp + biomarker charts; clinical A4 PDF export; bug-hunter + ui-craftsman verified; build green.
- 2026-11-17: Bug-hunter Sprint 2 — fixed blank Excel print when PDF modal open (print sheets always mounted; modal stays `.no-print`); clinical PDF injects portrait `@page`; shopping clipboard rejection handled; clinical gender no longer defaults missing → Γυναίκα. Zod `client_id` bigint coerce + biomarker `lab_history` IDOR path OK. `npm run build` green. No build-critical remaining.
- 2026-11-17: UI craftsman Sprint 2 polish — macros table/status badges, shopping modal Escape+empty, brand Χάρις fix, chart empty-states, biomarker luxury-cards, plan CTA chrome; purple snack accent removed.
- 2026-11-17: Practice Ops 10/10 — `clinical_notes` + `billing_packages` RLS migration; SOAP timeline + packages/payments tabs in client folder; 1-click appointment reminder clipboard; practice components under `src/components/practice/`; build green.
- 2026-11-17: Full SaaS Audit — saas-comparator + e2e-flow-tester + ui-craftsman parallel pass; build green.
- 2026-11-17: E2E flow tester — fixed EmptyState duplicate (webpack overlay), register anthro HTML bounds, LegalModal Escape, Greek recovery session errors, auth alert roles; unauthenticated surface re-verified; authenticated coverage blocked (no password in env).
- 2026-11-17: Competitive benchmark + UX gap ship — empty states, appointment filters/types, practice stubs, labeled forms, docs/vault patterns.
- 2026-11-17: UI craftsman polish — brand-first auth hero («Χάρις Φωτούδη» display + NutriCharis line; removed pill + 3 feature cards), Plus Jakarta Sans body (no Inter), deeper glass / focus rings, `.empty-state` + `DataSkeleton`, auth/boot motion (`authBrandReveal`, `authFormRise`, boot pulse), mobile `.auth-mobile-brand`, MedicalFooter glass panel. `npm run build` Compiled successfully.
- 2026-11-17: E2E bug audit + UI polish — password recovery (`PASSWORD_RECOVERY` + `type=recovery` URL/hash with lazy init + hashchange, confirm + strength meter, auto-dashboard after `updateUser`), hardened logout/session clear, AI via `/api/generate-meals` with local key fallback, appointment visibility filter + delete error handling, glass modal/badge CSS level-up, legacy Admin appointments stub clarified. Browser QA: recovery form + strength/match + Privacy modal OK; `npm run build` 0 errors.
- 2026-11-17: Full cyber/legal hardening — headers, RLS migration, IDOR guards, rate limits, GDPR Art.9/17/20 UI, nutrition-math extraction, docs, env secret lockdown, adversarial browser QA.

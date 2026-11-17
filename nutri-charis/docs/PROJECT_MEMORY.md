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
- After deploy: run `security_rls.sql` in Supabase SQL editor and seed `dietitians` row for the admin auth user.

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
| Scheduling | Basic+ (typed session, upcoming/past filter, WA reminder) | **Strong** | Good | **Strong** | **Strong** |
| Client portal / adherence | Partial (meal check, water) | App + portal | App + diary | Native apps | Portal |
| Telehealth | Stub only | Built-in | Zoom/Meet | Built-in | Built-in |
| Billing / packages | Stub only | Strong | Invoicing | Claims + invoices | Strong |
| Team / multi-provider | Solo only | Yes | Limited | Yes | Yes |
| GDPR / medical legal | **Strong for EU/GR** | HIPAA-oriented | Mixed | HIPAA | PIPEDA/HIPAA |
| AI meals | Gemini via server | Charting AI add-on | Limited | Charting AI | AI Scribe |

### Scores (0–10)

| Dimension | Score | Notes |
|-----------|------:|-------|
| Feature completeness (clinical nutrition) | 7.5 | Beats Jane/Healthie on meal depth; trails PB/Healthie on practice ops |
| Data model depth | 7.0 | Rich client JSON questionnaire; appointments lack first-class `session_type` column |
| Edge cases | 6.5 | Zod/math guards + IDOR; empty/filter states improved this pass |
| Empty states / chrome honesty | 8.0 | Shared `EmptyState` + honest practice stubs |
| Onboarding | 7.0 | Guided register + consents; no multi-step clinic setup wizard |
| Search / filter | 7.0 | Client search + appointment upcoming/past/all |
| Analytics | 5.5 | Day telemetry + SVG charts; no practice-wide KPIs |
| Mobile | 7.5 | Bottom dock + meal slides |
| Collaboration | 3.0 | Solo dietitian; no team roles |
| Billing | 1.0 | Explicit stubs only |
| Integrations | 2.0 | WhatsApp deep-link; calendar/telehealth stubs |
| Legal / GDPR | 8.5 | Art.9/17/20 + Greek legal modals + medical footer |
| AI quality | 7.0 | Server Gemini + FDA pass; food DB not USDA-grade |
| UX quality bar (Linear/Stripe/Vercel) | 7.5 | Glass OS + skeletons; still monolith CRA |

**Overall niche fit:** ~6.8/10 as a Greek solo clinical OS; **8.5/10** if judged as meal-plan + clinical folder product; **4/10** if judged as full practice-management suite.

### Gaps

**P0 (must ship to compete on practice ops)**  
- Real calendar availability + SMS/email reminders  
- Client messaging / portal notifications  
- Session notes (SOAP/ADIME) tied to appointments  
- First-class appointment `type` + status workflow (completed/no-show)

**P1 (strong differentiators)**  
- Deeper food DB / recipe library (Nutrium-class)  
- Practice analytics dashboard (active clients, adherence, revenue later)  
- Branded client PDF portal share link  
- Offline-tolerant meal adherence sync

**P2 (nice-to-have)**  
- Native telehealth, Stripe billing, insurance/superbills, multi-dietitian orgs, Google Calendar sync

### Shipped this pass (P0/P1 polish, no fake backends)
- Shared `EmptyState` + `DataSkeleton`; client/appt/measurement/no-folder empties with CTAs  
- Appointment type select + labeled form fields; upcoming/past/all filter; past = «Ολοκληρωμένο»  
- Client create field labels; search no-results empty  
- Honest «Εργαλεία Πρακτικής» stubs (billing/telehealth/reminders/calendar)  
- Removed misleading `PRO v6` badge → NutriCharis / Solo  
- CSS: `.field-label`, `.filter-chip`, `.stub-chip`

### Remains for later
- Billing, telehealth, calendar sync, SMS, team collaboration (P0/P2 backends)  
- SOAP notes, practice KPI analytics, food DB upgrade (P0/P1 product)

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

**Next:** seed local test account for authenticated E2E; P0 practice backends (calendar/SMS, messaging, SOAP notes) when ready — no fake chrome.

## Change log
- 2026-11-17: Full SaaS Audit — saas-comparator + e2e-flow-tester + ui-craftsman parallel pass; build green.
- 2026-11-17: E2E flow tester — fixed EmptyState duplicate (webpack overlay), register anthro HTML bounds, LegalModal Escape, Greek recovery session errors, auth alert roles; unauthenticated surface re-verified; authenticated coverage blocked (no password in env).
- 2026-11-17: Competitive benchmark + UX gap ship — empty states, appointment filters/types, practice stubs, labeled forms, docs/vault patterns.
- 2026-11-17: UI craftsman polish — brand-first auth hero («Χάρις Φωτούδη» display + NutriCharis line; removed pill + 3 feature cards), Plus Jakarta Sans body (no Inter), deeper glass / focus rings, `.empty-state` + `DataSkeleton`, auth/boot motion (`authBrandReveal`, `authFormRise`, boot pulse), mobile `.auth-mobile-brand`, MedicalFooter glass panel. `npm run build` Compiled successfully.
- 2026-11-17: E2E bug audit + UI polish — password recovery (`PASSWORD_RECOVERY` + `type=recovery` URL/hash with lazy init + hashchange, confirm + strength meter, auto-dashboard after `updateUser`), hardened logout/session clear, AI via `/api/generate-meals` with local key fallback, appointment visibility filter + delete error handling, glass modal/badge CSS level-up, legacy Admin appointments stub clarified. Browser QA: recovery form + strength/match + Privacy modal OK; `npm run build` 0 errors.
- 2026-11-17: Full cyber/legal hardening — headers, RLS migration, IDOR guards, rate limits, GDPR Art.9/17/20 UI, nutrition-math extraction, docs, env secret lockdown, adversarial browser QA.

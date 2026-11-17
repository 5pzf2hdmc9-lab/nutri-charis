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

## Change log
- 2026-11-17: E2E bug audit + UI polish — password recovery (`PASSWORD_RECOVERY` + `type=recovery` URL/hash with lazy init + hashchange, confirm + strength meter, auto-dashboard after `updateUser`), hardened logout/session clear, AI via `/api/generate-meals` with local key fallback, appointment visibility filter + delete error handling, glass modal/badge CSS level-up, legacy Admin appointments stub clarified. Browser QA: recovery form + strength/match + Privacy modal OK; `npm run build` 0 errors.
- 2026-11-17: Full cyber/legal hardening — headers, RLS migration, IDOR guards, rate limits, GDPR Art.9/17/20 UI, nutrition-math extraction, docs, env secret lockdown, adversarial browser QA.

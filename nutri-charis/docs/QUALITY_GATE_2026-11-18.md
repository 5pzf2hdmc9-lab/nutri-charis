# NutriCharis quality gate — 2026-11-18

Roles applied in this pass: security/legal audit, browser flow test, UI craft. There is no separate agent binary for those names in this environment; the checks below are the audit those roles describe.

## Security, RLS, legal

| Check | Result |
| --- | --- |
| No service-role or `sb_secret` in `REACT_APP_*` / client source | Pass. Browser client uses the anon key only and refuses a hardcoded fallback. |
| AI key | Pass. `GEMINI_API_KEY` is read only in `api/generate-meals.js`. Browser `apiKey` fields are rejected. `src/api/generate-meals.js` returns 410. |
| Dietitian gate on AI | Pass. Bearer token is checked with Supabase `/auth/v1/user`, then a `dietitians` row under RLS. |
| Prompt handling | Pass. Zod `.strict()` allows only `promptText` (1–12000). Tags stripped, wrapped in `<user_input>`. |
| Rate limit | Pass on the server (IP + user). Auth forms still use a client limiter only; Supabase Auth is the brute-force control. |
| IDOR in the app | Pass. Writes call `getUser()` and `assertClientAccess`. Client list filters `dietitian_id`. |
| RLS tenant isolation | **Fixed in repo, must be applied in Supabase.** Previous policies used `OR public.is_dietitian()`, so any dietitian could read and change every client, appointment, measurement, and questionnaire. `supabase/migrations/zz_quality_gate_tenant_rls.sql` scopes rows to `private.uid()`, keeps patient self-access, and allows unassigned folders only when the practice has exactly one dietitian. `public.is_dietitian()` execute is revoked. |
| Consent | Pass. Register and new-client require GDPR, Art.9, and Terms. Inserts store the three timestamps. The new client INSERT policy rejects rows without them. |
| Legal UI | Pass. Privacy, Terms, Cookies/Storage, AI Transparency, and the permanent medical disclaimer (Π.Δ. 133/2014, Ν. 4624/2019, AI Act) are on the auth shell, recovery, and the signed-in shell. |
| Headers | Pass on `nutri-charis/vercel.json` and now on the repo-root `vercel.json` (XFO DENY, nosniff, HSTS, COOP, CORP, CSP). |
| Admin email in the bundle | **Fixed.** A personal address is no longer compiled into `STRICT_ADMIN_EMAILS`. |
| Secrets in git | Pass. Root `.gitignore` ignores `.env` and `.env.*`. |

### Apply in Supabase

Run `nutri-charis/supabase/migrations/zz_quality_gate_tenant_rls.sql` in the SQL editor after the existing migrations. It does not drop clinical tables. It backfills `dietitian_id` only when there is exactly one dietitian.

### Residuals (not claimed as closed)

- CSP `script-src 'unsafe-inline'` stays because Create React App injects inline boot code.
- Public Jitsi (`meet.jit.si`) has no NutriCharis DPA. The privacy policy already says so.
- Supabase Auth “leaked password” protection is a dashboard toggle, not a migration.
- `npm audit` highs in `react-scripts` are build-time. Do not `audit fix --force`.
- Authenticated clinical clicks were not run here: no `E2E_EMAIL` / `E2E_PASSWORD` in the environment, and none were invented.

## Browser flows

`npx playwright test e2e/auth-surface.spec.ts` passed on Chromium against the dev server.

Clicked, one by one: password show/hide, forgot-password and return, register fields, consent checkboxes, submit blocked without a valid email, XSS string left as text (no injected script), Privacy, Terms, Cookies/Storage, AI Transparency (Escape closes each), mobile 390×844 with no horizontal overflow, recovery `#type=recovery`.

The live clinical spec (`e2e/nutricharis.spec.ts`) skips cleanly when those credentials are absent. It still covers clients, plan, SOAP, billing, appointments, measurements, and logout when a seeded dietitian is configured.

## UI

- Self-hosted Plus Jakarta Sans and JetBrains Mono so CSP `font-src 'self'` does not fall back to a random sans for the Latin UI. Greek glyphs use `system-ui` (the face has no Greek subset).
- Auth and legal links use `.text-link-btn` with a visible focus ring. Password toggle has an accessible name.
- Legal dialog header stays pinned while the policy scrolls.
- Recovery copy no longer says “dashboard”.
- Boot loader no longer names Inter, and pinch-zoom is allowed.

## Build

`npm run build` from the repo root (delegates to `nutri-charis`) compiled successfully, 0 errors.

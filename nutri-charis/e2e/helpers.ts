import { expect, type Page, type Response } from '@playwright/test';
import { DAYS, MEAL_TYPES } from '../src/constants/dietPlan';

export function requireE2ECreds() {
  const email = (process.env.E2E_EMAIL || '').trim();
  const password = process.env.E2E_PASSWORD || '';
  if (!email || !password) {
    throw new Error(
      'Missing E2E_EMAIL / E2E_PASSWORD in .env.local. Create a dietitian user, set REACT_APP_ADMIN_EMAIL to that email, and restart CRA.'
    );
  }
  return { email, password };
}

export function buildMockWeekPlan(marker = 'E2E-WEEK') {
  const week: Record<string, Record<string, string>> = {};
  DAYS.forEach((d, di) => {
    week[d] = {};
    MEAL_TYPES.forEach((m, mi) => {
      week[d][m.key] = `${marker} ${d} ${m.key} ${di}-${mi} · 100γρ κοτόπουλο`;
    });
  });
  return week;
}

export function installApiMocks(page: Page) {
  return page.route('**/api/generate-meals', async (route) => {
    const body = route.request().postDataJSON() as { promptText?: string } | null;
    const prompt = String(body?.promptText || '');
    if (/FDA|USDA|μικροθρεπτικ/i.test(prompt)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          text: JSON.stringify({
            kcal: 1650,
            protein: 105,
            carbs: 145,
            fat: 58,
            micros: {
              vitA: 700,
              vitC: 85,
              vitD: 6.5,
              vitE: 12,
              vitK: 90,
              thiamin: 1.1,
              riboflavin: 1.2,
              niacin: 14,
              vitB6: 1.4,
              folate: 320,
              vitB12: 3.1,
              biotin: 25,
              pantothenic: 4.5,
              calcium: 920,
              iron: 13.5,
              phosphorus: 900,
              iodine: 140,
              magnesium: 340,
              zinc: 9.8,
              selenium: 48,
              copper: 0.8,
              manganese: 2.0,
              chromium: 28,
              molybdenum: 40,
              chloride: 1800,
              potassium: 3100,
              choline: 420,
              fiber: 25.4
            }
          })
        })
      });
      return;
    }
    if (/7 ημερ|εβδομαδια|Δευτέρα έως Κυριακή/i.test(prompt)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ text: JSON.stringify(buildMockWeekPlan('AI-AUTO')) })
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        text: JSON.stringify([
          { title: 'E2E A', meal: '150γρ γιαούρτι 2% & 30γρ βρώμη', kcal: 320, protein: 20, carbs: 35, fat: 8 },
          { title: 'E2E B', meal: '2 αυγά βραστά & 1 φρυγανιά', kcal: 280, protein: 18, carbs: 20, fat: 12 },
          { title: 'E2E C', meal: '120γρ κοτόπουλο & σαλάτα', kcal: 350, protein: 32, carbs: 10, fat: 14 }
        ])
      })
    });
  });
}

export type GuardState = {
  consoleErrors: string[];
  httpFailures: string[];
};

export function attachGuards(page: Page): GuardState {
  const state: GuardState = { consoleErrors: [], httpFailures: [] };

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    // CRA/webpack noise + React Router/devtool chatter
    if (/Download the React DevTools|webpackHotDevClient|ResizeObserver loop|favicon/i.test(text)) return;
    state.consoleErrors.push(text);
  });

  page.on('pageerror', (err) => {
    state.consoleErrors.push(String(err?.message || err));
  });

  page.on('response', (res: Response) => {
    const status = res.status();
    if (status < 400) return;
    const url = res.url();
    const interesting =
      /supabase\.co|\/auth\/v1|\/rest\/v1|\/api\//i.test(url) ||
      status >= 500;
    if (!interesting) return;
    // Ignore expected 404s for missing optional assets
    if (status === 404 && /favicon|sockjs|hot-update/i.test(url)) return;
    state.httpFailures.push(`${status} ${url}`);
  });

  return state;
}

export async function assertNoRuntimeFailures(state: GuardState) {
  expect(state.consoleErrors, `console.error: ${state.consoleErrors.join(' | ')}`).toEqual([]);
  expect(state.httpFailures, `HTTP failures: ${state.httpFailures.join(' | ')}`).toEqual([]);
}

/** Fail if a danger toast / role=alert with warning glyph is visible. */
export async function assertNoErrorToast(page: Page) {
  const toast = page.locator('div').filter({ hasText: /^⚠️/ }).first();
  if (await toast.isVisible().catch(() => false)) {
    const text = await toast.innerText();
    throw new Error(`Error toast visible: ${text}`);
  }
  const alerts = page.locator('[role="alert"]');
  const count = await alerts.count();
  for (let i = 0; i < count; i++) {
    const t = (await alerts.nth(i).innerText()).trim();
    if (/⚠️|Σφάλμα|Αποτυχία|error|fail/i.test(t)) {
      throw new Error(`Alert error: ${t}`);
    }
  }
}

export async function loginAsE2E(page: Page) {
  const { email, password } = requireE2ECreds();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Σύνδεση' })).toBeVisible({ timeout: 30_000 });
  await page.locator('#auth-email').fill(email);
  await page.locator('#auth-password').fill(password);
  await page.getByRole('button', { name: /Είσοδος στην Πλατφόρμα/ }).click();
  await expect(page.getByRole('button', { name: /Αποσύνδεση/ })).toBeVisible({ timeout: 45_000 });
  // Consent gate should already be stamped; if present, complete it.
  const consentTitle = page.getByRole('heading', { name: /Συγκατάθεση διαιτολόγου/ });
  if (await consentTitle.isVisible().catch(() => false)) {
    const dialog = page.getByRole('dialog');
    await dialog.locator('input[type="checkbox"]').nth(0).check();
    await dialog.locator('input[type="checkbox"]').nth(1).check();
    await dialog.locator('input[type="checkbox"]').nth(2).check();
    await dialog.getByRole('button', { name: /Καταγραφή συγκατάθεσης/ }).click();
    await expect(consentTitle).toBeHidden({ timeout: 20_000 });
  }
}

export async function selectClientByName(page: Page, clientName: string) {
  const select = page.locator('select[aria-label="Ενεργός πελάτης"]');
  await expect(select).toBeVisible({ timeout: 20_000 });
  const option = select.locator('option', { hasText: clientName }).first();
  const value = await option.getAttribute('value');
  if (!value) throw new Error(`Client option not found: ${clientName}`);
  await select.selectOption(value);
}

export async function ensureE2EClient(page: Page, clientName: string) {
  await page.locator('.desktop-top-tabs').getByRole('button', { name: /Πελάτες/ }).click();
  await expect(page.getByRole('heading', { name: /Μητρώο Πελατών/ })).toBeVisible();

  const select = page.locator('select[aria-label="Ενεργός πελάτης"]');
  if ((await select.count()) > 0) {
    const has = await select.locator('option', { hasText: clientName }).count();
    if (has > 0) {
      await selectClientByName(page, clientName);
      return;
    }
  }

  // List card click fallback before creating
  const listHit = page.locator('section.luxury-card').getByText(clientName, { exact: true }).first();
  if (await listHit.isVisible().catch(() => false)) {
    await listHit.click();
    return;
  }

  const newExact = page.getByRole('button', { name: '+ Νέος', exact: true });
  if (await newExact.isVisible().catch(() => false)) {
    await newExact.click();
  } else {
    await page.getByRole('button', { name: '+ Νέος Πελάτης' }).click();
  }
  await page.locator('#nc-name').fill(clientName);
  await page.locator('#nc-email').fill(`e2e.client.${Date.now()}@example.com`);
  await page.locator('#nc-phone').fill('6912345678');
  await page.locator('#nc-age').fill('32');
  await page.locator('#nc-weight').fill('68');
  await page.locator('#nc-height').fill('168');
  await page.locator('#nc-goal').fill('E2E persistence');
  const form = page.locator('form').filter({ has: page.locator('#nc-name') });
  const boxes = form.locator('input[type="checkbox"]');
  for (let i = 0; i < 3; i++) {
    const box = boxes.nth(i);
    if (!(await box.isChecked())) await box.click({ force: true });
  }
  await form.getByRole('button', { name: /Δημιουργία Φακέλου/ }).click();
  await expect(page.getByRole('heading', { name: /Πρόγραμμα Διατροφής/ })).toBeVisible({
    timeout: 30_000
  });
  await selectClientByName(page, clientName).catch(() => undefined);
}

export async function goTab(page: Page, label: RegExp) {
  await page.locator('.desktop-top-tabs').getByRole('button', { name: label }).click();
}

export { DAYS, MEAL_TYPES };

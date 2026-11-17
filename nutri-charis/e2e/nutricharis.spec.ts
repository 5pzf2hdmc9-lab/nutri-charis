import { expect, test, type Page } from '@playwright/test';
import {
  assertNoErrorToast,
  assertNoRuntimeFailures,
  attachGuards,
  DAYS,
  ensureE2EClient,
  goTab,
  installApiMocks,
  loginAsE2E,
  MEAL_TYPES,
  selectClientByName
} from './helpers';

const CLIENT_NAME = 'E2E Playwright Client';

async function acceptDialogs(page: Page) {
  page.on('dialog', async (d) => {
    await d.accept();
  });
}

test.describe.configure({ mode: 'serial' });

test.describe('NutriCharis live E2E', () => {
  test('full clinical OS flows against live Supabase', async ({ page, context }) => {
    const guards = attachGuards(page);
    await installApiMocks(page);
    await acceptDialogs(page);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => undefined);

    // --- Auth ---
    await loginAsE2E(page);
    await assertNoErrorToast(page);

    // --- Clients + create/select ---
    await ensureE2EClient(page, CLIENT_NAME);
    await assertNoErrorToast(page);

    // Practice tools (Jitsi / Calendar / Notify)
    await goTab(page, /Πελάτες/);
    await expect(page.getByText('Εργαλεία Πρακτικής')).toBeVisible();
    await expect(page.getByText('Τηλεσυνεδρία (Live Video)')).toBeVisible();

    const popupPromise = context.waitForEvent('page', { timeout: 8_000 }).catch(() => null);
    await page.getByRole('button', { name: 'Άνοιγμα δωματίου' }).click();
    const meetPopup = await popupPromise;
    if (meetPopup) {
      expect(meetPopup.url()).toMatch(/meet\.jit\.si/i);
      await meetPopup.close();
    }

    await page.getByRole('button', { name: /Αντιγραφή Link/ }).click();
    await expect(page.getByText(/Αντιγράφηκε|✓/)).toBeVisible({ timeout: 10_000 });

    const gcalPopup = context.waitForEvent('page', { timeout: 8_000 }).catch(() => null);
    await page.getByRole('button', { name: 'Προσθήκη στο Google Calendar' }).click();
    const gcal = await gcalPopup;
    if (gcal) {
      expect(gcal.url()).toMatch(/google\.com/i);
      await gcal.close();
    }

    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 }).catch(() => null);
    await page.getByRole('button', { name: 'Λήψη .ics' }).click();
    await downloadPromise;

    for (const label of ['WhatsApp', 'Viber', 'SMS', 'Email'] as const) {
      const notifyPopup = context.waitForEvent('page', { timeout: 5_000 }).catch(() => null);
      await page
        .locator('div')
        .filter({ hasText: 'Κέντρο Ειδοποιήσεων 24ω' })
        .getByRole('button', { name: label, exact: true })
        .click();
      const p = await notifyPopup;
      if (p) await p.close();
    }
    await assertNoErrorToast(page);

    // --- Plan tab: templates, exchanges, shopping, PDF, AI week ---
    await goTab(page, /Σχεδιασμός Πλάνου/);
    await expect(page.getByText(/Πρόγραμμα Διατροφής/)).toBeVisible();

    await page.getByRole('button', { name: 'Βιβλιοθήκη Προτύπων' }).click();
    await expect(page.getByRole('heading', { name: /Βιβλιοθήκη Προτύπων/ })).toBeVisible();
    await expect(page.getByText(/Ελληνικά ισοδύναμα/)).toBeVisible();

    // Insert one Greek exchange into selected meal
    await page.getByRole('button', { name: /Στήθος κοτόπουλου ψητό/ }).click();
    await expect(page.getByText(/Ενημερώθηκε|Υπάρχει ήδη/)).toBeVisible({ timeout: 15_000 });

    // Apply built-in template (7×5 keys must match DAYS/MEAL_TYPES)
    await page
      .locator('.template-row')
      .filter({ hasText: 'Μεσογειακό Πρωτόκολλο 1550 kcal' })
      .getByRole('button', { name: /Εφαρμογή/ })
      .click();
    await expect(page.getByText(/Εφαρμόστηκε το πρότυπο/)).toBeVisible({ timeout: 20_000 });

    const matrix = page.locator('.desktop-matrix-view');
    // Verify matrix cells have meal text for Mon breakfast
    await expect(matrix.getByText(/γιαούρτι στραγγιστό/i).first()).toBeVisible({ timeout: 15_000 });

    // Persistence after reload
    await page.reload();
    await expect(page.getByRole('button', { name: /Αποσύνδεση/ })).toBeVisible({ timeout: 45_000 });
    await selectClientByName(page, CLIENT_NAME);
    await goTab(page, /Σχεδιασμός Πλάνου/);
    await expect(page.locator('.desktop-matrix-view').getByText(/γιαούρτι στραγγιστό/i).first()).toBeVisible({
      timeout: 20_000
    });

    // Auto 7-day AI (mocked) + persistence — confirm() accepted by acceptDialogs()
    await page.getByRole('button', { name: /Αυτόματο Πλάνο 7 Ημερών/ }).click();
    await expect(page.getByText(/εβδομαδιαίο πλάνο 7 ημερών δημιουργήθηκε/i)).toBeVisible({
      timeout: 45_000
    });
    await expect(page.locator('.desktop-matrix-view').getByText(/AI-AUTO Δευτέρα Πρωινό/i).first()).toBeVisible({
      timeout: 15_000
    });

    await page.reload();
    await expect(page.getByRole('button', { name: /Αποσύνδεση/ })).toBeVisible({ timeout: 45_000 });
    await selectClientByName(page, CLIENT_NAME);
    await goTab(page, /Σχεδιασμός Πλάνου/);
    const matrixAfter = page.locator('.desktop-matrix-view');
    for (const day of DAYS) {
      for (const meal of MEAL_TYPES) {
        await expect(matrixAfter.getByText(new RegExp(`AI-AUTO ${day} ${meal.key}`)).first()).toBeVisible({
          timeout: 15_000
        });
      }
    }

    // Shopping list modal
    await page.getByRole('button', { name: /Δημιουργία Λίστας Σούπερ Μάρκετ/ }).click();
    await expect(page.locator('#shopping-list-title')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Κλείσιμο' }).click();
    await expect(page.locator('#shopping-list-title')).toBeHidden({ timeout: 10_000 });

    // A4 clinical PDF export (print stubbed)
    await page.evaluate(() => {
      (window as unknown as { __printed?: boolean }).__printed = false;
      window.print = () => {
        (window as unknown as { __printed?: boolean }).__printed = true;
      };
    });
    await page.getByRole('button', { name: /Εξαγωγή Διαιτολογίου \(PDF\)/ }).click();
    await expect.poll(async () => page.evaluate(() => (window as unknown as { __printed?: boolean }).__printed)).toBe(true);

    // Excel / PDF preview modal
    await page.getByRole('button', { name: /Προεπισκόπηση Excel/ }).click();
    await expect(page.getByText('📄 Προεπισκόπηση PDF')).toBeVisible({ timeout: 10_000 });
    await page.getByText('📄 Προεπισκόπηση PDF').locator('..').getByRole('button', { name: '✕' }).click();
    await expect(page.getByText('📄 Προεπισκόπηση PDF')).toBeHidden({ timeout: 10_000 });
    await expect(page.locator('.glass-modal-backdrop')).toHaveCount(0, { timeout: 10_000 });

    // FDA AI (mocked)
    await page.getByRole('button', { name: 'FDA AI' }).click();
    await expect(page.getByText(/Ακριβής ανάλυση FDA/i)).toBeVisible({ timeout: 20_000 });
    await assertNoErrorToast(page);

    // WhatsApp plan (clipboard or popup)
    const waPopup = context.waitForEvent('page', { timeout: 5_000 }).catch(() => null);
    await page.getByRole('button', { name: /WhatsApp/ }).first().click();
    const wa = await waPopup;
    if (wa) await wa.close();

    // --- Profile: SOAP + billing ---
    await selectClientByName(page, CLIENT_NAME);
    await goTab(page, /Φάκελος Πελάτη/);
    await expect(page.getByText(/Κλινικός Φάκελος/)).toBeVisible();
    await page.getByRole('tab', { name: /Ιστορικό & SOAP Notes/ }).click();
    const soapMarker = `E2E subjective ${Date.now()}`;
    await page.locator('#soap-date').fill(new Date().toISOString().slice(0, 10));
    await page.locator('#soap-adhere').fill('8');
    await page.locator('#soap-subjective').fill(soapMarker);
    await page.locator('#soap-objective').fill('E2E objective — βάρος σταθερό');
    await page.locator('#soap-assessment').fill('E2E assessment — πρόοδος OK');
    await page.locator('#soap-plan').fill('E2E plan — συνέχιση πρωτοκόλλου');
    await page.getByRole('button', { name: /Καταγραφή συνεδρίας/ }).click();
    await expect(page.getByLabel('Χρονολόγιο SOAP').getByText(soapMarker)).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#soap-subjective')).toHaveValue('');

    await page.reload();
    await expect(page.getByRole('button', { name: /Αποσύνδεση/ })).toBeVisible({ timeout: 45_000 });
    await selectClientByName(page, CLIENT_NAME);
    await goTab(page, /Φάκελος Πελάτη/);
    await page.getByRole('tab', { name: /Ιστορικό & SOAP Notes/ }).click();
    await expect(page.getByLabel('Χρονολόγιο SOAP').getByText(soapMarker)).toBeVisible({ timeout: 20_000 });

    await page.getByRole('tab', { name: /Πακέτα & Πληρωμές/ }).click();
    await page.locator('#pkg-name').fill('E2E Πακέτο 4');
    await page.locator('#pkg-total').fill('4');
    await page.locator('#pkg-amount').fill('120');
    await page.locator('#pkg-status').selectOption('pending');
    await page.locator('#pkg-method').fill('Μετρητά');
    await page.getByRole('button', { name: /Νέο πακέτο/ }).click();
    await expect(page.getByText('E2E Πακέτο 4')).toBeVisible({ timeout: 20_000 });

    await page.reload();
    await expect(page.getByRole('button', { name: /Αποσύνδεση/ })).toBeVisible({ timeout: 45_000 });
    await selectClientByName(page, CLIENT_NAME);
    await goTab(page, /Φάκελος Πελάτη/);
    await page.getByRole('tab', { name: /Πακέτα & Πληρωμές/ }).click();
    await expect(page.getByText('E2E Πακέτο 4')).toBeVisible({ timeout: 20_000 });

    // --- Appointments ---
    await selectClientByName(page, CLIENT_NAME);
    await goTab(page, /Ραντεβού/);
    await expect(page.getByText(/Πρόγραμμα Συνεδριών/)).toBeVisible();
    for (const f of ['Επερχόμενα', 'Παρελθόντα', 'Χωρίς έκβαση', 'Όλα']) {
      await page.getByRole('button', { name: f, exact: true }).click();
    }
    await page.getByRole('button', { name: 'Επερχόμενα', exact: true }).click();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const dateStr = tomorrow.toISOString().slice(0, 10);
    await page.locator('#appt-date').fill(dateStr);
    await page.locator('#appt-time').fill('11:30');
    await page.locator('#appt-notes').fill('E2E ραντεβού επανέλεγχος');
    await page.getByRole('button', { name: /\+ Κλείσιμο/ }).click();
    await expect(page.getByText(/E2E ραντεβού επανέλεγχος/)).toBeVisible({ timeout: 20_000 });

    await page.reload();
    await expect(page.getByRole('button', { name: /Αποσύνδεση/ })).toBeVisible({ timeout: 45_000 });
    await selectClientByName(page, CLIENT_NAME);
    await goTab(page, /Ραντεβού/);
    await page.getByRole('button', { name: 'Όλα', exact: true }).click();
    await expect(page.getByText(/E2E ραντεβού επανέλεγχος/)).toBeVisible({ timeout: 20_000 });

    // Reminder copy if visible
    const reminder = page.getByRole('button', { name: /Αντιγραφή υπενθύμισης|Υπενθύμιση/i }).first();
    if (await reminder.isVisible().catch(() => false)) {
      await reminder.click();
    }

    // --- Measurements + skinfolds ---
    await selectClientByName(page, CLIENT_NAME);
    await goTab(page, /Μετρήσεις/);
    await expect(page.getByText(/Ανθρωπομετρικές Μετρήσεις/)).toBeVisible();
    const measWeight = '67.3';
    await page.locator('#meas-weight').fill(measWeight);
    await page.locator('#meas-fat').fill('24.5');
    await page.locator('#meas-muscle').fill('28.1');
    await page.locator('#meas-waist').fill('74');
    await page.locator('#anthro-neck').fill('32');
    await page.locator('#anthro-triceps').fill('14');
    await page.locator('#anthro-abdominal').fill('18');
    await page.getByRole('button', { name: /\+ Καταγραφή/ }).click();
    await expect(page.getByText(/Η μέτρηση αποθηκεύτηκε/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.history-row, .history-metrics').getByText(/67\.3/).first()).toBeVisible({
      timeout: 10_000
    });

    await page.reload();
    await expect(page.getByRole('button', { name: /Αποσύνδεση/ })).toBeVisible({ timeout: 45_000 });
    await selectClientByName(page, CLIENT_NAME);
    await goTab(page, /Μετρήσεις/);
    await expect(page.locator('.history-row, .history-metrics').getByText(/67\.3/).first()).toBeVisible({
      timeout: 20_000
    });

    // Invalid measurement XSS / bounds — must not crash
    await page.locator('#meas-weight').fill('-5');
    await page.getByRole('button', { name: /\+ Καταγραφή/ }).click();
    await page.locator('#meas-weight').fill('68');

    // --- BMR / TDEE ---
    await goTab(page, /BMR \/ TDEE/);
    const calcSection = page.locator('section.luxury-card').filter({ hasText: /Μεταβολικός Υπολογιστής/ });
    await expect(calcSection).toBeVisible();
    await expect(calcSection.getByText('BMR', { exact: true }).first()).toBeVisible();
    await expect(calcSection.getByText('TDEE', { exact: true }).first()).toBeVisible();
    const applyBtn = calcSection.getByRole('button', { name: /Εφαρμογή/ }).first();
    if (await applyBtn.isVisible().catch(() => false)) {
      await applyBtn.click();
    }

    // --- Mobile dock smoke ---
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('.mobile-bottom-dock')).toBeVisible();
    await page.locator('.mobile-bottom-dock').getByRole('button', { name: /Πλάνο|Πελάτες/ }).first().click();
    await page.setViewportSize({ width: 1280, height: 800 });

    // --- Logout ---
    await page.getByRole('button', { name: /Αποσύνδεση/ }).click();
    await expect(page.getByRole('heading', { name: 'Σύνδεση' })).toBeVisible({ timeout: 20_000 });

    // Login validation: empty password blocked by HTML5
    await page.locator('#auth-email').fill('not-an-email');
    await page.getByRole('button', { name: /Είσοδος στην Πλατφόρμα/ }).click();
    await expect(page.getByRole('heading', { name: 'Σύνδεση' })).toBeVisible();

    await assertNoRuntimeFailures(guards);
  });
});

import { expect, test, type Page } from '@playwright/test';

async function openLegal(page: Page, name: string, heading: RegExp) {
  await page.getByRole('button', { name, exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: heading })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
}

test.describe('Unauthenticated auth surface', () => {
  test('login, register, recovery, and legal controls', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Σύνδεση' })).toBeVisible();
    await expect(page.getByText(/Ιατρική Αποποίηση/).first()).toBeVisible();
    await expect(page.getByText(/Π\.Δ\. 133\/2014/).first()).toBeVisible();

    await page.locator('#auth-email').fill('person@example.com');
    await page.locator('#auth-password').fill('secret-pass');
    await expect(page.locator('#auth-password')).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Προβολή κωδικού' }).click();
    await expect(page.locator('#auth-password')).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Απόκρυψη κωδικού' }).click();
    await expect(page.locator('#auth-password')).toHaveAttribute('type', 'password');

    await page.getByRole('button', { name: 'Ξέχασα τον κωδικό μου;' }).click();
    await expect(page.getByRole('heading', { name: 'Επαναφορά κωδικού' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Αποστολή Link Επαναφοράς/ })).toBeVisible();
    await page.getByRole('button', { name: /Επιστροφή στη Σύνδεση/ }).click();
    await expect(page.getByRole('heading', { name: 'Σύνδεση' })).toBeVisible();

    await page.getByRole('button', { name: 'Εγγραφή & Ιστορικό' }).click();
    await expect(page.getByRole('heading', { name: 'Εγγραφή πελάτη' })).toBeVisible();
    await page.locator('#auth-name').fill('<script>alert(1)</script>');
    await page.locator('#auth-phone').fill('6912345678');
    await page.locator('#auth-age').fill('30');
    await page.locator('#auth-weight').fill('70');
    await page.locator('#auth-height').fill('170');
    await page.locator('#auth-goal').fill('Συντήρηση');
    await page.locator('#auth-allergies').fill('καμία');
    await page.locator('#auth-email').fill('person@example.com');
    await page.locator('#auth-password').fill('secret-pass');

    await page.getByRole('button', { name: /Δημιουργία Φακέλου/ }).click();
    await expect(page.getByRole('heading', { name: 'Εγγραφή πελάτη' })).toBeVisible();
    await expect(page.locator('script', { hasText: 'alert(1)' })).toHaveCount(0);

    await page.getByRole('checkbox', { name: /Πολιτική Απορρήτου/ }).check();
    await page.getByRole('checkbox', { name: /Άρθρου 9/ }).check();
    await page.getByRole('checkbox', { name: /Όρους Χρήσης/ }).check();
    await expect(page.getByRole('checkbox', { name: /Άρθρου 9/ })).toBeChecked();

    await openLegal(page, 'Πολιτική Απορρήτου', /Πολιτική Απορρήτου/);
    await openLegal(page, 'Όροι Χρήσης', /Όροι Χρήσης/);
    await openLegal(page, 'Cookies / Storage', /Cookies/);
    await openLegal(page, 'AI Transparency', /AI Transparency/);
    await expect(page.getByText(/Ιατρική Αποποίηση/)).toBeVisible();

    await page.getByRole('button', { name: 'Σύνδεση', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Σύνδεση' })).toBeVisible();

    await page.locator('#auth-email').fill('not-an-email');
    await page.locator('#auth-password').fill('short');
    await page.getByRole('button', { name: /Είσοδος στην Πλατφόρμα/ }).click();
    await expect(page.getByRole('heading', { name: 'Σύνδεση' })).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('.auth-mobile-brand')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);

    await page.goto('/#type=recovery');
    await expect(page.getByRole('heading', { name: 'Ορισμός Νέου Κωδικού' })).toBeVisible();
    await expect(page.getByText(/Ιατρική Αποποίηση/)).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});

import { test, expect } from '@playwright/test';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

/**
 * Exercises the First-Run Experience (Round 5 Decision 5) against the
 * real backend — no mocking. Requires the Identity, Object, AI Memory,
 * and Search Services (plus this app) running locally; see README.
 */
test.describe('Onboarding', () => {
  test('sign-up redirects to onboarding, adding an entry and skipping the rest reaches the dashboard and transitions Cold Start phase', async ({ page }) => {
    const email = uniqueEmail('onboarding-e2e');

    await page.goto('/sign-up');
    await page.fill('#name', 'Onboarding E2E');
    await page.fill('#email', email);
    await page.fill('#password', 'TestPassword123!');
    await page.click('button[type=submit]');
    await page.waitForURL('**/onboarding');

    await page.fill('#title', 'Deep Tech Mastery');
    await page.fill('#statement', 'Build meaningful expertise in quantum computing');
    await page.click('button:has-text("Add")');
    await expect(page.locator('li', { hasText: 'Deep Tech Mastery' })).toBeVisible();
    await page.click('button:has-text("Next")');
    await expect(page.getByRole('heading', { name: 'Identity' })).toBeVisible();

    for (let i = 0; i < 5; i++) {
      await page.click('button:has-text("Skip this step")');
    }
    await expect(page.getByRole('heading', { name: 'Success' })).toBeVisible();

    await page.fill('#category', 'Career');
    await page.fill('#definition', 'Shipping work I am proud of');
    await page.click('button:has-text("Add")');
    await page.click('button:has-text("Finish")');
    await page.waitForURL('**/dashboard');

    const status = await page.evaluate(async () => {
      const res = await fetch('http://localhost:4004/api/v1/onboarding/status', {
        credentials: 'include',
      });
      return res.json();
    });
    expect(status.coldStartPhase).toBe('LEARNING');
    expect(status.onboardingCompletedAt).not.toBeNull();

    // Reloading root while signed in with onboarding complete lands
    // straight on the dashboard, not back on onboarding.
    await page.goto('/');
    await page.waitForURL('**/dashboard');
  });

  test('dismissing onboarding immediately reaches the dashboard, and signing back in does not show onboarding again', async ({ page }) => {
    const email = uniqueEmail('dismiss-e2e');

    await page.goto('/sign-up');
    await page.fill('#name', 'Dismiss E2E');
    await page.fill('#email', email);
    await page.fill('#password', 'TestPassword123!');
    await page.click('button[type=submit]');
    await page.waitForURL('**/onboarding');

    await page.click('text=Skip onboarding for now');
    await page.waitForURL('**/dashboard');

    await page.goto('/sign-in');
    await page.fill('#email', email);
    await page.fill('#password', 'TestPassword123!');
    await page.click('button[type=submit]');
    await page.waitForURL('**/dashboard');
  });
});

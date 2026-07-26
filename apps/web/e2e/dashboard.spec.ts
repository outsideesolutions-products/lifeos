import { test, expect } from '@playwright/test';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

async function signUpAndDismissOnboarding(page: import('@playwright/test').Page, name: string) {
  const email = uniqueEmail(name.toLowerCase().replace(/\s+/g, '-'));
  await page.goto('/sign-up');
  await page.fill('#name', name);
  await page.fill('#email', email);
  await page.fill('#password', 'TestPassword123!');
  await page.click('button[type=submit]');
  await page.waitForURL('**/onboarding');
  await page.click('text=Skip onboarding for now');
  await page.waitForURL('**/dashboard');
  return email;
}

/**
 * The Milestone 1 minimum-viable Dashboard — see apps/web/README.md for
 * the scope note on which cards are real vs. deferred to later milestones.
 */
test.describe('Dashboard', () => {
  test('shows a time-of-day greeting with the real user name', async ({ page }) => {
    const name = 'Dashboard E2E';
    await signUpAndDismissOnboarding(page, name);
    await expect(page.locator('h1')).toContainText(name);
    await expect(page.locator('h1')).toContainText(/Good (morning|afternoon|evening)/);
  });

  test('Recent Activity shows an empty state, then a real Working Memory entry after one is created', async ({ page }) => {
    await signUpAndDismissOnboarding(page, 'Activity E2E');

    await expect(page.getByText('Nothing yet')).toBeVisible();

    await page.evaluate(async () => {
      await fetch('http://localhost:4006/api/v1/memories', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memoryType: 'WORKING',
          content: 'User: playwright activity check\nAssistant: acknowledged',
          source: 'e2e-test',
        }),
      });
    });

    await page.reload();
    await expect(page.getByText('playwright activity check')).toBeVisible();
  });

  test('Quick Search finds a Constitution entry created during onboarding', async ({ page }) => {
    const marker = `SearchMarker${Date.now()}`;
    const email = uniqueEmail('search-e2e');

    await page.goto('/sign-up');
    await page.fill('#name', 'Search E2E');
    await page.fill('#email', email);
    await page.fill('#password', 'TestPassword123!');
    await page.click('button[type=submit]');
    await page.waitForURL('**/onboarding');
    await page.fill('#title', `${marker} Vision`);
    await page.fill('#statement', 'A statement to search for');
    await page.click('button:has-text("Add")');
    // "Next" persists this step's entry before advancing — "Skip this step"
    // discards whatever's in the current draft/entries list, so it must
    // not be used on the step whose entry this test needs to find later.
    await page.click('button:has-text("Next")');
    // 6 remaining steps (Identity, Values, Non-negotiables, Decision
    // principles, Boundaries, Success) after the Vision step above.
    for (let i = 0; i < 6; i++) {
      await page.click('button:has-text("Skip this step")');
    }
    await page.waitForURL('**/dashboard');

    await page.locator('input[placeholder="Search..."]').fill(marker);
    await expect(page.getByText(`${marker} Vision`)).toBeVisible();
  });

  test('Chief of Staff chat renders the user message and a graceful error when the AI provider is not configured', async ({ page }) => {
    await signUpAndDismissOnboarding(page, 'Chat E2E');

    await page.locator('input[placeholder="Ask your Chief of Staff anything..."]').fill(
      'What should I focus on today?',
    );
    await page.locator('input[placeholder="Ask your Chief of Staff anything..."]').press('Enter');

    await expect(page.getByText('What should I focus on today?')).toBeVisible();

    // This environment has no OPENAI_API_KEY configured — see
    // ai/orchestrator's README. In an environment with a real key, this
    // assertion would need to change to expect an actual AI response
    // instead.
    await expect(
      page.getByText("couldn't respond just now", { exact: false }),
    ).toBeVisible({ timeout: 10000 });
  });
});

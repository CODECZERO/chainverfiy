import { test, expect } from '@playwright/test';

test('landing page has title and header', async ({ page }) => {
  await page.goto('/');

  // Expect the page title to contain "ChainVerify"
  await expect(page).toHaveTitle(/ChainVerify/i);

  // Expect the main heading to be visible
  // Note: Adjust the selector if necessary based on the actual UI
  const heading = page.locator('h1');
  await expect(heading).toBeVisible();
});

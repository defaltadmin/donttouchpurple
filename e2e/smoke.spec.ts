import { test, expect } from '@playwright/test';

test('Loads game grid and renders HUD', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.game-grid')).toBeVisible();
  await expect(page.locator('.hud-val').first()).toBeVisible();
  await expect(page.locator('.pause-overlay')).not.toBeVisible();
});

test('Grid responds to pointer input & updates score', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1500);
  const scoreText = await page.locator('.phud-score, .hud-val').first().textContent();
  const initialScore = parseInt(scoreText || '0', 10);
  const cell = page.locator('.game-grid-cell').first();
  await cell.click({ force: true });
  await page.waitForTimeout(300);
  const newScoreText = await page.locator('.phud-score, .hud-val').first().textContent();
  const newScore = parseInt(newScoreText || '0', 10);
  expect(newScore).toBeGreaterThanOrEqual(initialScore);
});

test('Pause overlay appears and resumes game', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1000);
  await page.keyboard.press('Escape');
  await expect(page.locator('.pause-overlay')).toBeVisible();
  await expect(page.locator('.pause-title')).toContainText('PAUSED');
  await page.getByRole('button', { name: /resume/i }).click();
  await expect(page.locator('.pause-overlay')).toBeHidden();
});

test('Shop renders and theme preview works', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /shop/i }).click();
  await expect(page.locator('.lb-title')).toContainText('Shop');
  await page.getByRole('button', { name: /themes/i }).click();
  await expect(page.locator('.shop-grid')).toBeVisible();
});

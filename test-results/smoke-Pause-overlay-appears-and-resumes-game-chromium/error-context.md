# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Pause overlay appears and resumes game
- Location: e2e\smoke.spec.ts:23:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.pause-overlay')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.pause-overlay')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: Don't Touch the Purple
  - generic [ref=e5]: Get your fingers ready...
  - generic [ref=e6]:
    - generic [ref=e7]: What should we call you?
    - textbox "Your name" [active] [ref=e8]
    - button "Let's Go!" [ref=e9] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('Loads game grid and renders HUD', async ({ page }) => {
  4  |   await page.goto('/');
  5  |   await expect(page.locator('.game-grid')).toBeVisible();
  6  |   await expect(page.locator('.hud-val').first()).toBeVisible();
  7  |   await expect(page.locator('.pause-overlay')).not.toBeVisible();
  8  | });
  9  | 
  10 | test('Grid responds to pointer input & updates score', async ({ page }) => {
  11 |   await page.goto('/');
  12 |   await page.waitForTimeout(1500);
  13 |   const scoreText = await page.locator('.phud-score, .hud-val').first().textContent();
  14 |   const initialScore = parseInt(scoreText || '0', 10);
  15 |   const cell = page.locator('.game-grid-cell').first();
  16 |   await cell.click({ force: true });
  17 |   await page.waitForTimeout(300);
  18 |   const newScoreText = await page.locator('.phud-score, .hud-val').first().textContent();
  19 |   const newScore = parseInt(newScoreText || '0', 10);
  20 |   expect(newScore).toBeGreaterThanOrEqual(initialScore);
  21 | });
  22 | 
  23 | test('Pause overlay appears and resumes game', async ({ page }) => {
  24 |   await page.goto('/');
  25 |   await page.waitForTimeout(1000);
  26 |   await page.keyboard.press('Escape');
> 27 |   await expect(page.locator('.pause-overlay')).toBeVisible();
     |                                                ^ Error: expect(locator).toBeVisible() failed
  28 |   await expect(page.locator('.pause-title')).toContainText('PAUSED');
  29 |   await page.getByRole('button', { name: /resume/i }).click();
  30 |   await expect(page.locator('.pause-overlay')).toBeHidden();
  31 | });
  32 | 
  33 | test('Shop renders and theme preview works', async ({ page }) => {
  34 |   await page.goto('/');
  35 |   await page.getByRole('button', { name: /shop/i }).click();
  36 |   await expect(page.locator('.lb-title')).toContainText('Shop');
  37 |   await page.getByRole('button', { name: /themes/i }).click();
  38 |   await expect(page.locator('.shop-grid')).toBeVisible();
  39 | });
  40 | 
```
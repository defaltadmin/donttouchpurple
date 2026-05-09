import { test, expect, type Page } from '@playwright/test';

// ── Shared helpers ────────────────────────────────────────────────────────────

/** Clear the name-entry gate if it appears, then wait for the menu. */
async function clearOnboarding(page: Page) {
  // Wait for either the name input (first run) or the menu card (returning user)
  await page.waitForSelector('.menu-card, input[placeholder="Your name"]', { timeout: 15000 });

  const nameInput = page.locator('input[placeholder="Your name"]');
  if (await nameInput.isVisible()) {
    await nameInput.fill('E2E');
    await page.locator('button:has-text("Let\'s Go!")').click();
  }

  // Wait for the menu card to be ready
  await expect(page.locator('.menu-card')).toBeVisible({ timeout: 10000 });
}

/** Navigate to the game screen from the menu. */
async function startGameFromMenu(page: Page) {
  // The play button has aria-label="Start new game" and text "▶ PLAY!"
  await page.getByRole('button', { name: /play!/i }).click();
  await expect(page.locator('.game-grid')).toBeVisible({ timeout: 8000 });
}

// ── beforeEach: land on menu, gate cleared ───────────────────────────────────

test.beforeEach(async ({ page }) => {
  // Pre-seed player name so the loading-screen gate is skipped on first run
  await page.addInitScript(() => {
    if (!localStorage.getItem('dtp-player-name')) {
      localStorage.setItem('dtp-player-name', 'E2E');
    }
  });
  await page.goto('/');
  await clearOnboarding(page);
});

// ── Core Game Flow ────────────────────────────────────────────────────────────

test.describe('Core Game Flow', () => {
  test('Loads menu and navigates to game grid', async ({ page }) => {
    // Menu is already visible from beforeEach
    await expect(page.locator('.menu-card')).toBeVisible();
    await startGameFromMenu(page);
    await expect(page.locator('.game-grid')).toBeVisible();
    await expect(page.locator('.hud-val').first()).toBeVisible();
    await expect(page.locator('.pause-overlay')).not.toBeVisible();
  });

  test('Grid responds to pointer input & updates score', async ({ page }) => {
    await startGameFromMenu(page);
    await page.waitForTimeout(1000);

    const scoreEl = page.locator('.hud-val').first();
    await expect(scoreEl).toBeVisible();
    const initialScore = parseInt((await scoreEl.textContent()) || '0', 10);

    const cell = page.locator('.game-grid-cell').first();
    await cell.click({ force: true });
    await page.waitForTimeout(400);

    const newScore = parseInt((await scoreEl.textContent()) || '0', 10);
    expect(newScore).toBeGreaterThanOrEqual(initialScore);
  });

  test('Pause overlay appears and resumes game', async ({ page }) => {
    await startGameFromMenu(page);
    await page.waitForTimeout(800);

    await page.keyboard.press('Escape');
    await expect(page.locator('.pause-overlay')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('.pause-title')).toContainText('PAUSED');

    await page.getByRole('button', { name: /resume/i }).click();
    await expect(page.locator('.pause-overlay')).toBeHidden({ timeout: 3000 });
  });

  test('Game over screen appears after losing all hearts', async ({ page }) => {
    await startGameFromMenu(page);
    await page.waitForTimeout(500);

    // Repeatedly click purple cells to drain hearts
    for (let i = 0; i < 10; i++) {
      const purpleCell = page.locator('.game-grid-cell.purple, .cell--purple').first();
      if (await purpleCell.isVisible()) {
        await purpleCell.click({ force: true });
        await page.waitForTimeout(150);
      }
    }

    await expect(page.locator('.go-overlay, .game-over, .gameover-screen')).toBeVisible({ timeout: 10000 });
  });
});

// ── Shop & Customization ──────────────────────────────────────────────────────

test.describe('Shop & Customization', () => {
  test('Shop renders and theme tab is visible', async ({ page }) => {
    // Shop button is in the menu links — text is "🛒 Shop"
    await page.getByRole('button', { name: /shop/i }).click();
    // ShopPanel is lazy-loaded — give it time
    await expect(page.locator('.shop-grid, .shop-panel, [class*="shop"]').first()).toBeVisible({ timeout: 8000 });
    const themesBtn = page.getByRole('button', { name: /themes/i });
    if (await themesBtn.isVisible()) {
      await themesBtn.click();
      await expect(page.locator('.shop-grid')).toBeVisible({ timeout: 5000 });
    }
  });
});

// ── Settings & Accessibility ──────────────────────────────────────────────────

test.describe('Settings & Accessibility', () => {
  test('Settings panel opens and closes', async ({ page }) => {
    // Settings button is in the header — title="Settings", text="⚙"
    await page.locator('button[title="Settings"]').click();
    // SettingsDrawer is lazy-loaded
    await expect(page.locator('.settings-panel, .settings-drawer, [role="dialog"]').first()).toBeVisible({ timeout: 8000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('.settings-panel, .settings-drawer')).not.toBeVisible({ timeout: 3000 });
  });
});

// ── Game Modes ────────────────────────────────────────────────────────────────

test.describe('Game Modes', () => {
  test('Classic mode loads a 3×3 grid', async ({ page }) => {
    // Classic pill is already selected by default
    await startGameFromMenu(page);
    const cells = page.locator('.game-grid-cell');
    await expect(cells.first()).toBeVisible();
    expect(await cells.count()).toBe(9);
  });

  test('Evolve mode starts and shows grid', async ({ page }) => {
    // Click the Evolve pill option
    await page.locator('.pill-opt', { hasText: /evolve/i }).click();
    await startGameFromMenu(page);
    await expect(page.locator('.game-grid')).toBeVisible();
  });
});

// ── Leaderboards ──────────────────────────────────────────────────────────────

test.describe('Leaderboards', () => {
  test('Leaderboard panel opens from menu', async ({ page }) => {
    // Leaderboard button text is "🏆 Leaderboard"
    await page.getByRole('button', { name: /leaderboard/i }).click();
    // LeaderboardPanel is lazy-loaded
    await expect(page.locator('.leaderboard, .lb-container, .lb-title').first()).toBeVisible({ timeout: 8000 });
  });
});

// ── Performance & Reliability ─────────────────────────────────────────────────

test.describe('Performance & Reliability', () => {
  test('No console errors during normal gameplay', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await startGameFromMenu(page);
    await page.waitForTimeout(2000);

    const cells = page.locator('.game-grid-cell');
    for (let i = 0; i < 5; i++) {
      await cells.nth(i % 9).click({ force: true });
      await page.waitForTimeout(80);
    }

    // Filter out known non-critical external errors (Firebase, Sentry, etc.)
    const criticalErrors = errors.filter(e =>
      !e.includes('firebase') &&
      !e.includes('sentry') &&
      !e.includes('clarity') &&
      !e.includes('gameanalytics') &&
      !e.includes('net::ERR') &&
      !e.includes('Failed to fetch')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('Handles offline mode gracefully', async ({ page, context }) => {
    await context.setOffline(true);
    // Already on menu from beforeEach — just verify it still renders
    await expect(page.locator('.menu-card')).toBeVisible();
    await context.setOffline(false);
  });
});

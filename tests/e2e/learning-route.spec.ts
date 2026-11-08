import { expect, test, type Page } from '@playwright/test';

async function navigate(page: Page, chapter: string) {
  if (await page.locator('[data-menu-button]').isVisible()) await page.locator('[data-menu-button]').click();
  await page.locator(`[data-go="${chapter}"]`).click();
  await expect(page.locator(`[data-page="${chapter}"]`)).toHaveAttribute('data-status', 'ready');
  await expect(page.locator('[data-page].is-active')).toHaveCount(1);
}

test.describe('touch learning route', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  test('touch positioning preserves drafts on navigation and page exit clears them', async ({ page }) => {
    await page.goto('/#history');
    await page.locator('[data-history-learning-toggle]').tap();
    await page.locator('[data-history-select-card="history-event-2001"]').tap();
    await page.locator('[data-history-place="0"]').tap();
    const reason = '我要让汽车帮助大家安全并且舒适地出行。';
    await page.locator('[data-history-reason]').fill(reason);
    await navigate(page, 'lidar');
    await navigate(page, 'history');
    await expect(page.locator('[data-history-reason]')).toHaveValue(reason);
    await page.evaluate(() => {
      window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    });
    await expect(page.locator('[data-history-learning-panel]')).toBeHidden();
    await page.locator('[data-history-learning-toggle]').tap();
    await expect(page.locator('[data-history-reason]')).toHaveValue('');
    await expect(page.locator('[data-archive-article]')).toHaveCount(14);
  });
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  for (const [chapter, entry, panel, close] of [
    ['history', 'data-history-learning-toggle', 'data-history-learning-panel', 'data-history-learning-close'],
    ['explore', 'data-learning-start', 'data-explore-learning', 'data-learning-cancel'],
    ['lidar', 'data-lidar-learning-toggle', 'data-lidar-learning', 'data-lidar-learning-close'],
    ['traffic', 'data-traffic-practice-open', 'data-traffic-learning', 'data-traffic-learning-close'],
  ]) {
    test(`${chapter} learning fits ${viewport.width}px and restores keyboard focus`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(`/#${chapter}`);
      await expect(page.locator(`[data-page="${chapter}"]`)).toHaveAttribute('data-status', 'ready');
      if (chapter === 'explore') {
        await expect(page.locator('[data-model-status]')).toHaveText('LIVE / READY', { timeout: 30000 });
        await page.locator('[data-powerflow-skip]').click();
      }
      const trigger = page.locator(`[${entry}]`);
      await trigger.focus();
      await page.keyboard.press('Enter');
      const learning = page.locator(`[${panel}]`);
      await expect(learning).toBeVisible();
      expect(await learning.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      if (process.env.LEARNING_SCREENSHOT_DIR) {
        await page.screenshot({ path: `${process.env.LEARNING_SCREENSHOT_DIR}/learning-${chapter}-${viewport.width}.png` });
      }
      await learning.locator(`[${close}]`).click();
      await expect(learning).toBeHidden();
      await expect(trigger).toBeFocused();
    });
  }

  test(`learning drafts survive the four-chapter route at ${viewport.width}px and refresh resets them`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/#history');
    await page.locator('[data-history-learning-toggle]').click();
    const reason = '我希望汽车可以帮助更多的人安全地出行。';
    await page.locator('[data-history-reason]').fill(reason);
    await page.locator('[data-history-select-card="history-event-2001"]').click();
    await page.locator('[data-history-place="0"]').click();
    for (const chapter of ['explore', 'lidar', 'traffic', 'history']) await navigate(page, chapter);
    await expect(page.locator('[data-history-learning-panel]')).toBeVisible();
    await expect(page.locator('[data-history-reason]')).toHaveValue(reason);
    await expect(page.locator('[data-history-outcome]')).toHaveCount(0);
    await expect(page.locator('[data-history-order-card]').first()).toHaveAttribute('data-history-order-card', 'history-event-2001');
    await expect(page.locator('[data-chapter-total]')).toHaveText('04');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.reload();
    await expect(page.locator('[data-history-learning-panel]')).toBeHidden();
    await page.locator('[data-history-learning-toggle]').click();
    await expect(page.locator('[data-history-reason]')).toHaveValue('');
    await expect(page.locator('[data-history-outcome]')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

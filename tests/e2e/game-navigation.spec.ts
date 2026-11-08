import { expect, test, type Page } from '@playwright/test';

async function openMenu(page: Page) {
  const button = page.locator('[data-menu-button]');
  if ((await button.getAttribute('aria-expanded')) !== 'true') await button.click();
}

test('four accordion groups offer seven native destinations and preserve gallery routes', async ({
  page,
}) => {
  await page.goto('/index.html#history');
  const menu = page.locator('nav#chapter-menu');
  await expect(menu.locator('[data-chapter-group]')).toHaveCount(4);
  await expect(menu.locator('a')).toHaveCount(7);
  await expect(page.locator('[data-chapter-total]')).toHaveText('04');
  await openMenu(page);
  await expect(menu.locator('a[aria-current="page"]')).toHaveAttribute('data-navigation-item', 'history');
  await expect(menu.locator('[data-group-toggle="history"]')).toHaveAttribute('aria-expanded', 'true');
  await menu.locator('[data-group-toggle="lidar"]').click();
  await expect(page).toHaveURL(/index\.html#history$/);
  await menu.locator('a[data-navigation-item="lidar"]').click();
  await expect(page).toHaveURL(/index\.html#lidar$/);
  await expect(page.locator('[data-page="lidar"]')).toHaveClass(/is-active/);
  await page.goBack();
  await expect(page.locator('[data-page="history"]')).toHaveClass(/is-active/);
});

for (const [chapter, activity, path] of [
  ['history', 'topicgame', 'history'],
  ['explore', 'structuregame', 'structure'],
  ['lidar', 'sensorgame', 'sensor'],
] as const) {
  test(`${activity} navigates to its own document and refreshes without gallery/3D hosts`, async ({
    page,
  }) => {
    await page.goto(`/index.html#${chapter}`);
    await openMenu(page);
    await page.locator(`a[data-navigation-item="${activity}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/games/${path}/index\\.html$`));
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.reload();
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('[data-activity-host]')).toHaveCount(1);
    await expect(page.locator('[data-activity-host]')).toHaveAttribute('data-activity', activity);
    await expect(
      page.locator('[data-page], .model-viewer, [data-model-canvas], [data-lidar-canvas]'),
    ).toHaveCount(0);
    await openMenu(page);
    await expect(page.locator(`a[data-navigation-item="${activity}"]`)).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.locator(`[data-group-toggle="${chapter}"]`)).toHaveAttribute('aria-expanded', 'true');
    await page.waitForLoadState('networkidle');
    expect(requests.filter((url) => /three-|\.glb(?:\?|$)|\.dae(?:\?|$)/.test(url))).toEqual([]);
    await page.locator(`a[data-navigation-item="${chapter}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/index\\.html#${chapter}$`));
    await expect(page.locator(`[data-page="${chapter}"]`)).toHaveClass(/is-active/);
  });
}

test('mobile keyboard navigation hides collapsed links and returns focus on Escape', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/games/history/index.html');
  const menuButton = page.locator('[data-menu-button]');
  await menuButton.focus();
  await page.keyboard.press('Enter');
  const group = page.locator('[data-group-toggle="history"]');
  await group.focus();
  await page.keyboard.press('Space');
  await expect(group).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('a[data-navigation-item="topicgame"]')).toBeHidden();
  await page.keyboard.press('Enter');
  await expect(group).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Tab');
  await expect(page.locator('a[data-navigation-item="history"]')).toBeFocused();
  const link = page.locator('a[data-navigation-item="topicgame"]');
  expect(await link.evaluate((node) => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(
    18,
  );
  expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: testInfo.outputPath('mobile-chapter-menu.png') });
  await page.keyboard.press('Escape');
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  await expect(menuButton).toBeFocused();
  await expect(page.locator('nav#chapter-menu')).toBeHidden();
});

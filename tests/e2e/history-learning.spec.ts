import { expect, test, type Page } from '@playwright/test';

const orderedIds = [
  'history-event-2001',
  'history-event-2009',
  'history-event-2015',
  'history-event-2020',
  'history-event-2026',
];

async function openLearning(page: Page) {
  await page.goto('/#history');
  await page.locator('[data-history-learning-toggle]').click();
  await expect(page.locator('[data-history-learning-panel]')).toBeVisible();
}

async function orderWithButtons(page: Page) {
  for (const [index, cardId] of orderedIds.entries()) {
    await page.locator(`[data-history-select-card="${cardId}"]`).click();
    await page.locator(`[data-history-place="${index}"]`).click();
  }
  await page.locator('[data-history-submit-order]').click();
  await expect(page.locator('[data-history-order-feedback]')).toContainText('排好了');
}

async function finishMatch(page: Page) {
  for (const [questionId, choiceId] of [
    ['history-efficiency', 'history-efficiency:choice-1'],
    ['history-cleaner-energy', 'history-cleaner-energy:choice-2'],
    ['history-complex-road', 'history-complex-road:choice-3'],
  ]) {
    const question = page.locator(`[data-history-match-question="${questionId}"]`);
    await question.locator(`input[value="${choiceId}"]`).check();
    await question.locator('[data-history-submit-answer]').click();
    await expect(question.locator('[data-history-match-feedback]')).toBeVisible();
    await question.locator('[data-history-match-continue]').click();
  }
}

test('history learning opens its reading cards, closes with focus and keeps all exhibits', async ({
  page,
}) => {
  await openLearning(page);
  await expect(page.locator('[data-history-reading-card]')).toHaveCount(5);
  await expect(page.locator('[data-history-reading-heading]')).toBeFocused();
  await expect(page.locator('[data-archive-article]')).toHaveCount(14);
  await page.locator('[data-history-learning-close]').click();
  await expect(page.locator('[data-history-learning-panel]')).toBeHidden();
  await expect(page.locator('[data-history-learning-toggle]')).toBeFocused();
});

test('keyboard sorting and correction require submission and active continuation', async ({ page }) => {
  await openLearning(page);
  await page.locator('[data-history-submit-order]').click();
  await expect(page.locator('[data-history-order-feedback]')).toContainText('先看年份');
  for (const [index, cardId] of orderedIds.entries()) {
    await page.locator(`[data-history-select-card="${cardId}"]`).focus();
    await page.keyboard.press('Enter');
    await page.locator(`[data-history-place="${index}"]`).focus();
    await page.keyboard.press('Enter');
  }
  await page.locator('[data-history-submit-order]').click();
  await expect(page.locator('[data-history-order-feedback]')).toContainText('排好了');
  const first = page.locator('[data-history-match-question="history-efficiency"]');
  await first.locator('input[value="history-efficiency:choice-2"]').check();
  await first.locator('[data-history-submit-answer]').click();
  await expect(first.locator('[data-history-match-feedback]')).toContainText('制造汽车');
  await expect(first.locator('[data-history-match-continue]')).toBeDisabled();
  await first.locator('input[value="history-efficiency:choice-1"]').check();
  await first.locator('[data-history-submit-answer]').click();
  await page.waitForTimeout(1500);
  await expect(first).toBeVisible();
  await expect(page.locator('[data-history-outcome]')).toHaveCount(0);
  await first.locator('[data-history-match-continue]').click();
  await expect(page.locator('[data-history-match-question="history-cleaner-energy"]')).toBeVisible();
});

test('touch-sized position controls complete the card and escaped reasons stay text', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openLearning(page);
  await orderWithButtons(page);
  await finishMatch(page);
  await page.locator('input[value="future-accessibility"]').check();
  const raw = '<img src=x onerror=alert(1)>';
  await page.locator('[data-history-reason]').fill(raw);
  await page.locator('[data-history-submit-future]').click();
  await expect(page.locator('[data-history-outcome]')).toBeVisible();
  await expect(page.locator('[data-history-outcome-reason]')).toHaveText(raw);
  await expect(page.locator('[data-history-outcome] img')).toHaveCount(0);
  await page.locator('[data-history-reason]').fill(`${raw}汽车`);
  await expect(page.locator('[data-history-outcome]')).toHaveCount(0);
  await page.locator('[data-history-submit-future]').click();
  await expect(page.locator('[data-history-outcome]')).toBeVisible();
  await page.locator('[data-history-select-card="history-event-2001"]').click();
  await page.locator('[data-history-place="4"]').click();
  await expect(page.locator('[data-history-outcome]')).toHaveCount(0);
});

test('drafts survive chapter changes, refresh clears them and reset leaves exhibit selection alone', async ({
  page,
}) => {
  await openLearning(page);
  await page.locator('[data-history-reason]').fill('我希望让大家都能方便地乘车。');
  await page.locator('[data-history-select-card="history-event-2001"]').click();
  await page.locator('[data-history-place="0"]').click();
  await page.evaluate(() => {
    location.hash = '#explore';
  });
  await expect(page.locator('#explore')).toHaveClass(/is-active/);
  await page.evaluate(() => {
    location.hash = '#history';
  });
  await expect(page.locator('[data-history-learning-panel]')).toBeVisible();
  await expect(page.locator('[data-history-reason]')).toHaveValue('我希望让大家都能方便地乘车。');
  await expect(page.locator('[data-history-order-card]').first()).toHaveAttribute(
    'data-history-order-card',
    'history-event-2001',
  );
  await page.locator('[data-timeline-target]').last().click();
  const target = await page
    .locator('[data-timeline-target].is-selected')
    .getAttribute('data-timeline-target');
  await page.locator('[data-history-reset]').click();
  await expect(page.locator('[data-timeline-target].is-selected')).toHaveAttribute(
    'data-timeline-target',
    target!,
  );
  await expect(page.locator('[data-history-reason]')).toHaveValue('');
  await page.locator('[data-history-reason]').fill('刷新后这段草稿应该重新开始。');
  await page.reload();
  await expect(page.locator('[data-history-learning-panel]')).toBeHidden();
  await page.locator('[data-history-learning-toggle]').click();
  await expect(page.locator('[data-history-reason]')).toHaveValue('');
});

test('composition input cannot submit early and unknown IDs or repeated clicks cannot skip work', async ({
  page,
}) => {
  await openLearning(page);
  await page.locator('input[value="future-safety"]').check();
  const reason = page.locator('[data-history-reason]');
  await reason.fill('我希望汽车提前发现学校附近的行人。');
  await reason.dispatchEvent('compositionstart');
  await page.locator('[data-history-submit-future]').click();
  await expect(page.locator('[data-history-future-feedback]')).not.toContainText('你的理由已写好');
  await reason.dispatchEvent('compositionend');
  await page.locator('[data-history-submit-future]').click();
  await expect(page.locator('[data-history-future-feedback]')).toContainText('你的理由已写好');
  await page.evaluate(() => {
    const select = document.querySelector<HTMLButtonElement>('[data-history-select-card]')!;
    select.dataset.historySelectCard = 'missing';
    select.click();
    const submit = document.querySelector<HTMLButtonElement>('[data-history-submit-order]')!;
    submit.click();
    submit.click();
    const next = document.querySelector<HTMLButtonElement>('[data-history-match-continue]')!;
    next.disabled = false;
    next.click();
    next.click();
  });
  await expect(page.locator('[data-history-match-question="history-efficiency"]')).toBeVisible();
  await expect(page.locator('[data-history-outcome]')).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
  await expect(page.locator('[data-history-learning-panel]')).toBeHidden();
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>('[data-history-learning-toggle]')!.click();
    document.querySelector<HTMLButtonElement>('[data-history-reset]')!.click();
  });
  await expect(page.locator('[data-history-learning-panel]')).toBeHidden();
  await expect(page.locator('[data-history-reason]')).toHaveValue('');
});

test('a persisted page exit clears new drafts/results while retaining original exhibit selection', async ({
  page,
}) => {
  await openLearning(page);
  await orderWithButtons(page);
  await finishMatch(page);
  await page.locator('input[value="future-safety"]').check();
  await page.locator('[data-history-reason]').fill('我希望汽车提前发现学校附近的行人。');
  await page.locator('[data-history-submit-future]').click();
  await expect(page.locator('[data-history-outcome]')).toBeVisible();
  await page.locator('[data-timeline-target]').last().click();
  const exhibit = await page
    .locator('[data-timeline-target].is-selected')
    .getAttribute('data-timeline-target');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  await expect(page.locator('[data-history-learning-panel]')).toBeHidden();
  await expect(page.locator('[data-history-learning-toggle]')).toHaveAttribute('aria-expanded', 'false');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await page.locator('[data-history-learning-toggle]').click();
  await expect(page.locator('[data-history-reason]')).toHaveValue('');
  await expect(page.locator('[data-history-future-form] input:checked')).toHaveCount(0);
  await expect(page.locator('[data-history-outcome]')).toHaveCount(0);
  await expect(page.locator('[data-history-learning-progress]')).toContainText('0/3');
  await expect(page.locator('[data-history-match-question="history-efficiency"]')).toBeVisible();
  await expect(page.locator('[data-history-match-question] input:checked')).toHaveCount(0);
  await expect(page.locator('[data-history-order-card]').first()).toHaveAttribute(
    'data-history-order-card',
    'history-event-2020',
  );
  await expect(page.locator('[data-history-place="0"]')).toBeDisabled();
  await expect(page.locator('[data-timeline-target].is-selected')).toHaveAttribute(
    'data-timeline-target',
    exhibit!,
  );
  await expect(page.locator('[data-archive-article]')).toHaveCount(14);

  // A fresh draft after restoring the cached controller still survives normal chapter navigation.
  await page.locator('[data-history-reason]').fill('普通切章后仍然保留新的学习草稿。');
  await page.locator('[data-history-select-card="history-event-2001"]').click();
  await page.locator('[data-history-place="0"]').click();
  await page.evaluate(() => {
    location.hash = '#explore';
  });
  await expect(page.locator('#explore')).toHaveClass(/is-active/);
  await page.evaluate(() => {
    location.hash = '#history';
  });
  await expect(page.locator('[data-history-learning-panel]')).toBeVisible();
  await expect(page.locator('[data-history-reason]')).toHaveValue('普通切章后仍然保留新的学习草稿。');
  await expect(page.locator('[data-history-order-card]').first()).toHaveAttribute(
    'data-history-order-card',
    'history-event-2001',
  );
});

test('real mouse dragging moves authored event cards and still requires confirmation', async ({ page }) => {
  await openLearning(page);
  await page
    .locator('[data-history-order-card="history-event-2001"]')
    .dragTo(page.locator('[data-history-order-card="history-event-2020"]'), {
      sourcePosition: { x: 8, y: 8 },
      targetPosition: { x: 8, y: 8 },
    });
  await expect(page.locator('[data-history-order-card]').first()).toHaveAttribute(
    'data-history-order-card',
    'history-event-2001',
  );
  await expect(page.locator('[data-history-order-feedback]')).toContainText('排好后');
  await page.locator('[data-history-submit-order]').click();
  await expect(page.locator('[data-history-order-feedback]')).toContainText('先看年份');
  await expect(page.locator('[data-history-outcome]')).toHaveCount(0);
});

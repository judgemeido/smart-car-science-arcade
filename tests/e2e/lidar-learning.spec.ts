import { test, expect, type Page } from '@playwright/test';
import type * as THREE from 'three';

type LidarCameraObservation = {
  position: number[];
  target: number[];
  matrix: number[];
  near: number;
  far: number;
  zoom: number;
};

async function observeLearningWorld(page: Page) {
  await page.addInitScript(() => {
    const devtools = new EventTarget();
    Object.assign(window, { __THREE_DEVTOOLS__: devtools });
    let observedCamera: THREE.Camera | undefined;
    let orbitTarget: number[] | undefined;
    const readCamera = (): LidarCameraObservation | undefined => {
      if (!observedCamera || !orbitTarget) return;
      const camera = observedCamera as THREE.PerspectiveCamera;
      return {
        position: camera.position.toArray(),
        target: [...orbitTarget],
        matrix: [...camera.matrixWorldInverse.elements],
        near: camera.near,
        far: camera.far,
        zoom: camera.zoom,
      };
    };
    document.addEventListener(
      'click',
      (event) => {
        if (
          (event.target as Element).closest(
            '[data-lidar-learning-tab]:not([data-lidar-learning-tab="guide"])',
          )
        )
          Object.assign(window, { __lidarEntry: readCamera(), __lidarExit: undefined });
      },
      true,
    );
    document.addEventListener('click', (event) => {
      if ((event.target as Element).closest('[data-lidar-learning-close], [data-lidar-learning-tab="guide"]'))
        Object.assign(window, { __lidarExit: readCamera() });
    });
    devtools.addEventListener('observe', (event) => {
      const renderer = (event as CustomEvent).detail as THREE.WebGLRenderer;
      if (!renderer.domElement?.matches('[data-lidar-canvas]')) return;
      const render = renderer.render;
      renderer.render = function (scene, camera) {
        if (observedCamera !== camera) {
          observedCamera = camera;
          const lookAt = camera.lookAt;
          camera.lookAt = function (x: THREE.Vector3 | number, y?: number, z?: number) {
            orbitTarget = typeof x === 'number' ? [x, y!, z!] : x.toArray();
            return lookAt.call(this, orbitTarget[0], orbitTarget[1], orbitTarget[2]);
          };
        }
        render.call(this, scene, camera);
        (window as unknown as { __lidarCameraSnapshot: unknown }).__lidarCameraSnapshot = readCamera();
        const root = scene.getObjectByName('LIDAR_LEARNING_WORLD');
        if (!root?.visible) return;
        (window as unknown as { __lidarLearningSnapshot: unknown }).__lidarLearningSnapshot = {
          positions: ['world-car', 'world-person', 'world-tree', 'world-obstacle'].map((id) =>
            root.getObjectByName(id)?.position.toArray(),
          ),
          sweep: root.getObjectByName('LEARNING_SWEEP')?.rotation.y,
        };
      };
    });
  });
}

const snapshot = (page: Page) =>
  page.evaluate(
    () =>
      (window as unknown as { __lidarLearningSnapshot?: { positions: number[][]; sweep: number } })
        .__lidarLearningSnapshot,
  );

const cameraSnapshot = (page: Page, boundary?: 'entry' | 'exit') =>
  page.evaluate((boundary) => {
    const probe = window as unknown as {
      __lidarCameraSnapshot?: LidarCameraObservation;
      __lidarEntry?: LidarCameraObservation;
      __lidarExit?: LidarCameraObservation;
    };
    return boundary === 'entry'
      ? probe.__lidarEntry
      : boundary === 'exit'
        ? probe.__lidarExit
        : probe.__lidarCameraSnapshot;
  }, boundary);

async function openLearning(page: Page) {
  await page.goto('/#lidar');
  await expect(page.locator('[data-page="lidar"]')).toHaveAttribute('data-status', 'ready');
  await page.locator('[data-lidar-learning-toggle]').click();
}
async function distance(page: Page, meters: number) {
  await page.locator('[data-lidar-distance]').evaluate((element: HTMLInputElement, value) => {
    element.value = String(value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, meters);
}

for (const tab of ['world', 'distance', 'weather'] as const) {
  for (const exit of ['close', 'guide'] as const) {
    test(`${tab} teaching camera clears rotate and pan inertia on ${exit}`, async ({ page }) => {
      await observeLearningWorld(page);
      await openLearning(page);
      await expect(page.locator('[data-page="lidar"]')).toHaveAttribute('data-asset-status', 'ready', {
        timeout: 30000,
      });
      await page.locator(`[data-lidar-learning-tab="${tab}"]`).click();
      const original = (await cameraSnapshot(page, 'entry'))!;
      const rect = (await page.locator('[data-lidar-canvas]').boundingBox())!;
      const start = { x: rect.x + rect.width * 0.6, y: rect.y + rect.height * 0.65 };
      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(start.x + rect.width * 0.15, start.y + rect.height * 0.08, { steps: 2 });
      await page.mouse.up();
      await page.mouse.move(start.x, start.y);
      await page.mouse.down({ button: 'right' });
      await page.mouse.move(start.x + rect.width * 0.08, start.y + rect.height * 0.035, { steps: 2 });
      await page.mouse.up({ button: 'right' });
      const teaching = (await cameraSnapshot(page))!;
      expect(
        Math.hypot(...teaching.target.map((value, index) => value - [0, 0, -0.35][index])),
      ).toBeGreaterThan(0.01);
      await page
        .locator(exit === 'close' ? '[data-lidar-learning-close]' : '[data-lidar-learning-tab="guide"]')
        .click();
      const restored = (await cameraSnapshot(page, 'exit'))!;
      for (let index = 0; index < 16; index++)
        expect(restored.matrix[index]).toBeCloseTo(original.matrix[index], 10);
      for (let index = 0; index < 3; index++)
        expect(restored.target[index]).toBeCloseTo(original.target[index], 10);
      expect(restored.near).toBe(original.near);
      expect(restored.far).toBe(original.far);
      expect(restored.zoom).toBe(original.zoom);
      // Sample every ensuing frame, rather than waiting only for a settled view.
      const frames = await page.evaluate(async () => {
        const snapshots: LidarCameraObservation[] = [];
        for (let frame = 0; frame < 121; frame++) {
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
          snapshots.push(
            (window as unknown as { __lidarCameraSnapshot: LidarCameraObservation }).__lidarCameraSnapshot,
          );
        }
        return snapshots;
      });
      for (const current of frames) {
        for (let index = 0; index < 16; index++)
          expect(current.matrix[index]).toBeCloseTo(original.matrix[index], 10);
        for (let index = 0; index < 3; index++)
          expect(current.target[index]).toBeCloseTo(original.target[index], 10);
      }
      await expect(page.locator('[data-lidar-world-target-list]')).toBeHidden();
    });
  }
}

test('guide and six sensor cards retain the principle measurements and GNSS limitation', async ({ page }) => {
  await openLearning(page);
  await page.locator('[data-lidar-learning-guide] > summary').click();
  await expect(page.locator('[data-lidar-learning-guide]')).toContainText('往返');
  await distance(page, 20);
  await expect(page.locator('[data-lidar-time]').first()).toHaveText('约 133.4 ns');
  await distance(page, 60);
  await expect(page.locator('[data-lidar-time]').first()).toHaveText('约 400.3 ns');
  await page.locator('[data-lidar-reset]').click();
  await expect(page.locator('[data-lidar-distance]')).toHaveValue('60');
  await page.locator('.lidar-learning__sensors summary').click();
  await page.locator('[data-lidar-sensor="sensor-gnss"]').click();
  await expect(page.locator('[data-lidar-sensor-card]')).toContainText('车辆的位置');
  await expect(page.locator('[data-lidar-sensor-card]')).toContainText('不能识别行人');
});

test('three rounds reveal distances only after submission and require correct answers plus continue', async ({
  page,
}) => {
  await openLearning(page);
  await page.locator('[data-lidar-learning-tab="distance"]').click();
  await expect(page.locator('[data-lidar-distance-activity]')).not.toContainText(
    /5\.0\s*米|12\.0\s*米|20\.0\s*米/,
  );
  await expect(page.locator('[data-lidar-learning-submit]')).toBeDisabled();
  await page.locator('[data-lidar-target="lidar-distance-round-1-target-b"]').click();
  await page.locator('[data-lidar-range-choice="range-10-to-20"]').click();
  await page.locator('[data-lidar-learning-submit]').click();
  await expect(page.locator('[data-lidar-distance-result]')).toContainText('5.0 米');
  await expect(page.locator('[data-lidar-learning-continue]')).toBeDisabled();
  for (const [round, target, range] of [
    [1, 'a', 'range-under-10'],
    [2, 'b', 'range-under-10'],
    [3, 'c', 'range-10-to-20'],
  ] as const) {
    await page.locator(`[data-lidar-target="lidar-distance-round-${round}-target-${target}"]`).click();
    await page.locator(`[data-lidar-range-choice="${range}"]`).click();
    await page.locator('[data-lidar-learning-submit]').click();
    await expect(page.locator('[data-lidar-distance-result]')).toContainText('都找对了');
    await page.locator('[data-lidar-learning-continue]').click();
  }
  await expect(page.locator('[data-lidar-distance-activity]')).toContainText('三轮已完成');
  await expect(page.locator('[data-lidar-learning-record]')).toContainText('3 / 3');
  await page.locator('[data-lidar-distance-reset]').click();
  await expect(page.locator('[data-lidar-distance-activity]')).toContainText('第 1 / 3 轮');
});

test('weather explains a fixed scene and records answers independently of toggles', async ({ page }) => {
  await observeLearningWorld(page);
  await openLearning(page);
  await page.locator('[data-lidar-learning-tab="weather"]').click();
  await expect.poll(async () => (await snapshot(page))?.positions[0]).toEqual([-6, 0, -14]);
  const positions = (await snapshot(page))!.positions;
  for (const weather of ['normal', 'rain', 'fog']) {
    await page.locator(`[data-lidar-weather="${weather}"]`).click();
    await expect(page.locator('[data-lidar-weather-copy]')).not.toBeEmpty();
    await expect(page.locator('[data-lidar-weather-activity]')).not.toContainText(/识别率|\d+%/);
    await expect(page.locator('[data-lidar-learning-record]')).toContainText('0 / 3');
    await expect.poll(async () => (await snapshot(page))?.positions).toEqual(positions);
  }
  const answers = [
    ['lidar-weather-effect', 'choice-1'],
    ['lidar-uncertain-action', 'choice-2'],
    ['lidar-sensor-team', 'choice-3'],
  ];
  for (const [question, choice] of answers) {
    await page.locator(`[data-lidar-weather-choice="${question}:${choice}"]`).click();
    await expect(page.locator('[data-lidar-weather-feedback]')).not.toBeEmpty();
    await page.locator('[data-lidar-weather-continue]').click();
  }
  await expect(page.locator('[data-lidar-learning-record]')).toContainText('3 / 3');
  await expect(page.locator('[data-lidar-learning-record]')).toContainText('安全条件');
  await page.locator('[data-lidar-weather-reset]').click();
  await expect(page.locator('[data-lidar-weather="normal"]')).toHaveAttribute('aria-pressed', 'true');
});

test('new scan pauses, rotates, suspends in the background, and restores the original scan', async ({
  page,
}) => {
  await observeLearningWorld(page);
  await page.goto('/#lidar');
  await expect(page.locator('[data-page="lidar"]')).toHaveAttribute('data-status', 'ready');
  await page.locator('[data-lidar-step="2"]').click();
  await page.locator('[data-lidar-learning-toggle]').click();
  await page.locator('[data-lidar-learning-tab="world"]').click();
  await expect.poll(async () => (await snapshot(page))?.sweep).toBeDefined();
  await page.locator('[data-lidar-learning-scan]').click();
  const stopped = (await snapshot(page))!.sweep;
  await page.waitForTimeout(150);
  expect((await snapshot(page))!.sweep).toBe(stopped);
  const rect = (await page.locator('[data-lidar-canvas]').boundingBox())!;
  await page.mouse.move(rect.x + rect.width * 0.6, rect.y + rect.height * 0.65);
  await page.mouse.down();
  await page.mouse.move(rect.x + rect.width * 0.75, rect.y + rect.height * 0.72, { steps: 6 });
  await page.mouse.up();
  await expect(page.locator('[data-lidar-world-target-list]')).toBeVisible();
  await page.locator('[data-lidar-learning-scan]').click();
  await expect.poll(async () => (await snapshot(page))!.sweep).toBeGreaterThan(stopped);
  await page.evaluate(() => {
    window.location.hash = 'history';
  });
  await expect(page.locator('[data-page="history"]')).toHaveClass(/is-active/);
  const background = (await snapshot(page))!.sweep;
  await page.waitForTimeout(150);
  expect((await snapshot(page))!.sweep).toBe(background);
  await page.evaluate(() => {
    window.location.hash = 'lidar';
  });
  await expect(page.locator('[data-page="lidar"]')).toHaveClass(/is-active/);
  await expect.poll(async () => (await snapshot(page))!.sweep).toBeGreaterThan(background);
  await page.locator('[data-lidar-learning-close]').click();
  await expect(page.locator('[data-lidar-scan-toggle]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-lidar-step="2"]')).toHaveAttribute('aria-pressed', 'true');
});

test('chapter changes preserve learning and model failure leaves geometry activities usable', async ({
  page,
}) => {
  await page.route('**/assets/lidar/*.dae', (route) => route.abort());
  await openLearning(page);
  await expect(page.locator('[data-page="lidar"]')).toHaveAttribute('data-asset-status', 'degraded');
  await page.locator('[data-lidar-learning-tab="world"]').click();
  await expect(page.locator('[data-lidar-world-target-list]')).toContainText('汽车');
  await expect(page.locator('[data-lidar-world-target-list]')).toContainText('路障');
  await page.locator('[data-lidar-learning-scan]').click();
  await expect(page.locator('[data-lidar-learning-scan]')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('[data-lidar-learning-tab="distance"]').click();
  await page.locator('[data-lidar-target="lidar-distance-round-1-target-a"]').click();
  await page.evaluate(() => {
    window.location.hash = 'history';
  });
  await expect(page.locator('[data-page="history"]')).toHaveClass(/is-active/);
  await page.evaluate(() => {
    window.location.hash = 'lidar';
  });
  await expect(page.locator('[data-page="lidar"]')).toHaveClass(/is-active/);
  await expect(page.locator('[data-lidar-target="lidar-distance-round-1-target-a"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.locator('[data-lidar-learning-close]').click();
  await expect(page.locator('[data-lidar-learning]')).toBeHidden();
  await expect(page.locator('[data-lidar-mode="assembly"]')).toBeVisible();
});

test('page exit resets new activities even when the page is restored from BFCache', async ({ page }) => {
  await openLearning(page);
  await distance(page, 60);
  await page.locator('[data-lidar-learning-tab="distance"]').click();
  await page.locator('[data-lidar-target="lidar-distance-round-1-target-a"]').click();
  await page.locator('[data-lidar-range-choice="range-under-10"]').click();
  await page.locator('[data-lidar-learning-submit]').click();
  await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
  });
  await expect(page.locator('[data-lidar-learning]')).toBeHidden();
  await expect(page.locator('[data-lidar-distance]')).toHaveValue('60');
  await page.locator('[data-lidar-learning-toggle]').click();
  await page.locator('[data-lidar-learning-tab="distance"]').click();
  await expect(page.locator('[data-lidar-distance-activity]')).toContainText('第 1 / 3 轮');
  await expect(page.locator('[data-lidar-learning-submit]')).toBeDisabled();
  await expect(page.locator('[data-lidar-learning-record]')).toContainText('0 / 3');
});

test('distance selection and correction can be completed by keyboard', async ({ page }) => {
  await openLearning(page);
  await page.locator('[data-lidar-learning-tab="distance"]').click();
  const target = page.locator('[data-lidar-target="lidar-distance-round-1-target-a"]');
  await target.focus();
  await page.keyboard.press('Enter');
  await expect(target).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-lidar-range-choice="range-under-10"]').focus();
  await page.keyboard.press('Space');
  await page.locator('[data-lidar-learning-submit]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-lidar-distance-result]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-lidar-learning-continue]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-lidar-target="lidar-distance-round-2-target-a"]')).toBeFocused();
});

for (const tab of ['world', 'distance', 'weather']) {
  test(`delayed successful model loading preserves the ${tab} camera and fits the original view for exit`, async ({
    page,
  }) => {
    await observeLearningWorld(page);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/assets/lidar/*.dae', async (route) => {
      await gate;
      await route.continue();
    });
    try {
      await page.goto('/#lidar');
      await expect(page.locator('[data-page="lidar"]')).toHaveAttribute('data-status', 'ready');
      await expect.poll(async () => (await cameraSnapshot(page))?.matrix.length).toBe(16);
      const beforeLoad = (await cameraSnapshot(page))!;
      await distance(page, 60);
      await page.locator('[data-lidar-learning-toggle]').click();
      await page.locator(`[data-lidar-learning-tab="${tab}"]`).click();
      await expect
        .poll(async () =>
          (await cameraSnapshot(page))?.position.every(
            (value, index) => Math.abs(value - [3.5, 3.8, 4.7][index]) < 1e-8,
          ),
        )
        .toBe(true);
      const teaching = (await cameraSnapshot(page))!;
      release();
      await expect(page.locator('[data-page="lidar"]')).toHaveAttribute('data-asset-status', 'ready', {
        timeout: 30000,
      });
      await expect
        .poll(async () => {
          const current = (await cameraSnapshot(page))!;
          return (
            current.matrix.every((value, index) => Math.abs(value - teaching.matrix[index]) < 1e-8) &&
            current.near === teaching.near &&
            current.far === teaching.far &&
            current.zoom === teaching.zoom
          );
        })
        .toBe(true);
      await page.locator('[data-lidar-learning-close]').click();
      await expect(page.locator('[data-lidar-distance]')).toHaveValue('60');
      await expect.poll(async () => (await cameraSnapshot(page))?.position).not.toEqual(teaching.position);
      const fitted = (await cameraSnapshot(page))!;
      expect(fitted.position).not.toEqual(beforeLoad.position);
      expect(fitted.near).not.toBe(teaching.near);
      expect(fitted.far).not.toBe(teaching.far);
      await page.locator('[data-lidar-reset]').click();
      await expect
        .poll(async () =>
          (await cameraSnapshot(page))?.matrix.every(
            (value, index) => Math.abs(value - fitted.matrix[index]) < 1e-8,
          ),
        )
        .toBe(true);
      await expect(page.locator('[data-lidar-distance]')).toHaveValue('60');
    } finally {
      release();
    }
  });
}

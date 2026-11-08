import { expect, test, type Page } from '@playwright/test';
import type * as THREE from 'three';
import { exploreLearningTasks, exploreReviewQuestions } from '../../src/chapters/explore/learning-data';
import { exploreLearningTargets } from '../../src/chapters/explore/learning-targets';

type CameraObservation = { matrix: number[]; target: number[]; position: number[] };
type ExploreProbe = {
  scene?: THREE.Scene;
  camera?: THREE.Camera;
  orbitTarget?: number[];
  entry?: CameraObservation;
  exit?: CameraObservation;
};

// Three's existing devtools observation exposes the real renderer for test inspection.
// The application receives real mouse clicks; no mission state or hit results are replaced.
async function observeExplore(page: Page) {
  await page.addInitScript(() => {
    const probe: ExploreProbe = {};
    const devtools = new EventTarget();
    Object.assign(window, { __THREE_DEVTOOLS__: devtools, __exploreProbe: probe });
    const read = (): CameraObservation | undefined => {
      if (!probe.camera || !probe.orbitTarget) return;
      return {
        matrix: [...probe.camera.matrixWorld.elements],
        target: [...probe.orbitTarget],
        position: probe.camera.position.toArray(),
      };
    };
    // Capture immediately before the delegated controller saves the real pose,
    // and after it restores it. No RAF can run between these synchronous handlers.
    // Earlier samples can still damp; later samples may legitimately auto-rotate
    // after the original controls' 2500 ms inactivity timer.
    document.addEventListener(
      'click',
      (event) => {
        if ((event.target as Element).closest('[data-learning-start], [data-assembly-open]')) {
          probe.entry = read();
          probe.exit = undefined;
        }
      },
      true,
    );
    document.addEventListener('click', (event) => {
      if ((event.target as Element).closest('[data-learning-cancel], [data-assembly-cancel]'))
        probe.exit = read();
    });
    devtools.addEventListener('observe', (event) => {
      const renderer = (event as CustomEvent).detail as THREE.WebGLRenderer;
      if (renderer.domElement?.id !== 'model-canvas') return;
      const render = renderer.render;
      renderer.render = function (scene, camera) {
        if (probe.camera !== camera) {
          const lookAt = camera.lookAt;
          camera.lookAt = function (x: THREE.Vector3 | number, y?: number, z?: number) {
            probe.orbitTarget = typeof x === 'number' ? [x, y!, z!] : x.toArray();
            const target = probe.orbitTarget;
            return lookAt.call(this, target[0], target[1], target[2]);
          };
        }
        probe.scene = scene as THREE.Scene;
        probe.camera = camera;
        return render.call(this, scene, camera);
      };
    });
  });
}

async function cameraObservation(page: Page, boundary?: 'entry' | 'exit') {
  return page.evaluate((boundary) => {
    const probe = (window as unknown as { __exploreProbe: ExploreProbe }).__exploreProbe;
    if (boundary) {
      const observation = probe[boundary];
      if (!observation) throw new Error(`Missing native ${boundary} camera observation`);
      return observation;
    }
    if (!probe.camera || !probe.orbitTarget) throw new Error('Missing observed camera/OrbitControls target');
    return {
      matrix: [...probe.camera.matrixWorld.elements],
      target: [...probe.orbitTarget],
      position: probe.camera.position.toArray(),
    };
  }, boundary);
}

for (const timing of ['pending damping', 'resumed auto-rotation'] as const) {
  test(`02 cancel restores the actual custom camera and orbit target for challenge and assembly with ${timing}`, async ({
    page,
  }) => {
    await openExplore(page);
    await page.locator('[data-explode-toggle]').click();
    const original = await cameraObservation(page);
    const canvas = page.locator('#model-canvas');
    const rect = (await canvas.boundingBox())!;
    const start = { x: rect.x + rect.width * 0.5, y: rect.y + rect.height * 0.5 };
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + rect.width * 0.16, start.y + rect.height * 0.08, { steps: 12 });
    await page.mouse.up();
    await page.mouse.move(start.x, start.y);
    await page.mouse.down({ button: 'right' });
    await page.mouse.move(start.x + rect.width * 0.05, start.y + rect.height * 0.035, { steps: 8 });
    await page.mouse.up({ button: 'right' });
    await page.mouse.wheel(0, -240);
    if (timing === 'resumed auto-rotation') {
      // Exercise the original 2500 ms inactivity timer as well as unsettled input.
      await page.waitForTimeout(2700);
      const rotating = await cameraObservation(page);
      await expect
        .poll(async () => {
          const current = await cameraObservation(page);
          return Math.hypot(...current.position.map((value, index) => value - rotating.position[index]));
        })
        .toBeGreaterThan(0.01);
    }
    for (const mode of ['learning', 'assembly'] as const) {
      await page.locator(mode === 'learning' ? '[data-learning-start]' : '[data-assembly-open]').click();
      const before = await cameraObservation(page, 'entry');
      if (mode === 'learning') {
        expect(
          Math.hypot(...before.position.map((value, index) => value - original.position[index])),
        ).toBeGreaterThan(0.1);
        expect(
          Math.hypot(...before.target.map((value, index) => value - original.target[index])),
        ).toBeGreaterThan(0.01);
      }
      if (mode === 'learning') await page.locator('[data-learning-frame]').click();
      else {
        await page.locator('[data-assembly-next]').click();
        await page.waitForTimeout(250);
      }
      await page.locator(mode === 'learning' ? '[data-learning-cancel]' : '[data-assembly-cancel]').click();
      await expect(
        page.locator(mode === 'learning' ? '[data-learning-start]' : '[data-assembly-open]'),
      ).toBeFocused();
      const after = await cameraObservation(page, 'exit');
      for (let index = 0; index < 16; index++)
        expect(after.matrix[index]).toBeCloseTo(before.matrix[index], 10);
      for (let index = 0; index < 3; index++)
        expect(after.target[index]).toBeCloseTo(before.target[index], 10);
      await expect(page.locator('[data-explode-toggle]')).toHaveAttribute('aria-pressed', 'true');
    }
  });
}

async function openExplore(page: Page) {
  await observeExplore(page);
  await page.goto('/#explore');
  await expect(page.locator('[data-model-loading]')).toHaveClass(/is-complete/, { timeout: 30000 });
  if ((await page.locator('[data-powerflow-story]').getAttribute('aria-hidden')) === 'false') {
    await page.locator('[data-powerflow-skip]').click();
  }
  await expect(page.locator('[data-powerflow-replay]')).toHaveAttribute('aria-hidden', 'false');
}

async function navigate(page: Page, chapter: string) {
  if (await page.locator('[data-menu-button]').isVisible()) await page.locator('[data-menu-button]').click();
  await page.locator(`[data-go="${chapter}"]`).click();
  await expect(page.locator(`[data-page="${chapter}"]`)).toHaveClass(/is-active/);
}

async function pickAssembly(page: Page, assemblyName: string, learningTarget = false) {
  const popup = page.locator('[data-part-popup]');
  if ((await popup.getAttribute('aria-hidden')) === 'false') {
    await page.locator('[data-part-popup-close]').click();
  }
  const focus = { BatteryPack: 'battery', ADAS: 'adas', Cabin: 'cabin' }[assemblyName];
  if (focus && !learningTarget) await page.locator(`[data-focus="${focus}"]`).click();
  const point = await page.evaluate(
    async ({ name, learningTarget }) => {
      const probe = (window as unknown as { __exploreProbe: ExploreProbe }).__exploreProbe;
      const canvas = document.querySelector<HTMLCanvasElement>('#model-canvas')!;
      const rect = canvas.getBoundingClientRect();
      const assemblyRoot = probe.scene?.getObjectByName('EV_SUV');
      const target = assemblyRoot?.getObjectByName(name);
      if (!assemblyRoot || !target || !probe.camera) throw new Error(`Missing real model target ${name}`);
      const coreUrl = performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .find((url) => /\/three-core-[^/]+\.js/.test(url));
      if (!coreUrl) throw new Error('Missing loaded Three core chunk');
      const core = await import(/* @vite-ignore */ coreUrl);
      const Raycaster = Object.values(core).find(
        (value) =>
          typeof value === 'function' && value.prototype?.setFromCamera && value.prototype?.intersectObject,
      ) as typeof THREE.Raycaster;
      if (!Raycaster) throw new Error('Missing real Three raycaster');
      const Vector2 = Object.values(core).find(
        (value) => typeof value === 'function' && value.prototype?.rotateAround,
      ) as typeof THREE.Vector2;
      if (!Vector2) throw new Error('Missing real Three vector');
      const raycaster = new Raycaster();
      const diagnostic = {
        camera: probe.camera.position.toArray(),
        viewport: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        meshes: 0,
        sampled: 0,
        outside: 0,
        noHit: 0,
        matching: 0,
        blockedByDom: 0,
        occluders: {} as Record<string, number>,
      };
      const meshes: THREE.Mesh[] = [];
      target.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) meshes.push(object as THREE.Mesh);
      });
      diagnostic.meshes = meshes.length;
      assemblyRoot.updateMatrixWorld(true);
      for (const mesh of meshes) {
        const positions = mesh.geometry.getAttribute('position');
        const indices = mesh.geometry.index;
        const count = indices?.count ?? positions.count;
        const stride = Math.max(3, Math.floor(count / 120 / 3) * 3);
        for (let index = 0; index + 2 < count; index += stride) {
          const center = mesh.position.clone().set(0, 0, 0);
          for (let vertex = 0; vertex < 3; vertex += 1) {
            const positionIndex = indices ? indices.getX(index + vertex) : index + vertex;
            center.add(mesh.position.clone().fromBufferAttribute(positions, positionIndex));
          }
          center.divideScalar(3).applyMatrix4(mesh.matrixWorld).project(probe.camera);
          diagnostic.sampled++;
          if (Math.abs(center.x) > 0.96 || Math.abs(center.y) > 0.96 || Math.abs(center.z) > 1) {
            diagnostic.outside++;
            continue;
          }
          raycaster.setFromCamera(new Vector2(center.x, center.y), probe.camera);
          const hit: THREE.Intersection | undefined = raycaster
            .intersectObject(assemblyRoot, true)
            .find((item) => (item.object as THREE.Mesh).isMesh);
          if (!hit) {
            diagnostic.noHit++;
            continue;
          }
          let hitAssembly: THREE.Object3D = hit.object;
          while (hitAssembly.parent && hitAssembly.parent !== assemblyRoot) hitAssembly = hitAssembly.parent;
          if (learningTarget) {
            let node: THREE.Object3D | null = hit.object;
            let matches = false;
            while (node) {
              if (node.name === name) matches = true;
              if (node === assemblyRoot) break;
              node = node.parent;
            }
            if (!matches) {
              const name = hit.object.name;
              diagnostic.occluders[name] = (diagnostic.occluders[name] ?? 0) + 1;
              continue;
            }
          } else if (hitAssembly.name !== name) continue;
          const x = rect.left + ((center.x + 1) * rect.width) / 2;
          const y = rect.top + ((1 - center.y) * rect.height) / 2;
          diagnostic.matching++;
          if (document.elementFromPoint(x, y) !== canvas) {
            diagnostic.blockedByDom++;
            continue;
          }
          return { x, y };
        }
      }
      throw new Error(`No unobstructed real-model click found for ${name}; ${JSON.stringify(diagnostic)}`);
    },
    { name: assemblyName, learningTarget },
  );
  await page.mouse.click(point.x, point.y);
  await expect(popup).toHaveAttribute('aria-hidden', learningTarget ? 'true' : 'false');
}

async function answerCurrent(page: Page, index: number) {
  const task = exploreLearningTasks[index];
  const target = exploreLearningTargets[task.targetKey];
  const names =
    target.kind === 'teaching-hotspot'
      ? [target.hotspotId!]
      : (target.requiredTargetGroups?.map((group) => group[0]) ?? [target.names[0]]);
  for (const name of names) await page.locator(`[data-learning-diagram="${name}"]`).click();
  const wrong = task.question.choices.find((c) => c.id !== task.question.correctChoiceId)!;
  await page.locator(`[data-learning-answer="${wrong.id}"]`).click();
  await expect(page.locator('[data-learning-feedback]')).toContainText(task.question.retryFeedback);
  await expect(page.locator('[data-learning-continue]')).toBeDisabled();
  await page.locator(`[data-learning-answer="${task.question.correctChoiceId}"]`).click();
  await expect(page.locator('[data-learning-feedback]')).toContainText(task.question.correctFeedback);
  await page.locator('[data-learning-continue]').click();
}

test('02 reviews the original three systems with correction and preserves the original mission', async ({
  page,
}) => {
  await openExplore(page);
  await expect(page.locator('[data-explore-review-open]')).toBeHidden();
  await page.locator('[data-disassembly-start]').click();
  await page.waitForTimeout(1500);
  for (const name of ['BatteryPack', 'ADAS', 'Cabin']) await pickAssembly(page, name);
  await page.locator('[data-part-popup-close]').click();
  await page.locator('[data-explore-review-open]').click();
  for (const question of exploreReviewQuestions) {
    const wrong = question.choices.find((c) => c.id !== question.correctChoiceId)!;
    await page.locator(`[data-review-answer="${wrong.id}"]`).click();
    await expect(page.locator(`[data-review-feedback="${question.id}"]`)).toContainText(
      question.retryFeedback,
    );
    await page.locator(`[data-review-answer="${question.correctChoiceId}"]`).click();
    await expect(page.locator(`[data-review-feedback="${question.id}"]`)).toContainText(
      question.correctFeedback,
    );
  }
  await expect(page.locator('[data-disassembly-progress]')).toHaveText('3 / 3');
  await page.locator('[data-explore-review-close]').click();
  await page.locator('[data-model-action="doors"]').click();
  await expect(page.locator('[data-model-action="doors"]')).toHaveAttribute('aria-pressed', 'true');
});

test('02 completes 13 diagram tasks with keyboard, reports sources, and retains progress across chapters', async ({
  page,
}) => {
  await openExplore(page);
  await page.locator('[data-learning-start]').click();
  await expect(page.locator('[data-learning-continue]')).toBeDisabled();
  await expect(page.locator('[data-focus-detail]')).toBeHidden();
  await page.locator('[data-learning-diagram="BatteryPack"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-learning-found]')).toContainText('动力电池');
  for (let index = 0; index < 4; index++) await answerCurrent(page, index);
  await navigate(page, 'history');
  await navigate(page, 'explore');
  await expect(page.locator('[data-learning-progress]')).toHaveText('4 / 13');
  await expect(page.locator('[data-disassembly-progress]')).toHaveText('0 / 3');
  await page.locator('[data-learning-cancel]').click();
  await expect(page.locator('[data-learning-start]')).toBeFocused();
  await page.locator('[data-part-filter="energy"]').click();
  await expect(page.locator('[data-part-filter-count]')).toContainText('能源系统');
  await page.locator('[data-focus="battery"]').click();
  await expect(page.locator('[data-focus-title]')).toHaveText('电池系统');
  await page.locator('[data-learning-start]').click();
  for (let index = 4; index < 13; index++) {
    if (index === 5) {
      for (const name of ['FrontSuspension', 'RearSuspension'])
        await page.locator(`[data-learning-diagram="${name}"]`).click();
      await expect(page.locator('[data-learning-answer]')).toHaveCount(0);
      await expect(page.locator('[data-learning-continue]')).toBeDisabled();
    }
    if (index === 11)
      await expect(page.locator('[data-learning-diagram="teaching-millimeter-radar"]')).toContainText(
        '教学示意',
      );
    if (index === 11) {
      await expect(page.locator('[data-learning-frame]')).toBeDisabled();
      await expect(page.locator('[data-learning-frame-note]')).toContainText('教学卡片');
    }
    await answerCurrent(page, index);
  }
  await expect(page.locator('[data-learning-progress]')).toHaveText('13 / 13');
  await expect(page.locator('[data-learning-report] li')).toHaveCount(13);
  await expect(page.locator('[data-learning-report]')).toContainText('图文学习');
  await page.locator('[data-learning-research]').fill('<script>我想研究雨天轮胎</script>');
  await page.locator('[data-learning-cancel]').click();
  await page.locator('[data-learning-start]').click();
  await expect(page.locator('[data-learning-research]')).toHaveValue('<script>我想研究雨天轮胎</script>');
  await page.locator('[data-learning-reset]').click();
  await expect(page.locator('[data-learning-progress]')).toHaveText('0 / 13');
});

test('02 persisted page exit resets only new learning and restores original observation', async ({
  page,
}) => {
  await openExplore(page);
  await page.locator('[data-disassembly-start]').click();
  await page.waitForTimeout(1500);
  for (const name of ['BatteryPack', 'ADAS', 'Cabin']) await pickAssembly(page, name);
  await page.locator('[data-part-popup-close]').click();
  await page.locator('[data-explore-review-open]').click();
  await page.locator(`[data-review-answer="${exploreReviewQuestions[0].correctChoiceId}"]`).click();
  await page.locator('[data-explore-review-close]').click();
  await page.locator('[data-part-filter="energy"]').click();
  await page.locator('[data-focus="battery"]').click();
  await page.locator('[data-learning-start]').click();
  await answerCurrent(page, 0);
  await page.locator('[data-learning-research]').fill('我想研究不同轮胎在雨天的表现');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await expect(page.locator('[data-explore-learning]')).toBeHidden();
  await expect(page.locator('[data-disassembly-progress]')).toHaveText('3 / 3');
  await expect(page.locator('[data-part-filter="energy"]')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-focus-title]')).toHaveText('电池系统');
  await expect(page.locator('[data-explode-toggle]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-learning-start]').click();
  await expect(page.locator('[data-learning-progress]')).toHaveText('0 / 13');
  await expect(page.locator('[data-learning-report] li')).toHaveCount(0);
  await expect(page.locator('[data-learning-research]')).toHaveValue('');
  await page.locator('[data-learning-cancel]').click();
  await page.locator('[data-explore-review-open]').click();
  await expect(page.locator('[data-review-answer][aria-pressed="true"]')).toHaveCount(0);
  await page.locator('[data-explore-review-close]').click();
  await page.locator('[data-assembly-open]').click();
  await page.locator('[data-assembly-next]').click();
  await page.waitForTimeout(250);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await expect(page.locator('[data-explore-assembly]')).toBeHidden();
  await expect(page.locator('[data-explode-toggle]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-assembly-open]').click();
  await expect(page.locator('[data-assembly-count]')).toHaveText('0 / 4');
  await page.locator('[data-assembly-cancel]').click();
  await page.locator('[data-learning-start]').click();
  await answerCurrent(page, 0);
  await page.locator('[data-learning-research]').fill('普通切章仍应保留学习问题');
  await navigate(page, 'history');
  await navigate(page, 'explore');
  await expect(page.locator('[data-learning-progress]')).toHaveText('1 / 13');
  await expect(page.locator('[data-learning-research]')).toHaveValue('普通切章仍应保留学习问题');
});

test('02 allows text learning during model failure and retry does not duplicate completion', async ({
  page,
}) => {
  await page.route('**/assets/yaojing-s9-optimized.glb', (route) => route.abort());
  await page.goto('/#explore');
  await expect(page.locator('[data-model-loading-label]')).toContainText('失败');
  await page.locator('[data-learning-start]').click();
  await expect(page.locator('[data-learning-mode]')).toContainText('模型暂不可用');
  await expect(page.locator('[data-learning-frame]')).toBeDisabled();
  await expect(page.locator('[data-learning-frame-note]')).toContainText('图文学习');
  await answerCurrent(page, 0);
  await expect(page.locator('[data-learning-report]')).toContainText('图文学习');
  await page.unroute('**/assets/yaojing-s9-optimized.glb');
  await page.getByRole('button', { name: '重新加载模型', exact: true }).click();
  await expect(page.locator('[data-model-loading]')).toHaveClass(/is-complete/, { timeout: 30000 });
  await expect(page.locator('[data-learning-progress]')).toHaveText('1 / 13');
});

test('02 identifies an actual camera child beneath ADAS and reports a model find', async ({ page }) => {
  await openExplore(page);
  await page.locator('[data-learning-start]').click();
  for (let index = 0; index < 8; index++) await answerCurrent(page, index);
  await page.waitForTimeout(1500);
  await page.locator('[data-learning-frame]').click();
  await pickAssembly(page, 'Front_camera_optic', true);
  await expect(page.locator('[data-learning-found]')).toContainText('前向摄像头');
  const task = exploreLearningTasks[8];
  await page.locator(`[data-learning-answer="${task.question.correctChoiceId}"]`).click();
  await page.locator('[data-learning-continue]').click();
  await expect(page.locator('[data-learning-report]')).toContainText('前向摄像头 · 模型探索');
  await expect(page.locator('[data-disassembly-progress]')).toHaveText('0 / 3');
});

test('02 teaching return pauses, restores cancel, completes closed, and leaves original explosion usable', async ({
  page,
}) => {
  await openExplore(page);
  await page.locator('[data-explode-toggle]').click();
  await page.locator('[data-assembly-open]').click();
  await page.locator('[data-assembly-next]').click();
  await page.waitForTimeout(250);
  await navigate(page, 'history');
  await page.waitForTimeout(1100);
  await navigate(page, 'explore');
  await expect(page.locator('[data-assembly-count]')).toHaveText('0 / 4');
  await page.locator('[data-assembly-cancel]').click();
  await expect(page.locator('[data-assembly-open]')).toBeFocused();
  await expect(page.locator('[data-explode-toggle]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-assembly-open]').click();
  for (let index = 1; index <= 4; index++) {
    await page.locator('[data-assembly-next]').click();
    await expect(page.locator('[data-assembly-count]')).toHaveText(`${index} / 4`);
  }
  await expect(page.locator('[data-assembly-summary]')).toContainText('已完成');
  await page.locator('[data-assembly-cancel]').click();
  await expect(page.locator('[data-explode-toggle]')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('[data-explode-toggle]').click();
  await expect(page.locator('[data-explode-toggle]')).toHaveAttribute('aria-pressed', 'true');
  await navigate(page, 'lidar');
  await navigate(page, 'explore');
  await page.locator('[data-model-action="lights"]').click();
  await expect(page.locator('[data-model-action="lights"]')).toHaveAttribute('aria-pressed', 'true');
});

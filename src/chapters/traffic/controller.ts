import * as THREE from 'three';
import { createScene } from './scene';
import { scenarios } from './data';
import { createTrafficState, reduceTraffic, type TrafficEvent } from './rules';
import { createWorldState, stepWorld } from './simulation';
import { createScenarioPresentation } from './scenario-scene';
import { renderTrafficUI } from './presentation';
import { setText, setTextAll } from '../../shared/dom';
import { createScope, createPausableTimer, createAnimationLoop } from '../../shared/lifecycle';
import { loadGltf } from '../../shared/gltf';
import { disposeObject } from '../../shared/three-resources';
import type { ChapterController } from '../../app/types';
import { watchWebglContext, reportChapterError } from '../../shared/webgl';

export function mount(host: HTMLElement): ChapterController {
  const scope = createScope();
  try {
    return createController(host, scope);
  } catch (error) {
    scope.dispose();
    throw error;
  }
}

function createController(host: HTMLElement, scope: ReturnType<typeof createScope>): ChapterController {
  const canvas = host.querySelector<HTMLCanvasElement>('[data-traffic-canvas]');
  const overlay = host.querySelector<HTMLElement>('[data-traffic-overlay]');
  const optionHost = host.querySelector<HTMLElement>('[data-traffic-options]');
  const startButton = host.querySelector<HTMLButtonElement>('[data-traffic-start]');
  const resetButton = host.querySelector<HTMLButtonElement>('[data-traffic-reset]');
  const nextButton = host.querySelector<HTMLButtonElement>('[data-traffic-next]');
  if (!canvas || !overlay || !optionHost) throw new Error('道路安全展厅缺少视图');

  const environment = createScene(canvas, scope);
  const { scene, camera, renderer, car, fallbackCar } = environment;
  watchWebglContext(canvas, scope, host);
  let disposed = false;
  void loadGltf('/assets/yaojing-s9.glb', { signal: scope.signal })
    .then((gltf) => {
      if (disposed) {
        disposeObject(gltf.scene);
        return;
      }
      const model = gltf.scene;
      model.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const scale = 4.25 / Math.max(size.x, 0.001);
      model.scale.setScalar(scale);
      model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      car.remove(fallbackCar);
      disposeObject(fallbackCar);
      car.add(model);
    })
    .catch(() => {
      if (disposed) return;
      setText(host, '[data-traffic-state]', '车辆模型加载失败，正在使用示意车继续');
    });

  const scenePresentation = createScenarioPresentation(environment);
  let active = false;
  let state = createTrafficState();
  let world = createWorldState();
  const feedbackTimer = createPausableTimer();
  scope.add(() => feedbackTimer.dispose());
  const cameraTarget = new THREE.Vector3();
  const cameraDesired = new THREE.Vector3();

  function applyScenario() {
    const scenario = scenarios[state.scenarioIndex];
    world = {
      ...world,
      courtesyState: scenario.id === 'pedestrians' ? 'waiting' : 'idle',
      courtesyProgress: 0,
      greenLightState: scenario.id === 'green-pedestrians' ? 'waiting' : 'idle',
      greenLightProgress: 0,
    };
    scenePresentation.apply(scenario.id);
    scenePresentation.update(world);
  }

  function dispatch(event: TrafficEvent) {
    const transition = reduceTraffic(state, event, scenarios);
    if (transition.state === state) return;
    state = transition.state;
    // driving is a per-step motion input derived exclusively from the rule phase.
    world = { ...world, driving: state.phase === 'driving' };
    if (event.type === 'start' || event.type === 'reset') {
      feedbackTimer.cancel();
      world = { ...world, carZ: -1.5, ambulanceZ: -176 };
      car.position.set(1.55, 0.02, world.carZ);
      if (event.type === 'start') car.rotation.y = Math.PI / 2;
      applyScenario();
    } else if (event.type === 'continue') {
      feedbackTimer.cancel();
      if (state.phase === 'driving') applyScenario();
    } else if (event.type === 'arrive') applyScenario();

    for (const effect of transition.effects) {
      if (effect.type === 'schedule-continue') {
        feedbackTimer.schedule(() => dispatch({ type: 'continue' }), effect.delayMs);
      } else if (effect.type === 'start-crossing') {
        world =
          effect.scenarioId === 'pedestrians'
            ? { ...world, courtesyState: 'crossing', courtesyProgress: 0 }
            : { ...world, greenLightState: 'crossing', greenLightProgress: 0 };
      }
      // show-result is represented by complete and rendered with the same state below.
    }
    const scenario = scenarios[state.scenarioIndex];
    const choice = scenario.options.find((option) => option.choiceId === state.answeredChoiceId);
    renderTrafficUI(
      host,
      state,
      scenario,
      choice ? { choiceId: choice.choiceId, correct: choice.correct } : null,
    );
  }

  scope.listen(startButton, 'click', () => dispatch({ type: 'start' }));
  scope.listen(resetButton, 'click', () => dispatch({ type: 'reset' }));
  scope.listen(nextButton, 'click', () => dispatch({ type: 'continue' }));
  scope.listen(optionHost, 'click', (event: MouseEvent) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-choice-id]');
    if (!button || !optionHost.contains(button) || button.disabled) return;
    dispatch({ type: 'answer', choiceId: button.dataset.choiceId ?? '' });
  });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resizeObserver.observe(canvas);
  resize();
  const loop = createAnimationLoop(renderer, animate, (error) => reportChapterError(host, error));
  scope.add(() => loop.dispose());
  scope.add(() => resizeObserver.disconnect());
  setText(host, '[data-traffic-state]', '准备出发 · 观察道路，遇到情境时点选答案');
  setTextAll(host, '[data-traffic-progress]', `0 / ${scenarios.length}`);
  setText(host, '[data-traffic-score]', '0 分');
  overlay.hidden = false;
  overlay.classList.add('is-visible', 'is-ready');
  overlay.setAttribute('aria-hidden', 'false');

  function resize() {
    const width = canvas?.clientWidth || host.clientWidth || 1;
    const height = canvas?.clientHeight || host.clientHeight || 1;
    camera.aspect = width / Math.max(height, 1);
    camera.fov = width < 620 ? 48 : 43;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 620 ? 1.25 : 1.6));
    renderer.setSize(width, height, false);
  }

  function animate(delta: number) {
    if (disposed || !active) return;
    world = stepWorld(
      { ...world, driving: state.phase === 'driving' },
      delta,
      scenarios[state.scenarioIndex],
    );
    car.position.z = world.carZ;
    if (state.phase === 'driving' && !world.driving) dispatch({ type: 'arrive' });
    scenePresentation.update(world);
    if (
      state.phase === 'crossing' &&
      (world.courtesyState === 'cleared' || world.greenLightState === 'cleared')
    ) {
      dispatch({ type: 'crossing-complete' });
    }
    // Long, steady tracking preserves the existing road view and camera rhythm.
    cameraDesired.set(car.position.x + 2.0, car.position.y + 6.6, car.position.z + 13.3);
    camera.position.lerp(cameraDesired, 1 - Math.exp(-2.8 * delta));
    cameraTarget.set(car.position.x + 0.1, 1.15, car.position.z - 11.5);
    camera.lookAt(cameraTarget);
    renderer.render(scene, camera);
  }

  return {
    setActive(value) {
      active = value;
      feedbackTimer.setActive(value);
      if (value) resize();
      loop.setActive(value);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      scope.dispose();
    },
  };
}

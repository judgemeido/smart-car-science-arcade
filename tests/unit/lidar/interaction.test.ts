import * as THREE from 'three';
import { expect, it } from 'vitest';
import { bindLidarInteraction } from '../../../src/chapters/lidar/interaction';
import {
  createExperimentState,
  reduceExperiment,
  type ExperimentAction,
} from '../../../src/chapters/lidar/experiment-state';
import { createScope } from '../../../src/shared/lifecycle';

function fixture() {
  const button = (dataset: Record<string, string>) =>
    Object.assign(new EventTarget(), {
      dataset,
      matches: (selector: string) => selector.includes(`="${dataset.lidarView}"`),
    });
  const mode = button({ lidarMode: 'cutaway' });
  const toggle = button({});
  const step = button({ lidarStep: '2' });
  const reset = button({});
  const slider = Object.assign(new EventTarget(), { value: '60', min: '5', max: '80' });
  const canvas = Object.assign(new EventTarget(), {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
  });
  const host = {
    querySelector: (selector: string) =>
      ({
        '[data-lidar-canvas]': canvas,
        '[data-lidar-reset]': reset,
        '[data-lidar-distance]': slider,
      })[selector as '[data-lidar-canvas]'],
    querySelectorAll: (selector: string) =>
      selector === '[data-lidar-mode]' ? [mode] : selector === '[data-lidar-step]' ? [step] : [toggle],
  } as unknown as HTMLElement;
  let state = createExperimentState();
  const actions: ExperimentAction[] = [];
  const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 60);
  camera.position.set(0, 0, 3);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  const part = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  part.userData.partId = 'lidar_motor';
  part.updateMatrixWorld(true);
  const scope = createScope();
  bindLidarInteraction(
    host,
    {
      camera,
      getState: () => state,
      pickCandidates: () => [part],
      onEcho: () => {},
    },
    (action) => {
      actions.push(action);
      state = reduceExperiment(state, action);
    },
    scope,
  );
  return {
    mode,
    toggle,
    step,
    slider,
    reset,
    canvas,
    actions,
    getState: () => state,
    cleanup: () => {
      scope.dispose();
      part.geometry.dispose();
      (part.material as THREE.Material).dispose();
    },
  };
}

it('dispatches host controls into the experiment and removes listeners with the scope', () => {
  const { mode, toggle, step, slider, reset, actions, getState, cleanup } = fixture();
  try {
    mode.dispatchEvent(new Event('click'));
    slider.dispatchEvent(new Event('input'));
    toggle.dispatchEvent(new Event('click'));
    step.dispatchEvent(new Event('click'));
    expect(getState()).toMatchObject({
      mode: 'cutaway',
      distanceMeters: 60,
      scanActive: true,
      stepIndex: 2,
      manualStepSelection: true,
    });
    reset.dispatchEvent(new Event('click'));
    expect(getState()).toMatchObject({
      mode: 'assembly',
      distanceMeters: 60,
      scanActive: false,
      selectedPartId: null,
    });
    cleanup();
    const count = actions.length;
    toggle.dispatchEvent(new Event('click'));
    expect(actions.length).toBe(count);
  } finally {
    cleanup();
  }
});

it('selects a real raycast hit but ignores a drag beyond the existing 6 px threshold', () => {
  const { canvas, getState, cleanup } = fixture();
  const pointer = (type: string, x: number) =>
    Object.assign(new Event(type), {
      pointerId: 1,
      clientX: x,
      clientY: 50,
    });
  try {
    canvas.dispatchEvent(pointer('pointerdown', 50));
    canvas.dispatchEvent(pointer('pointerup', 60));
    expect(getState().selectedPartId).toBeNull();
    canvas.dispatchEvent(pointer('pointerdown', 50));
    canvas.dispatchEvent(pointer('pointerup', 50));
    expect(getState().selectedPartId).toBe('lidar_motor');
  } finally {
    cleanup();
  }
});

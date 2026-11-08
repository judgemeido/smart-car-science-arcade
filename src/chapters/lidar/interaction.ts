import * as THREE from 'three';
import {
  MIN_DISTANCE_METERS,
  MAX_DISTANCE_METERS,
  type ExperimentAction,
  type ExperimentState,
} from './experiment-state';
import type { createScope } from '../../shared/lifecycle';

export interface LidarInteractionScene {
  camera: THREE.PerspectiveCamera;
  getState(): ExperimentState;
  pickCandidates(state: ExperimentState): THREE.Object3D[];
  onEcho(): void;
}

export function bindLidarInteraction(
  host: HTMLElement,
  scene: LidarInteractionScene,
  dispatch: (action: ExperimentAction) => void,
  scope: ReturnType<typeof createScope>,
): void {
  const canvas = host.querySelector<HTMLCanvasElement>('[data-lidar-canvas]');
  const slider = host.querySelector<HTMLInputElement>('[data-lidar-distance]');
  for (const button of host.querySelectorAll<HTMLElement>('[data-lidar-mode]')) {
    scope.listen(button, 'click', () => {
      const mode = button.dataset.lidarMode ?? 'assembly';
      if (mode === 'assembly' || mode === 'exploded' || mode === 'cutaway') dispatch({ type: 'mode', mode });
    });
  }
  for (const button of host.querySelectorAll<HTMLElement>(
    '[data-lidar-view="scan"], [data-lidar-view="sensor"], [data-lidar-scan-toggle]',
  )) {
    scope.listen(button, 'click', () =>
      dispatch({
        type: 'scan',
        active: button.matches('[data-lidar-view="scan"]')
          ? true
          : button.matches('[data-lidar-view="sensor"]')
            ? false
            : !scene.getState().scanActive,
      }),
    );
  }
  for (const button of host.querySelectorAll<HTMLElement>('[data-lidar-step]')) {
    scope.listen(button, 'click', () =>
      dispatch({ type: 'step', index: Number(button.dataset.lidarStep ?? 0) }),
    );
  }
  scope.listen(host.querySelector('[data-lidar-reset]'), 'click', () => dispatch({ type: 'reset' }));
  scope.listen(slider, 'input', () =>
    dispatch({
      type: 'distance',
      meters: THREE.MathUtils.clamp(Number(slider?.value ?? 20), MIN_DISTANCE_METERS, MAX_DISTANCE_METERS),
    }),
  );

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerStart: { id: number; x: number; y: number } | null = null;
  scope.listen<PointerEvent>(canvas, 'pointerdown', (event) => {
    pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  scope.listen<PointerEvent>(canvas, 'pointerup', (event) => {
    const start = pointerStart;
    pointerStart = null;
    if (
      !start ||
      start.id !== event.pointerId ||
      Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6
    )
      return;
    const rect = canvas!.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, scene.camera);
    const state = scene.getState();
    raycaster.params.Points = { threshold: 0.075 };
    const intersections = raycaster.intersectObjects(scene.pickCandidates(state), true);
    const hit =
      intersections.find(({ object }) => String(object.userData.partId ?? '').startsWith('lidar_')) ??
      intersections[0];
    const partId = hit?.object.userData.partId ?? hit?.object.parent?.userData.partId;
    if (partId) dispatch({ type: 'select-part', id: String(partId) });
    else if (state.scanActive && hit) scene.onEcho();
  });
}

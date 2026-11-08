import { expect, it } from 'vitest';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  captureCameraObservation,
  restoreCameraObservation,
} from '../../../src/chapters/explore/camera-observation';

it('restores a real custom orbit, target, zoom and limits after temporary framing', () => {
  const camera = new THREE.PerspectiveCamera(34, 1.2, 0.01, 100);
  const controls = new OrbitControls(camera, null);
  camera.position.set(4, 2.8, -3);
  camera.zoom = 1.4;
  controls.target.set(0.8, 1.1, -0.2);
  controls.minDistance = 0.7;
  controls.maxDistance = 12;
  controls.minPolarAngle = 0.15;
  controls.maxPolarAngle = 2.8;
  controls.minAzimuthAngle = -2.5;
  controls.maxAzimuthAngle = 2.5;
  controls.screenSpacePanning = true;
  controls.enableDamping = true;
  controls.autoRotate = false;
  camera.updateProjectionMatrix();
  controls.update();
  camera.updateMatrixWorld(true);
  const snapshot = captureCameraObservation(camera, controls);
  const matrix = camera.matrix.clone();
  camera.position.set(20, 9, 5);
  camera.zoom = 0.8;
  controls.target.set(-3, 4, 1);
  controls.minDistance = 2;
  controls.maxDistance = 50;
  controls.maxPolarAngle = 1.5;
  controls.screenSpacePanning = false;
  controls.update();
  restoreCameraObservation(camera, controls, snapshot);
  controls.update();
  camera.updateMatrixWorld(true);
  for (let index = 0; index < 16; index++)
    expect(camera.matrix.elements[index]).toBeCloseTo(matrix.elements[index], 10);
  expect(controls.target.toArray()).toEqual(snapshot.target.toArray());
  expect(camera.zoom).toBe(1.4);
  expect(controls.minDistance).toBe(0.7);
  expect(controls.maxDistance).toBe(12);
  expect(controls.minPolarAngle).toBe(0.15);
  expect(controls.maxPolarAngle).toBe(2.8);
  expect(controls.minAzimuthAngle).toBe(-2.5);
  expect(controls.maxAzimuthAngle).toBe(2.5);
  expect(controls.screenSpacePanning).toBe(true);
  expect(controls.enableDamping).toBe(true);
  expect(controls.autoRotate).toBe(false);
  // With a null DOM surface, these real controls never attach event listeners.
});

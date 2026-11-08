import * as THREE from 'three';
import { expect, it } from 'vitest';
import { createScanAnimation } from '../../../src/chapters/lidar/scan-animation';
import { createScanScene } from '../../../src/chapters/lidar/scan-scene';
import { createConceptParts } from '../../../src/chapters/lidar/concept';
import { createExperimentState, reduceExperiment } from '../../../src/chapters/lidar/experiment-state';
import { disposeObject } from '../../../src/shared/three-resources';

it('maps distance and the selected scan step to the existing 720-point scene', () => {
  const scanGroup = new THREE.Group();
  const conceptGroup = new THREE.Group();
  const objects = createScanScene(scanGroup);
  const concept = createConceptParts(conceptGroup);
  const animation = createScanAnimation({ scanGroup, ...concept }, objects);
  try {
    let state = reduceExperiment(createExperimentState(), { type: 'distance', meters: 60 });
    state = reduceExperiment(state, { type: 'step', index: 3 });
    animation.update(state, 0);
    expect(scanGroup.visible).toBe(true);
    expect(objects.pointCloud.visible).toBe(true);
    expect(objects.scanPulse.visible).toBe(false);
    expect(objects.pointsGeometry.getAttribute('position').count).toBe(720);
    expect(objects.targetGroup.position.z).toBeCloseTo(1.5023, 4);
    expect(objects.targetGroup.visible).toBe(false);
    state = reduceExperiment(state, { type: 'scan', active: false });
    animation.update(state, 0);
    expect(scanGroup.visible).toBe(false);
    expect(concept.conceptRotor.rotation.z).toBe(0);
  } finally {
    disposeObject(scanGroup);
    disposeObject(conceptGroup);
  }
});

it('animates outgoing and return pulses using experiment elapsed time', () => {
  const scanGroup = new THREE.Group();
  const conceptGroup = new THREE.Group();
  const objects = createScanScene(scanGroup);
  const concept = createConceptParts(conceptGroup);
  const animation = createScanAnimation({ scanGroup, ...concept }, objects);
  try {
    let state = reduceExperiment(createExperimentState(), { type: 'step', index: 0 });
    state = reduceExperiment(state, { type: 'tick', deltaSeconds: 0.65 });
    animation.update(state, 0.65);
    expect(objects.scanPulse.position.z).toBeCloseTo(objects.targetGroup.position.z / 2);
    expect(concept.conceptRotor.rotation.z).toBeCloseTo(1.365);
    state = reduceExperiment(state, { type: 'step', index: 2 });
    animation.update(state, 0);
    expect(objects.scanPulse.position.z).toBeCloseTo(objects.targetGroup.position.z);
    state = reduceExperiment(state, { type: 'tick', deltaSeconds: 1.3 });
    animation.update(state, 0);
    expect(objects.scanPulse.position.z).toBe(0);
    expect(state.stepIndex).toBe(2);
  } finally {
    disposeObject(scanGroup);
    disposeObject(conceptGroup);
  }
});

import { expect, it } from 'vitest';
import * as THREE from 'three';
import { createScope } from '../../../src/shared/lifecycle';
import { powerflowStages } from '../../../src/chapters/explore/data';
import type { createScene } from '../../../src/chapters/explore/scene';
import { createPowerflowScene } from '../../../src/chapters/explore/powerflow-scene';
import { createPowerflowState, reducePowerflow } from '../../../src/chapters/explore/powerflow-state';

it('drives energy and sensor effects from powerflow state and restores focused sensors on exit', () => {
  const scope = createScope();
  const effects = createPowerflowScene({ scene: new THREE.Scene() } as ReturnType<typeof createScene>, scope);
  const root = new THREE.Group();
  ['BatteryPack', 'FrontEaxle', 'RearEaxle', 'Wheel_FL', 'Wheel_FR', 'Wheel_RL', 'Wheel_RR'].forEach(
    (name, index) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 0.3, 0.5), new THREE.MeshBasicMaterial());
      mesh.name = name;
      mesh.position.x = index;
      root.add(mesh);
    },
  );
  root.updateMatrixWorld(true);
  effects.prepareModel(root, new THREE.Vector3(7, 1, 1));
  expect(root.getObjectByName('ADAS_RADAR_WAVE_FIELD')).toBe(effects.sensorWaveGroup);
  expect(root.getObjectByName('EV_POWERFLOW_INTRO_EFFECTS')).toBe(effects.group);
  let state = reducePowerflow(createPowerflowState(), { type: 'start' }, powerflowStages);
  effects.update(state, 'all');
  expect(effects.group?.visible).toBe(true);
  expect(effects.sensorWaveGroup?.visible).toBe(false);
  state = reducePowerflow(state, { type: 'tick', deltaSeconds: 3.45 }, powerflowStages);
  effects.update(state, 'all');
  expect(effects.sensorWaveGroup?.visible).toBe(true);
  state = reducePowerflow(state, { type: 'deactivate' }, powerflowStages);
  effects.update(state, 'all');
  expect(effects.group?.visible).toBe(false);
  expect(effects.sensorWaveGroup?.visible).toBe(false);
  effects.update(state, 'adas');
  expect(effects.sensorWaveGroup?.visible).toBe(true);
  state = reducePowerflow(state, { type: 'replay' }, powerflowStages);
  effects.update(state, 'all');
  expect(effects.group?.visible).toBe(true);
  expect(effects.sensorWaveGroup?.visible).toBe(false);
  scope.dispose();
});

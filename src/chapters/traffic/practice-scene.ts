import * as THREE from 'three';
import type { createScope } from '../../shared/lifecycle';
import { disposeObject } from '../../shared/three-resources';
import type { TrafficPracticeScenario, TrafficSceneKind } from './learning-data';
import { createPedestrian, makeBox, makeCylinder, makeFallbackCar, makeMaterial } from './primitives';

export interface TrafficPracticeScene {
  show(scenario: TrafficPracticeScenario): void;
  showDecision(verdict: 'correct' | 'incorrect'): void;
  update(deltaSeconds: number): void;
  hide(): void;
}

/** Qualitative teaching tableaux: scene conditions are authored, never inferred from animation. */
export function createTrafficPracticeScene(
  parent: THREE.Group,
  scope: ReturnType<typeof createScope>,
): TrafficPracticeScene {
  const root = new THREE.Group();
  root.name = 'traffic-practice';
  root.visible = false;
  parent.add(root);
  const asphalt = makeMaterial(0x46565b);
  const white = new THREE.MeshBasicMaterial({ color: 0xf3efe3 });
  const amber = new THREE.MeshBasicMaterial({ color: 0xf2bc59 });
  const green = new THREE.MeshBasicMaterial({ color: 0x59d39b });
  makeBox(root, [12, 0.15, 28], makeMaterial(0x8ca497), [0, -0.18, -4]);
  makeBox(root, [7, 0.1, 28], asphalt, [0, -0.04, -4]);
  for (let z = -15; z < 9; z += 3) makeBox(root, [0.08, 0.015, 1.5], white, [0, 0.025, z]);
  const vehicle = makeFallbackCar();
  vehicle.userData.practiceVehicle = true;
  vehicle.position.set(1.65, 0.03, 6);
  root.add(vehicle);
  const riskMaterial = new THREE.MeshBasicMaterial({
    color: 0xdd745f,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
  });
  const risk = makeBox(root, [2.6, 0.03, 4.2], riskMaterial, [1.65, 0.09, -2.8]);
  risk.name = 'decision-risk-region';
  risk.visible = false;
  const action = makeBox(root, [0.15, 0.02, 3.2], green, [1.65, 0.09, 2.3]);
  action.name = 'decision-safe-action';
  action.visible = false;
  const tableaux = new Map<TrafficSceneKind, THREE.Group>();
  function tableau(kind: TrafficSceneKind) {
    const group = new THREE.Group();
    group.name = `practice-${kind}`;
    group.userData.sceneKind = kind;
    group.visible = false;
    tableaux.set(kind, group);
    root.add(group);
    return group;
  }

  const clear = tableau('green-clear');
  for (let x = -2.9; x < 3.5; x += 0.7) makeBox(clear, [0.4, 0.02, 2], white, [x, 0.03, -3.5]);
  makeCylinder(clear, 0.06, 0.06, 4.2, makeMaterial(0x4b5452), [4.1, 2.1, -4.5]);
  makeBox(clear, [0.6, 1.6, 0.4], makeMaterial(0x25322d), [4.1, 4, -4.5]);
  const signal = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), green);
  signal.position.set(4.1, 3.5, -4.22);
  clear.add(signal);

  const personScene = tableau('sudden-person');
  // The yellow segment marks the GIVEN parking space; it is not a measured braking distance.
  makeBox(
    personScene,
    [2.6, 0.02, 4.5],
    new THREE.MeshBasicMaterial({ color: 0xe9c56e, transparent: true, opacity: 0.22 }),
    [1.65, 0.04, 2.1],
  );
  makeBox(personScene, [3.3, 0.02, 0.08], amber, [1.65, 0.05, -0.3]);
  const pedestrian = createPedestrian({ coat: 0xe1a059, pants: 0x335c64, skin: 0xd8ad8e }, [3.8, 0.04, -2.7]);
  pedestrian.root.name = 'sudden-person';
  personScene.add(pedestrian.root);

  const obstacleScene = tableau('obstacle');
  makeBox(obstacleScene, [1.8, 0.95, 1.3], makeMaterial(0xb48254), [1.65, 0.5, -3]);
  for (const x of [0.9, 2.4])
    makeCylinder(obstacleScene, 0.03, 0.2, 0.65, makeMaterial(0xe8a54d), [x, 0.35, -1.8]);
  const unknownMaterial = new THREE.MeshBasicMaterial({
    color: 0xd2b66f,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  makeBox(obstacleScene, [3.15, 0.025, 14], unknownMaterial, [-1.7, 0.05, -3]);
  for (let z = -9; z < 5; z += 2) makeBox(obstacleScene, [2.3, 0.015, 0.12], amber, [-1.7, 0.075, z]);

  const rainScene = tableau('heavy-rain');
  makeBox(
    rainScene,
    [6.8, 0.015, 27],
    new THREE.MeshPhysicalMaterial({ color: 0x769ca9, roughness: 0.16, transparent: true, opacity: 0.4 }),
    [0, 0.045, -4],
  );
  const leadCar = makeFallbackCar();
  leadCar.position.set(1.65, 0.03, -5.8);
  rainScene.add(leadCar);
  const rainDrops: THREE.Mesh[] = [];
  const rainMat = new THREE.MeshBasicMaterial({ color: 0xb8d4e0, transparent: true, opacity: 0.65 });
  for (let index = 0; index < 54; index += 1) {
    const drop = makeBox(rainScene, [0.025, 0.45, 0.025], rainMat, [
      ((index * 17) % 70) / 10 - 3.5,
      (index % 9) * 0.6 + 0.5,
      -((index * 13) % 150) / 10 + 5,
    ]);
    drop.rotation.z = -0.16;
    rainDrops.push(drop);
  }
  const hazeMat = new THREE.MeshBasicMaterial({
    color: 0xa0b3bd,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  for (const z of [-6, -9, -12]) makeBox(rainScene, [8, 4, 0.03], hazeMat, [0, 2.1, z]);

  const uncertain = tableau('sensor-uncertain');
  // An opaque uncertainty screen avoids presenting an unobserved empty route as safe.
  makeBox(uncertain, [6.8, 3.8, 0.12], makeMaterial(0x737d7c), [0, 1.9, -3.6]);
  for (const x of [-2, 0, 2]) {
    makeBox(uncertain, [0.12, 1, 0.1], amber, [x, 2.2, -3.4]);
    makeBox(uncertain, [0.16, 0.16, 0.1], amber, [x, 1.45, -3.4]);
  }
  let scenarioKind: TrafficSceneKind = 'green-clear';
  let elapsed = 0;
  let decisionTime = 0;
  let verdict: 'correct' | 'incorrect' | null = null;
  let disposed = false;
  scope.add(() => {
    disposed = true;
    root.removeFromParent();
    disposeObject(root);
  });
  return {
    show(scenario) {
      if (disposed) return;
      scenarioKind = scenario.sceneKind;
      elapsed = 0;
      decisionTime = 0;
      verdict = null;
      root.userData.scenarioId = scenario.id;
      root.visible = true;
      tableaux.forEach((group, kind) => {
        group.visible = kind === scenarioKind;
      });
      vehicle.position.z = 6;
      pedestrian.root.position.x = 3.8;
      risk.visible = false;
      action.visible = false;
    },
    showDecision(value) {
      if (disposed || verdict === value) return;
      verdict = value;
      decisionTime = 0;
      risk.visible = value === 'incorrect';
      action.visible = value === 'correct';
      action.scale.z = scenarioKind === 'green-clear' ? 1 : 0.3;
      action.position.z = scenarioKind === 'green-clear' ? 2.3 : 4.5;
    },
    update(deltaSeconds) {
      if (disposed || !root.visible || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;
      elapsed += deltaSeconds;
      if (scenarioKind === 'sudden-person') {
        // Enter the vehicle path and remain there while students judge; never clear it for them.
        pedestrian.root.position.x = 3.8 - 2.2 * Math.min(elapsed / 1.2, 1);
        pedestrian.walk(elapsed, elapsed < 1.2);
      }
      if (scenarioKind === 'heavy-rain')
        rainDrops.forEach((drop, index) => {
          drop.position.y = 5 - ((elapsed * 3.2 + (index % 9) * 0.6) % 5);
        });
      if (verdict === 'correct') {
        decisionTime += deltaSeconds;
        const travel = scenarioKind === 'green-clear' ? 13.5 : 1.1;
        const duration = scenarioKind === 'green-clear' ? 5.5 : 2.8;
        vehicle.position.z = 6 - travel * Math.min(decisionTime / duration, 1);
      }
    },
    hide() {
      root.visible = false;
    },
  };
}

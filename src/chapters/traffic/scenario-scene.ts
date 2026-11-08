import * as THREE from 'three';
import { makeMaterial, makeBox, makeCylinder } from './primitives';
import type { createScene } from './scene';
import type { CrossingState, WorldState } from './simulation';

/** Existing props and actor poses; gameplay and motion live in rules/simulation. */
export function createScenarioPresentation(environment: ReturnType<typeof createScene>) {
  const {
    city,
    signalMat,
    pedestrianActors,
    courtesyPedestrians,
    courtesyMaterials,
    greenLightPedestrians,
    greenLightPedestrianMaterials,
    firstSignal,
    yellowSignal,
    greenSignal,
    schoolSign,
  } = environment;
  // Simple oncoming and parked vehicles provide scale and traffic context.
  const trafficMats = [0x7a3231, 0x657b89, 0xb38d5b, 0x546c61].map((color) =>
    makeMaterial(color, 0.34, 0.42),
  );
  const trafficCars: THREE.Group[] = [];
  for (let i = 0; i < 6; i += 1) {
    const vehicle = new THREE.Group();
    makeBox(vehicle, [1.72, 0.64, 3.5], trafficMats[i % trafficMats.length], [0, 0.64, 0]);
    makeBox(
      vehicle,
      [1.38, 0.65, 1.7],
      new THREE.MeshPhysicalMaterial({ color: 0x739096, roughness: 0.22, transparent: true, opacity: 0.72 }),
      [0, 1.16, -0.02],
    );
    const wheelMat = makeMaterial(0x171a1b, 0.9);
    for (const x of [-0.87, 0.87])
      for (const z of [-1.05, 1.03]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.16, 12), wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.36, z);
        vehicle.add(wheel);
      }
    vehicle.position.set(-2, 0.02, -18 - i * 22);
    // These procedural traffic cars are built with their length along local Z,
    // matching the road axis. Keep them aligned with Z as they move toward +Z.
    vehicle.rotation.y = 0;
    city.add(vehicle);
    trafficCars.push(vehicle);
  }

  const queueGroup = new THREE.Group();
  queueGroup.visible = false;
  const queueBodyMats = [0xc4c8c4, 0x7a3231].map((color) => makeMaterial(color, 0.42, 0.2));
  const queueGlass = new THREE.MeshPhysicalMaterial({
    color: 0x789094,
    roughness: 0.28,
    transparent: true,
    opacity: 0.78,
  });
  const queueTires = makeMaterial(0x181c1d, 0.92);
  const addQueueCar = (z: number, index: number) => {
    const vehicle = new THREE.Group();
    makeBox(vehicle, [1.78, 0.68, 3.7], queueBodyMats[index % queueBodyMats.length], [0, 0.66, 0]);
    makeBox(vehicle, [1.42, 0.62, 1.9], queueGlass, [0, 1.22, -0.12]);
    for (const x of [-0.9, 0.9])
      for (const wheelZ of [-1.15, 1.12]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.18, 12), queueTires);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.36, wheelZ);
        vehicle.add(wheel);
      }
    vehicle.position.set(1.55, 0.02, z);
    queueGroup.add(vehicle);
  };
  addQueueCar(-121, 0);
  addQueueCar(-126, 1);
  city.add(queueGroup);

  const constructionGroup = new THREE.Group();
  constructionGroup.visible = false;
  const coneMat = makeMaterial(0xe87535, 0.72);
  const coneStripeMat = makeMaterial(0xf4eee0, 0.72);
  for (let i = 0; i < 6; i += 1) {
    const z = -148 - i * 1.6;
    makeBox(constructionGroup, [0.56, 0.12, 0.56], makeMaterial(0x5b5550, 0.86), [3.02, 0.06, z]);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.8, 8), coneMat);
    cone.position.set(3.02, 0.52, z);
    constructionGroup.add(cone);
    makeBox(constructionGroup, [0.37, 0.1, 0.37], coneStripeMat, [3.02, 0.53, z]);
  }
  const warningPlate = makeBox(
    constructionGroup,
    [1.2, 0.92, 0.13],
    makeMaterial(0xf0c952, 0.6),
    [4.25, 2.05, -147.8],
  );
  makeCylinder(constructionGroup, 0.045, 0.055, 2.15, signalMat.pole, [4.25, 1.08, -147.8]);
  const warningTriangle = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.46, 3), makeMaterial(0x323638, 0.68));
  warningTriangle.position.set(4.25, 2.08, -147.69);
  constructionGroup.add(warningTriangle);
  makeBox(constructionGroup, [0.48, 0.08, 0.04], makeMaterial(0x323638, 0.68), [4.25, 1.78, -147.68]);
  void warningPlate;
  city.add(constructionGroup);

  const ambulance = new THREE.Group();
  ambulance.visible = false;
  const ambulanceBody = makeMaterial(0xf3f1e9, 0.48);
  const ambulanceRed = makeMaterial(0xc43f37, 0.54);
  const ambulanceGlass = new THREE.MeshPhysicalMaterial({
    color: 0x71939a,
    roughness: 0.23,
    transparent: true,
    opacity: 0.78,
  });
  const ambulanceTire = makeMaterial(0x171a1b, 0.92);
  makeBox(ambulance, [1.82, 1.05, 4.0], ambulanceBody, [0, 0.72, 0]);
  makeBox(ambulance, [1.83, 0.2, 3.5], ambulanceRed, [0, 0.76, -0.05]);
  makeBox(ambulance, [1.62, 0.92, 1.85], ambulanceBody, [0, 1.56, -0.62]);
  makeBox(ambulance, [1.42, 0.66, 1.52], ambulanceGlass, [0, 1.58, 0.86]);
  for (const x of [-0.94, 0.94])
    for (const z of [-1.3, 1.25]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.18, 12), ambulanceTire);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.39, z);
      ambulance.add(wheel);
    }
  const redBeaconMat = new THREE.MeshStandardMaterial({
    color: 0xff4037,
    emissive: 0xaa120a,
    emissiveIntensity: 2.4,
  });
  const blueBeaconMat = new THREE.MeshStandardMaterial({
    color: 0x358cff,
    emissive: 0x123baa,
    emissiveIntensity: 2.4,
  });
  makeBox(ambulance, [0.42, 0.14, 0.28], redBeaconMat, [-0.29, 2.08, 0.76]);
  makeBox(ambulance, [0.42, 0.14, 0.28], blueBeaconMat, [0.29, 2.08, 0.76]);
  ambulance.position.set(-1.55, 0.02, -176);
  city.add(ambulance);

  const resetPedestrians = (
    actors: typeof pedestrianActors,
    materials: THREE.Material[],
    visible: boolean,
  ) => {
    actors.forEach((actor) => {
      actor.root.position.set(actor.startX, 0.14, actor.z);
      actor.root.scale.set(1, 1, 1);
      actor.root.visible = visible;
    });
    materials.forEach((material) => {
      material.opacity = 1;
      material.depthWrite = true;
    });
  };
  const renderPedestrians = (
    actors: typeof pedestrianActors,
    materials: THREE.Material[],
    state: CrossingState,
    progress: number,
    worldTime: number,
  ) => {
    if (state === 'crossing' || state === 'cleared') {
      const walkProgress = Math.min(progress / 0.86, 1);
      const fade = THREE.MathUtils.clamp((progress - 0.84) / 0.16, 0, 1);
      actors.forEach((actor) => {
        actor.root.position.x = THREE.MathUtils.lerp(actor.startX, actor.endX, walkProgress);
        actor.walk(worldTime + actor.offset, state === 'crossing' && walkProgress < 1);
        if (progress >= 1) actor.root.visible = false;
      });
      materials.forEach((material) => {
        material.opacity = 1 - fade;
        material.depthWrite = fade < 0.05;
      });
    } else actors.forEach((actor) => actor.walk(worldTime + actor.offset, false));
  };
  return {
    apply(scenarioId: string) {
      firstSignal.visible = scenarioId === 'red-light';
      yellowSignal.visible = scenarioId === 'yellow-light';
      greenSignal.visible = scenarioId === 'green-pedestrians';
      schoolSign.visible = scenarioId === 'school-zone';
      queueGroup.visible = scenarioId === 'queue';
      constructionGroup.visible = scenarioId === 'construction';
      ambulance.visible = scenarioId === 'ambulance';
      resetPedestrians(courtesyPedestrians, courtesyMaterials, scenarioId === 'pedestrians');
      resetPedestrians(
        greenLightPedestrians,
        greenLightPedestrianMaterials,
        scenarioId === 'green-pedestrians',
      );
    },
    update(world: WorldState) {
      pedestrianActors.forEach((actor) => {
        if (courtesyPedestrians.includes(actor) || greenLightPedestrians.includes(actor)) return;
        const crossing = Math.abs(actor.endX - actor.startX) > 0.1;
        if (crossing) {
          const progress = (world.worldTime * 0.17 + actor.offset) % 1;
          actor.root.position.x = THREE.MathUtils.lerp(actor.startX, actor.endX, progress);
        }
        actor.walk(world.worldTime + actor.offset, crossing);
      });
      renderPedestrians(
        courtesyPedestrians,
        courtesyMaterials,
        world.courtesyState,
        world.courtesyProgress,
        world.worldTime,
      );
      renderPedestrians(
        greenLightPedestrians,
        greenLightPedestrianMaterials,
        world.greenLightState,
        world.greenLightProgress,
        world.worldTime,
      );
      trafficCars.forEach((vehicle, index) => {
        vehicle.position.z = world.trafficCarZs[index];
      });
      ambulance.position.z = world.ambulanceZ;
      redBeaconMat.emissiveIntensity = 1.45 + (Math.sin(world.worldTime * 12) > 0 ? 1.2 : 0.12);
      blueBeaconMat.emissiveIntensity = 1.45 + (Math.sin(world.worldTime * 12 + Math.PI) > 0 ? 1.2 : 0.12);
    },
  };
}

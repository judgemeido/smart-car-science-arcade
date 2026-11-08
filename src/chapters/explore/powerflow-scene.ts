import * as THREE from 'three';
import { powerflowStages, type FocusKey } from './data';
import type { PowerflowState } from './powerflow-state';
import type { createScene } from './scene';
import type { createScope } from '../../shared/lifecycle';

/** Owns the existing energy paths and radar meshes, using the rule state's playback position. */
export function createPowerflowScene(
  _scene: ReturnType<typeof createScene>,
  scope: ReturnType<typeof createScope>,
) {
  let modelRoot: THREE.Object3D | null = null;
  let wasPlaying = false;
  let radarStarted = false;
  type WaveNode = {
    mesh: THREE.Mesh;
    phase: number;
    duration: number;
    maxScale: number;
    baseOpacity: number;
  };
  type SensorPoint = { mesh: THREE.Mesh; phase: number };
  type PowerflowPath = {
    curve: THREE.CatmullRomCurve3;
    tubeMaterial: THREE.MeshBasicMaterial;
    particle: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
    startAt: number;
    duration: number;
  };
  type PowerflowAccent = {
    mesh: THREE.Mesh;
    material: THREE.MeshBasicMaterial;
    startAt: number;
    endAt: number;
    baseOpacity: number;
  };
  const waveNodes: WaveNode[] = [];
  const sensorPoints: SensorPoint[] = [];
  const powerflowPaths: PowerflowPath[] = [];
  const powerflowAccents: PowerflowAccent[] = [];

  let sensorWaveGroup: THREE.Group | null = null;
  let powerflowGroup: THREE.Group | null = null;
  const createRadarWave = (
    group: THREE.Group,
    position: THREE.Vector3,
    rotation: THREE.Euler,
    color: number,
    maxRadius: number,
    phase: number,
    duration: number,
    ellipse = 1,
  ) => {
    const geometry = new THREE.RingGeometry(0.06, 0.085, 64);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.rotation.copy(rotation);
    mesh.scale.set(0.1, 0.1 * ellipse, 0.1);
    mesh.renderOrder = 20;
    group.add(mesh);
    waveNodes.push({
      mesh,
      phase,
      duration,
      maxScale: maxRadius / 0.085,
      baseOpacity: color === 0xe9b56d ? 0.58 : 0.48,
    });
  };

  const createSensorPoint = (group: THREE.Group, position: THREE.Vector3, color: number, phase: number) => {
    const geometry = new THREE.SphereGeometry(0.045, 12, 8);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.renderOrder = 21;
    group.add(mesh);
    sensorPoints.push({ mesh, phase });
  };

  const resetRadarWaves = () => {
    waveNodes.forEach((wave) => {
      wave.phase = (wave.phase * 0.37) % 1;
    });
    sensorPoints.forEach((point) => {
      point.phase = (point.phase * 0.61) % 1;
    });
  };

  const updateRadarWaves = (deltaSeconds: number) => {
    if (!sensorWaveGroup?.visible) return;
    waveNodes.forEach((wave) => {
      wave.phase = (wave.phase + deltaSeconds / wave.duration) % 1;
      const progress = wave.phase;
      const eased = progress * progress * (3 - 2 * progress);
      const scale = 0.12 + eased * wave.maxScale;
      wave.mesh.scale.set(scale, scale, scale);
      const fadeIn = Math.min(progress * 8, 1);
      const fadeOut = Math.pow(1 - progress, 1.2);
      (wave.mesh.material as THREE.MeshBasicMaterial).opacity = wave.baseOpacity * fadeIn * fadeOut;
    });
    sensorPoints.forEach((point) => {
      point.phase = (point.phase + deltaSeconds * 0.9) % 1;
      const pulse = 1 + Math.sin(point.phase * Math.PI * 2) * 0.22;
      point.mesh.scale.setScalar(pulse);
      (point.mesh.material as THREE.MeshBasicMaterial).opacity = 0.55 + (pulse - 0.78) * 0.8;
    });
  };

  const localPartBounds = (name: string) => {
    if (!modelRoot) return null;
    const node = modelRoot.getObjectByName(name);
    if (!node) return null;
    const box = new THREE.Box3().setFromObject(node);
    if (box.isEmpty()) return null;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).divideScalar(Math.max(modelRoot.scale.x, 0.0001));
    modelRoot.worldToLocal(center);
    return { center, size };
  };

  const setupPowerflowEffects = () => {
    if (!modelRoot) return;
    powerflowGroup = new THREE.Group();
    powerflowGroup.name = 'EV_POWERFLOW_INTRO_EFFECTS';
    powerflowGroup.visible = false;
    modelRoot.add(powerflowGroup);
    const battery = localPartBounds('BatteryPack');
    const frontDrive = localPartBounds('FrontEaxle');
    const rearDrive = localPartBounds('RearEaxle');
    const wheels = [
      { name: 'Wheel_FL', drive: frontDrive },
      { name: 'Wheel_FR', drive: frontDrive },
      { name: 'Wheel_RL', drive: rearDrive },
      { name: 'Wheel_RR', drive: rearDrive },
    ].map((wheel) => ({ ...wheel, bounds: localPartBounds(wheel.name) }));

    const createAccent = (
      geometry: THREE.BufferGeometry,
      position: THREE.Vector3,
      color: number,
      startAt: number,
      endAt: number,
      baseOpacity: number,
    ) => {
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
        wireframe: geometry instanceof THREE.BoxGeometry,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.renderOrder = 25;
      powerflowGroup?.add(mesh);
      powerflowAccents.push({ mesh, material, startAt, endAt, baseOpacity });
      return mesh;
    };

    if (battery) {
      const size = battery.size.clone().multiplyScalar(1.06);
      createAccent(
        new THREE.BoxGeometry(Math.max(size.x, 0.18), Math.max(size.y, 0.12), Math.max(size.z, 0.18)),
        battery.center,
        0x7ffcf2,
        0,
        1.25,
        0.78,
      );
    }
    [frontDrive, rearDrive].forEach((drive) => {
      if (!drive) return;
      const radius = Math.max(drive.size.x, drive.size.y, drive.size.z) * 0.42;
      createAccent(
        new THREE.TorusGeometry(Math.max(radius, 0.14), Math.max(radius * 0.075, 0.018), 8, 28),
        drive.center,
        0xffc877,
        1.05,
        2.75,
        0.8,
      );
    });
    wheels.forEach(({ bounds }) => {
      if (!bounds) return;
      const radius = Math.max(bounds.size.x, bounds.size.y) * 0.42;
      const accent = createAccent(
        new THREE.TorusGeometry(Math.max(radius, 0.16), Math.max(radius * 0.055, 0.014), 8, 28),
        bounds.center,
        0x7ffcf2,
        2.35,
        3.8,
        0.74,
      );
      accent.userData.spin = true;
    });

    const createPath = (points: THREE.Vector3[], startAt: number, duration: number) => {
      const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.45);
      const tubeMaterial = new THREE.MeshBasicMaterial({
        color: 0x76f9ec,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.026, 6, false), tubeMaterial);
      tube.renderOrder = 26;
      powerflowGroup?.add(tube);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0xeafffc,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 8), particleMaterial);
      particle.renderOrder = 27;
      powerflowGroup?.add(particle);
      powerflowPaths.push({ curve, tubeMaterial, particle, startAt, duration });
    };

    if (battery && frontDrive) {
      const lift = Math.max(battery.size.y, frontDrive.size.y) * 0.3 + 0.05;
      createPath(
        [
          battery.center.clone().add(new THREE.Vector3(0, lift, 0)),
          new THREE.Vector3(
            (battery.center.x + frontDrive.center.x) * 0.55,
            battery.center.y + lift,
            battery.center.z * 0.55 + frontDrive.center.z * 0.45,
          ),
          frontDrive.center.clone().add(new THREE.Vector3(0, lift * 0.45, 0)),
          frontDrive.center.clone(),
        ],
        0.12,
        1.18,
      );
    }
    if (battery && rearDrive) {
      const lift = Math.max(battery.size.y, rearDrive.size.y) * 0.3 + 0.05;
      createPath(
        [
          battery.center.clone().add(new THREE.Vector3(0, lift, 0)),
          new THREE.Vector3(
            (battery.center.x + rearDrive.center.x) * 0.52,
            battery.center.y + lift,
            battery.center.z * 0.55 + rearDrive.center.z * 0.45,
          ),
          rearDrive.center.clone().add(new THREE.Vector3(0, lift * 0.45, 0)),
          rearDrive.center.clone(),
        ],
        0.28,
        1.25,
      );
    }
    wheels.forEach(({ bounds, drive }, index) => {
      if (!bounds || !drive) return;
      const midpoint = drive.center.clone().lerp(bounds.center, 0.58);
      midpoint.y = Math.max(drive.center.y, bounds.center.y) + 0.06;
      createPath([drive.center.clone(), midpoint, bounds.center.clone()], 1.35 + index * 0.08, 0.9);
    });
    modelRoot.updateMatrixWorld(true);
  };

  const prepareModel = (root: THREE.Object3D, size: THREE.Vector3) => {
    modelRoot = root;
    sensorWaveGroup = new THREE.Group();
    sensorWaveGroup.name = 'ADAS_RADAR_WAVE_FIELD';
    sensorWaveGroup.visible = false;
    sensorWaveGroup.renderOrder = 20;
    modelRoot.add(sensorWaveGroup);
    // Align the effect to the authored sensor nodes instead of estimating from the car bounds.
    // The exported GLB is Y-up: X = front/back, Z = left/right.
    modelRoot.updateMatrixWorld(true);
    const sensorAnchor = (names: string[], fallback: THREE.Vector3) => {
      const node = names.map((name) => modelRoot?.getObjectByName(name)).find(Boolean);
      if (!node || !modelRoot) return fallback;
      const worldPosition = node.getWorldPosition(new THREE.Vector3());
      return modelRoot.worldToLocal(worldPosition);
    };
    const roofSensor = sensorAnchor(
      ['Lidar_optical_window', 'Roof_lidar_housing'],
      new THREE.Vector3(0, size.y * 0.53, 0),
    );
    const frontSensor = sensorAnchor(
      ['Front_camera_optic', 'Closed_EV_sensor_fascia'],
      new THREE.Vector3(size.x * 0.47, size.y * 0.18, 0),
    );
    const leftSensor = sensorAnchor(
      ['Left_camera_optic'],
      new THREE.Vector3(size.x * 0.02, size.y * 0.28, size.z * 0.5),
    );
    const rightSensor = sensorAnchor(
      ['Right_camera_optic'],
      new THREE.Vector3(size.x * 0.02, size.y * 0.28, -size.z * 0.5),
    );
    createSensorPoint(sensorWaveGroup, roofSensor, 0xe9b56d, 0.15);
    createSensorPoint(sensorWaveGroup, frontSensor, 0x91d8d0, 0.42);
    createSensorPoint(sensorWaveGroup, leftSensor, 0x91d8d0, 0.66);
    createSensorPoint(sensorWaveGroup, rightSensor, 0x91d8d0, 0.84);
    [0, 0.33, 0.66].forEach((phase) =>
      createRadarWave(
        sensorWaveGroup!,
        roofSensor,
        new THREE.Euler(Math.PI / 2, 0, 0),
        0xe9b56d,
        size.z * 0.42,
        phase,
        2.35,
        1,
      ),
    );
    [0, 0.34, 0.68].forEach((phase) =>
      createRadarWave(
        sensorWaveGroup!,
        frontSensor,
        new THREE.Euler(0, Math.PI / 2, 0),
        0x91d8d0,
        size.y * 0.52,
        phase,
        1.65,
        0.48,
      ),
    );
    [0.12, 0.58].forEach((phase) =>
      createRadarWave(
        sensorWaveGroup!,
        leftSensor,
        new THREE.Euler(0, 0, 0),
        0x91d8d0,
        size.y * 0.32,
        phase,
        1.25,
        0.66,
      ),
    );
    [0.35, 0.81].forEach((phase) =>
      createRadarWave(
        sensorWaveGroup!,
        rightSensor,
        new THREE.Euler(0, 0, 0),
        0x91d8d0,
        size.y * 0.32,
        phase,
        1.25,
        0.66,
      ),
    );
    setupPowerflowEffects();
  };

  const update = (state: PowerflowState, focus: FocusKey) => {
    if (!state.playing) {
      if (powerflowGroup) powerflowGroup.visible = false;
      if (sensorWaveGroup) sensorWaveGroup.visible = focus === 'adas';
      wasPlaying = false;
      return;
    }
    if (!wasPlaying) {
      radarStarted = false;
      if (sensorWaveGroup) sensorWaveGroup.visible = false;
    }
    wasPlaying = true;
    if (powerflowGroup) powerflowGroup.visible = true;
    const powerflowElapsed = state.elapsedSeconds;
    const fadeOut = powerflowElapsed > 4.45 ? THREE.MathUtils.clamp((5 - powerflowElapsed) / 0.55, 0, 1) : 1;
    powerflowPaths.forEach((path) => {
      const progress = THREE.MathUtils.clamp((powerflowElapsed - path.startAt) / path.duration, 0, 1);
      const active = powerflowElapsed >= path.startAt;
      path.tubeMaterial.opacity = active ? 0.38 * Math.min(progress * 5, 1) * fadeOut : 0;
      path.particle.visible = active && progress < 1;
      path.curve.getPoint(progress, path.particle.position);
      path.particle.material.opacity = active && progress < 1 ? (0.95 - progress * 0.25) * fadeOut : 0;
    });
    powerflowAccents.forEach((accent) => {
      const duration = Math.max(accent.endAt - accent.startAt, 0.01);
      const progress = THREE.MathUtils.clamp((powerflowElapsed - accent.startAt) / duration, 0, 1);
      const active = powerflowElapsed >= accent.startAt && powerflowElapsed <= accent.endAt;
      const fade =
        Math.min(progress * 5, 1) *
        (progress > 0.82 ? THREE.MathUtils.clamp((1 - progress) / 0.18, 0, 1) : 1);
      accent.material.opacity = active ? accent.baseOpacity * fade * fadeOut : 0;
      if (accent.mesh.userData.spin) accent.mesh.rotation.z = powerflowElapsed * 8;
    });
    if (state.stageIndex === powerflowStages.length - 1 && !radarStarted) {
      radarStarted = true;
      resetRadarWaves();
      if (sensorWaveGroup) sensorWaveGroup.visible = true;
    }
  };

  // Meshes remain attached to the vehicle and are disposed by the existing scene scope.
  scope.add(() => {
    waveNodes.length = 0;
    sensorPoints.length = 0;
    powerflowPaths.length = 0;
    powerflowAccents.length = 0;
    sensorWaveGroup = null;
    powerflowGroup = null;
    modelRoot = null;
  });
  return {
    get group() {
      return powerflowGroup;
    },
    get sensorWaveGroup() {
      return sensorWaveGroup;
    },
    prepareModel,
    update,
    resetRadarWaves,
    updateRadarWaves,
  };
}

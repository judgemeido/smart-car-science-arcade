import * as THREE from 'three';
import type { createScope } from '../../shared/lifecycle';
import { disposeObject } from '../../shared/three-resources';
import { getTargetDistanceMeters, type MeterTarget } from './learning-measurement';
import type { LearningWeather } from './weather-state';

export interface LidarLearningWorld {
  setTargets(targets: readonly MeterTarget[]): void;
  setVisible(value: boolean): void;
  setScanRunning(value: boolean): void;
  setWeather(weather: LearningWeather): void;
  setSelectedTarget(id: string | null): void;
  update(deltaSeconds: number): void;
  pickCandidates(): THREE.Object3D[];
  getTargetPosition(id: string): THREE.Vector3 | null;
}

export function createLidarLearningWorld(
  parent: THREE.Group,
  scope: ReturnType<typeof createScope>,
): LidarLearningWorld {
  const root = new THREE.Group();
  root.name = 'LIDAR_LEARNING_WORLD';
  root.scale.setScalar(0.09);
  root.position.set(0, -0.65, 1.3);
  root.visible = false;
  parent.add(root);
  const targetsGroup = new THREE.Group();
  root.add(targetsGroup);
  let targets: readonly MeterTarget[] = [];
  let candidates: THREE.Object3D[] = [];
  let weather: LearningWeather = 'normal';
  let running = true;
  let selectedId: string | null = null;
  const groups = new Map<string, THREE.Group>();

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 40),
    new THREE.MeshBasicMaterial({ color: 0x193b38, transparent: true, opacity: 0.85 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.1, -15);
  root.add(ground);
  const sensor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.7, 1.1, 12),
    new THREE.MeshStandardMaterial({ color: 0xf5c474, emissive: 0x634520 }),
  );
  sensor.position.y = 0.55;
  root.add(sensor);
  const sweep = new THREE.Group();
  sweep.name = 'LEARNING_SWEEP';
  const rayGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.3, 0),
    new THREE.Vector3(0, 0.3, -34),
  ]);
  sweep.add(
    new THREE.Line(
      rayGeometry,
      new THREE.LineBasicMaterial({ color: 0x91f4d6, transparent: true, opacity: 0.7 }),
    ),
  );
  root.add(sweep);
  const noisePositions: number[] = [];
  // Fixed deterministic samples, used solely for a qualitative rain illustration.
  for (let index = 0; index < 160; index++)
    noisePositions.push(
      ((index * 73) % 211) / 10 - 10.5,
      ((index * 37) % 43) / 12,
      -((index * 53) % 317) / 10,
    );
  const noiseGeometry = new THREE.BufferGeometry();
  noiseGeometry.setAttribute('position', new THREE.Float32BufferAttribute(noisePositions, 3));
  const rainEchoes = new THREE.Points(
    noiseGeometry,
    new THREE.PointsMaterial({ color: 0x87aedd, size: 0.11, transparent: true, opacity: 0.7 }),
  );
  rainEchoes.name = 'LEARNING_RAIN_ECHOES';
  rainEchoes.visible = false;
  root.add(rainEchoes);

  const addShape = (
    group: THREE.Group,
    geometry: THREE.BufferGeometry,
    position: THREE.Vector3,
    color: number,
  ) => {
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color,
        wireframe: true,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      }),
    );
    mesh.position.copy(position);
    mesh.userData.targetId = group.name;
    const cloud = new THREE.Points(
      geometry,
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          color: { value: new THREE.Color(color) },
          weather: { value: 0 },
          farTarget: { value: false },
        },
        vertexShader: `varying float sampleId;
        void main() {
          sampleId = fract(sin(dot(position, vec3(12.9898, 78.233, 39.425))) * 43758.5453);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 4.0;
        }`,
        fragmentShader: `uniform vec3 color; uniform float weather; uniform bool farTarget; varying float sampleId;
        void main() {
          if (length(gl_PointCoord - vec2(0.5)) > 0.5) discard;
          if (weather == 1.0 && sampleId < 0.18) discard;
          if (weather == 2.0 && farTarget && sampleId < 0.56) discard;
          gl_FragColor = vec4(color, weather == 2.0 && farTarget ? 0.48 : 0.9);
        }`,
      }),
    );
    cloud.position.copy(mesh.position);
    cloud.userData.targetId = group.name;
    group.add(mesh, cloud);
    candidates.push(mesh);
  };
  const applyAppearance = () => {
    rainEchoes.visible = weather === 'rain';
    const distances = targets.map((target) => getTargetDistanceMeters(target, { x: 0, y: 0, z: 0 }));
    const farDistance = Math.max(...distances, 1);
    targets.forEach((target, index) => {
      const group = groups.get(target.id)!;
      const far = distances[index] > farDistance * 0.7;
      group.traverse((object) => {
        if (object instanceof THREE.Points) {
          const material = object.material as THREE.ShaderMaterial;
          material.uniforms.weather.value = weather === 'normal' ? 0 : weather === 'rain' ? 1 : 2;
          material.uniforms.farTarget.value = far;
          material.uniforms.color.value.set(target.id === selectedId ? 0xffd58e : 0x8ce8d3);
        } else if (object instanceof THREE.Mesh) {
          const material = object.material as THREE.MeshStandardMaterial;
          material.color.set(target.id === selectedId ? 0xffd58e : 0x68c8b8);
          material.opacity = weather === 'fog' && far ? 0.06 : 0.22;
        }
      });
    });
  };
  const setTargets = (next: readonly MeterTarget[]) => {
    disposeObject(targetsGroup);
    targetsGroup.clear();
    groups.clear();
    candidates = [];
    targets = next;
    targets.forEach((target) => {
      const group = new THREE.Group();
      group.name = target.id;
      group.userData.targetId = target.id;
      group.position.set(target.positionMeters.x, target.positionMeters.y, target.positionMeters.z);
      targetsGroup.add(group);
      groups.set(target.id, group);
      const shape = (geometry: THREE.BufferGeometry, x: number, y: number, z: number) =>
        addShape(group, geometry, new THREE.Vector3(x, y, z), 0x8ce8d3);
      if (target.id === 'world-car') {
        shape(new THREE.BoxGeometry(2, 1.1, 4, 6, 3, 10), 0, 0.8, 0);
        shape(new THREE.BoxGeometry(1.6, 0.9, 2, 4, 3, 5), 0, 1.8, 0);
      } else if (target.id === 'world-person') {
        shape(new THREE.CylinderGeometry(0.28, 0.35, 1.2, 14, 7), 0, 0.8, 0);
        shape(new THREE.SphereGeometry(0.3, 14, 10), 0, 1.7, 0);
      } else if (target.id === 'world-tree') {
        shape(new THREE.CylinderGeometry(0.22, 0.3, 2, 10, 6), 0, 1, 0);
        shape(new THREE.ConeGeometry(1.3, 2.6, 18, 9), 0, 2.6, 0);
      } else {
        // Equal reference geometry makes apparent size a poor substitute for measured distance.
        shape(new THREE.BoxGeometry(1.5, 1.25, 0.5, 6, 5, 2), 0, 0.625, 0);
      }
      shape(new THREE.SphereGeometry(0.11, 6, 4), 0, 0, 0);
    });
    root.updateMatrixWorld(true);
    applyAppearance();
  };
  scope.add(() => {
    parent.remove(root);
    disposeObject(root);
    groups.clear();
    candidates = [];
  });
  return {
    setTargets,
    setVisible: (value) => {
      root.visible = value;
    },
    setScanRunning: (value) => {
      running = value;
    },
    setWeather: (value) => {
      weather = value;
      applyAppearance();
    },
    setSelectedTarget: (id) => {
      selectedId = id;
      applyAppearance();
    },
    update: (delta) => {
      if (root.visible && running) sweep.rotation.y += delta * 1.1;
    },
    pickCandidates: () => candidates,
    getTargetPosition: (id) => groups.get(id)?.getWorldPosition(new THREE.Vector3()) ?? null,
  };
}

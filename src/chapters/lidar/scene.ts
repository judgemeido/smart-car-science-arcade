import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { disposeObject, disposeRenderer } from '../../shared/three-resources';
import type { createScope } from '../../shared/lifecycle';

export function createScene(canvas: HTMLCanvasElement, scope: ReturnType<typeof createScope>) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#17211f');
  scene.add(new THREE.HemisphereLight(0xf7f4ec, 0x374541, 2.6));
  const key = new THREE.DirectionalLight(0xfff1dc, 4.1);
  key.position.set(3.8, 5.5, 4.4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x83d9cc, 2.8);
  rim.position.set(-4, 2.5, -3.5);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xf6f7f0, 1.45);
  fill.position.set(-1.5, 1.6, 4.5);
  scene.add(fill);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  scope.add(() => disposeRenderer(renderer));
  // The scope disposes in reverse: scene GPU resources must go before renderer maps.
  scope.add(() => disposeObject(scene));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.32;

  const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 60);
  camera.position.set(3.9, 2.2, 4.55);
  const controls = new OrbitControls(camera, canvas);
  scope.add(() => controls.dispose());
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 0.85;
  controls.maxDistance = 5.8;
  controls.minPolarAngle = 0.1;
  controls.maxPolarAngle = Math.PI * 0.78;
  controls.target.set(0, 0.02, 0);
  const homeMaxDistance = controls.maxDistance;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x1c2421, roughness: 0.95, metalness: 0.02 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.82;
  scene.add(ground);
  const exhibitPedestal = new THREE.Group();
  exhibitPedestal.name = 'MUSEUM_EXHIBIT_PEDESTAL';
  scene.add(exhibitPedestal);
  const pedestalMaterials = {
    body: new THREE.MeshStandardMaterial({ color: 0x292d2b, roughness: 0.42, metalness: 0.46 }),
    top: new THREE.MeshStandardMaterial({ color: 0x454a46, roughness: 0.34, metalness: 0.52 }),
    trim: new THREE.MeshStandardMaterial({
      color: 0x9f7650,
      roughness: 0.28,
      metalness: 0.72,
      emissive: 0x1b0c04,
      emissiveIntensity: 0.25,
    }),
  };

  const modelGroup = new THREE.Group();
  modelGroup.name = 'LIDAR_ASSEMBLY';
  scene.add(modelGroup);
  const conceptGroup = new THREE.Group();
  conceptGroup.name = 'LIDAR_CONCEPTUAL_PARTS';
  conceptGroup.visible = false;
  modelGroup.add(conceptGroup);
  const scanGroup = new THREE.Group();
  scanGroup.name = 'LIDAR_SCAN_LAYER';
  // Enlarge the schematic scan footprint around the sensor without changing the model scale.
  scanGroup.scale.set(1.55, 1, 1.55);
  scanGroup.visible = false;
  scene.add(scanGroup);

  return {
    scene,
    renderer,
    camera,
    controls,
    homeMaxDistance,
    ground,
    exhibitPedestal,
    pedestalMaterials,
    modelGroup,
    conceptGroup,
    scanGroup,
  };
}

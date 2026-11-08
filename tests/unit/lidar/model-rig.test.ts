import * as THREE from 'three';
import { expect, it, vi } from 'vitest';
import { createModelRig, type LidarRigScene } from '../../../src/chapters/lidar/model-rig';
import { createExperimentState, reduceExperiment } from '../../../src/chapters/lidar/experiment-state';
import { createScope } from '../../../src/shared/lifecycle';
import { disposeObject } from '../../../src/shared/three-resources';

function fixture() {
  const scene = new THREE.Scene();
  const modelGroup = new THREE.Group();
  const conceptGroup = new THREE.Group();
  const scanGroup = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(), new THREE.MeshStandardMaterial());
  const exhibitPedestal = new THREE.Group();
  const camera = new THREE.PerspectiveCamera(38);
  camera.position.set(2.25, 1.15, 3.1);
  const controls = {
    target: new THREE.Vector3(),
    maxDistance: 5.8,
    update: vi.fn(),
    saveState: vi.fn(),
    reset: vi.fn(),
  };
  scene.add(modelGroup, scanGroup, ground, exhibitPedestal);
  modelGroup.add(conceptGroup);
  const context = {
    scene,
    modelGroup,
    conceptGroup,
    scanGroup,
    ground,
    exhibitPedestal,
    camera,
    controls,
    homeMaxDistance: 5.8,
    getStageWidth: () => 1200,
    pedestalMaterials: {
      body: new THREE.MeshStandardMaterial(),
      top: new THREE.MeshStandardMaterial(),
      trim: new THREE.MeshStandardMaterial(),
    },
  } as unknown as LidarRigScene;
  const scope = createScope();
  const rig = createModelRig(context, scope);
  return {
    rig,
    context,
    controls,
    scope,
    cleanup: () => {
      scope.dispose();
      disposeObject(scene);
    },
  };
}

it('maps modes to the existing conceptual parts, hotspots and exploded camera', () => {
  const { rig, context, controls, cleanup } = fixture();
  try {
    const initialPosition = context.camera.position.clone();
    const initial = createExperimentState();
    rig.apply(initial);
    expect(context.conceptGroup.visible).toBe(false);
    const exploded = reduceExperiment(initial, { type: 'mode', mode: 'exploded' });
    rig.apply(exploded);
    rig.update(exploded, 1);
    expect(context.conceptGroup.visible).toBe(true);
    expect(context.camera.position.distanceTo(controls.target)).toBeCloseTo(4.35);
    const motor = context.conceptGroup.getObjectByName('lidar_motor')!;
    expect(motor.position.z).toBeGreaterThan(0.01);
    expect(rig.pickCandidates(exploded).length).toBe(9);
    rig.apply(reduceExperiment(exploded, { type: 'mode', mode: 'cutaway' }));
    expect(context.camera.position.distanceTo(initialPosition)).toBeCloseTo(0);
    expect(controls.maxDistance).toBe(5.8);
    rig.resetCamera();
    expect(controls.reset).toHaveBeenCalledOnce();
  } finally {
    cleanup();
  }
});

it('normalizes the three licensed parts and retains their pick IDs and opacity policy', () => {
  const { rig, context, cleanup } = fixture();
  try {
    const parts = [0, 1, 2].map(() => {
      const root = new THREE.Group();
      root.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial()));
      return root;
    });
    rig.installLicensedParts(parts);
    const cutaway = reduceExperiment(createExperimentState(), { type: 'mode', mode: 'cutaway' });
    rig.apply(cutaway);
    expect(context.modelGroup.getObjectByName('VLP16_scan')?.userData.partId).toBe('VLP16_scan');
    const mesh = parts[2].children[0] as THREE.Mesh;
    const material = (
      Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
    ) as THREE.MeshStandardMaterial;
    expect(material.opacity).toBe(0.15);
    rig.apply(createExperimentState());
    expect(material.opacity).toBe(1);
  } finally {
    cleanup();
  }
});

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { describe, expect, it } from 'vitest';
import {
  captureLidarCamera,
  restoreLidarCamera,
  installWithLearningCamera,
} from '../../../src/chapters/lidar/learning-camera';
import { createModelRig, type LidarRigScene } from '../../../src/chapters/lidar/model-rig';
import { createExperimentState } from '../../../src/chapters/lidar/experiment-state';
import { createScope } from '../../../src/shared/lifecycle';
import { disposeObject } from '../../../src/shared/three-resources';

describe('relinquishing the teaching camera with real OrbitControls', () => {
  for (const motion of ['rotate', 'pan', 'rotate and pan'] as const) {
    it(`clears pending ${motion} before restoring the original observation`, () => {
      const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 60);
      camera.position.set(3, 2, 4);
      const controls = new OrbitControls(camera, null);
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.minDistance = 0.85;
      controls.maxDistance = 5.8;
      controls.minPolarAngle = 0.1;
      controls.maxPolarAngle = Math.PI * 0.78;
      controls.target.set(0, 0.02, 0);
      controls.update();
      camera.updateMatrixWorld(true);
      const original = captureLidarCamera(camera, controls);
      const matrix = camera.matrixWorld.clone();
      camera.position.set(3.5, 3.8, 4.7);
      controls.target.set(0, 0, -0.35);
      controls.minDistance = 1.8;
      controls.maxDistance = 9;
      controls.update();
      // These installed controls methods are the same delta producers used by
      // pointer movement. Keep the real update/damping behavior in this test.
      const input = controls as unknown as {
        _rotateLeft(angle: number): void;
        _panLeft(distance: number, matrix: THREE.Matrix4): void;
      };
      if (motion.includes('rotate')) input._rotateLeft(0.5);
      if (motion.includes('pan')) input._panLeft(0.8, camera.matrix);
      controls.update();
      restoreLidarCamera(camera, controls, original);
      for (let frame = 0; frame < 121; frame++) {
        controls.update();
        camera.updateMatrixWorld(true);
        expect(camera.position.distanceTo(original.position)).toBeLessThan(1e-10);
        expect(controls.target.distanceTo(original.target)).toBeLessThan(1e-10);
        for (let index = 0; index < 16; index++)
          expect(camera.matrixWorld.elements[index]).toBeCloseTo(matrix.elements[index], 10);
      }
      expect(controls.enableDamping).toBe(true);
      expect(controls.dampingFactor).toBe(0.07);
      expect(controls.autoRotate).toBe(false);
      expect(controls.minDistance).toBe(0.85);
      expect(controls.maxDistance).toBe(5.8);
      expect(controls.minPolarAngle).toBe(0.1);
      expect(controls.maxPolarAngle).toBe(Math.PI * 0.78);
    });
  }
});

describe('teaching camera ownership during successful model fitting', () => {
  it('does not end teaching inertia during a snapshot-only model installation transaction', () => {
    const fixtures = [0, 1].map(() => {
      const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 60);
      camera.position.set(3, 2, 4);
      const controls = new OrbitControls(camera, null);
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.minDistance = 0.85;
      controls.maxDistance = 5.8;
      controls.update();
      const original = captureLidarCamera(camera, controls);
      camera.position.set(3.5, 3.8, 4.7);
      controls.target.set(0, 0, -0.35);
      controls.minDistance = 1.8;
      controls.maxDistance = 9;
      controls.update();
      const input = controls as unknown as {
        _rotateLeft(angle: number): void;
        _panLeft(distance: number, matrix: THREE.Matrix4): void;
      };
      input._rotateLeft(0.5);
      input._panLeft(0.8, camera.matrix);
      controls.update();
      return { camera, controls, original };
    });
    const [active, uninterrupted] = fixtures;
    const teaching = captureLidarCamera(active.camera, active.controls);
    const fitted = installWithLearningCamera(active.camera, active.controls, active.original, () => {
      active.camera.position.set(2, 1, 3);
      active.controls.target.set(0, 0.015, 0);
      active.camera.near = 0.03;
      active.camera.far = 40;
      active.camera.zoom = 1.2;
    })!;
    expect(captureLidarCamera(active.camera, active.controls)).toEqual(teaching);
    expect(fitted.position.toArray()).toEqual([2, 1, 3]);
    expect(fitted.target.toArray()).toEqual([0, 0.015, 0]);
    expect(fitted.minDistance).toBe(0.85);
    expect(fitted.maxDistance).toBe(5.8);
    expect([fitted.near, fitted.far, fitted.zoom]).toEqual([0.03, 40, 1.2]);
    active.controls.update();
    uninterrupted.controls.update();
    expect(active.camera.position.distanceTo(uninterrupted.camera.position)).toBeLessThan(1e-10);
    expect(active.controls.target.distanceTo(uninterrupted.controls.target)).toBeLessThan(1e-10);
    expect(active.camera.position.distanceTo(teaching.position)).toBeGreaterThan(0.01);
  });

  it('keeps the active teaching view and restores the newly fitted original view on exit', () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 60);
    camera.position.set(3.9, 2.2, 4.55);
    let resetPosition = camera.position.clone();
    let resetTarget = new THREE.Vector3();
    const controls = {
      target: new THREE.Vector3(),
      minDistance: 0.85,
      maxDistance: 5.8,
      enableDamping: true,
      autoRotate: false,
      update: () => {
        camera.lookAt(controls.target);
        camera.updateMatrixWorld(true);
      },
      saveState: () => {
        resetPosition = camera.position.clone();
        resetTarget = controls.target.clone();
      },
      reset: () => {
        camera.position.copy(resetPosition);
        controls.target.copy(resetTarget);
        controls.update();
      },
    };
    const modelGroup = new THREE.Group();
    const conceptGroup = new THREE.Group();
    const scanGroup = new THREE.Group();
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(), new THREE.MeshStandardMaterial());
    const exhibitPedestal = new THREE.Group();
    modelGroup.add(conceptGroup);
    scene.add(modelGroup, scanGroup, ground, exhibitPedestal);
    const scope = createScope();
    const rig = createModelRig(
      {
        scene,
        camera,
        controls,
        modelGroup,
        conceptGroup,
        scanGroup,
        ground,
        exhibitPedestal,
        homeMaxDistance: 5.8,
        getStageWidth: () => 1200,
        pedestalMaterials: {
          body: new THREE.MeshStandardMaterial(),
          top: new THREE.MeshStandardMaterial(),
          trim: new THREE.MeshStandardMaterial(),
        },
      } as unknown as LidarRigScene,
      scope,
    );
    const original = captureLidarCamera(camera, controls);
    camera.position.set(3.5, 3.8, 4.7);
    controls.target.set(0, 0, -0.35);
    controls.minDistance = 1.8;
    controls.maxDistance = 9;
    controls.update();
    const teaching = captureLidarCamera(camera, controls);
    try {
      const fitted = installWithLearningCamera(camera, controls, original, () => {
        rig.installLicensedParts(
          [0, 1, 2].map(() => {
            const part = new THREE.Group();
            part.add(new THREE.Mesh(new THREE.BoxGeometry(1, 2, 3), new THREE.MeshStandardMaterial()));
            return part;
          }),
        );
        rig.apply(createExperimentState());
      })!;
      expect(captureLidarCamera(camera, controls)).toEqual(teaching);
      expect(fitted.position.toArray()).toEqual(resetPosition.toArray());
      expect(fitted.target.toArray()).toEqual(resetTarget.toArray());
      expect(fitted.position.distanceTo(original.position)).toBeGreaterThan(0.5);
      expect(fitted.minDistance).toBe(0.85);
      expect(fitted.maxDistance).toBe(5.8);
      expect(fitted.near).not.toBe(teaching.near);
      expect(fitted.far).not.toBe(teaching.far);
      restoreLidarCamera(camera, controls, fitted);
      expect(camera.position.toArray()).toEqual(resetPosition.toArray());
      expect(camera.near).toBe(fitted.near);
      expect(camera.far).toBe(fitted.far);
    } finally {
      scope.dispose();
      disposeObject(scene);
    }
  });

  it('restores the active teaching view if installation fails', () => {
    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 60);
    const controls = {
      target: new THREE.Vector3(),
      minDistance: 1,
      maxDistance: 9,
      enableDamping: true,
      autoRotate: false,
      update: () => {},
    };
    const original = captureLidarCamera(camera, controls);
    camera.position.set(3.5, 3.8, 4.7);
    const teaching = captureLidarCamera(camera, controls);
    expect(() =>
      installWithLearningCamera(camera, controls, original, () => {
        camera.position.set(1, 1, 1);
        camera.near = 0.05;
        throw new Error('install failed');
      }),
    ).toThrow('install failed');
    expect(captureLidarCamera(camera, controls)).toEqual(teaching);
  });
});

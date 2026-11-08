import * as THREE from 'three';
import { expect, it, vi } from 'vitest';
import { disposeObject } from '../../src/shared/three-resources';

it('releases shared geometry, materials and textures once', () => {
  const texture = new THREE.Texture();
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshStandardMaterial({ map: texture, normalMap: texture });
  const spies = [texture, geometry, material].map((resource) => vi.spyOn(resource, 'dispose'));
  const root = new THREE.Group();
  root.add(new THREE.Mesh(geometry, material), new THREE.Mesh(geometry, [material, material]));
  disposeObject(root);
  spies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1));
});

it('releases per-instance buffers and shadow render targets with the scene', () => {
  const instances = new THREE.InstancedMesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial(), 2);
  instances.setColorAt(0, new THREE.Color('red'));
  const light = new THREE.DirectionalLight();
  light.shadow.map = new THREE.WebGLRenderTarget(16, 16);
  light.shadow.mapPass = new THREE.WebGLRenderTarget(16, 16);
  const instancesDispose = vi.spyOn(instances, 'dispose');
  const mapDispose = vi.spyOn(light.shadow.map, 'dispose');
  const passDispose = vi.spyOn(light.shadow.mapPass, 'dispose');
  const root = new THREE.Scene();
  root.add(instances, light);
  disposeObject(root);
  expect(instancesDispose).toHaveBeenCalledTimes(1);
  expect(mapDispose).toHaveBeenCalledTimes(1);
  expect(passDispose).toHaveBeenCalledTimes(1);
});

import * as THREE from 'three';

/** Release renderer-owned placeholders/scratch targets with its abandoned context. */
export function disposeRenderer(renderer: THREE.WebGLRenderer) {
  try {
    renderer.dispose();
  } finally {
    renderer.forceContextLoss();
  }
}

/** A scene may share materials/textures across hundreds of meshes. Release each once. */
export function disposeObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const instances = new Set<THREE.InstancedMesh>();
  const shadows = new Set<THREE.LightShadow>();
  root.traverse((object) => {
    if (object instanceof THREE.InstancedMesh) instances.add(object);
    const light = object as THREE.DirectionalLight;
    if (light.shadow) shadows.add(light.shadow);
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    const values = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    values.forEach((material) => {
      materials.add(material);
      Object.values(material).forEach((value: unknown) => {
        if (value instanceof THREE.Texture) textures.add(value);
      });
    });
  });
  instances.forEach((instance) => instance.dispose());
  shadows.forEach((shadow) => shadow.dispose());
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
}

import * as THREE from 'three';
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js';
import { assetUrl, fetchAsset } from '../../shared/assets';
export const makeMaterial = (color: number, roughness = 0.42, metalness = 0.7) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    envMapIntensity: 1.15,
  });

export const setMaterialOpacity = (root: THREE.Object3D, opacity: number) => {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.material) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      material.transparent = opacity < 1;
      material.opacity = opacity;
      material.depthWrite = opacity >= 0.8;
      material.needsUpdate = true;
    });
  });
};

export const asSafeColladaXml = (source: string) => {
  // A few ROS exports contain the literal `<STL_BINARY>` in an XML attribute.
  // Escape only that known exporter token rather than changing the shipped asset.
  return source.replace(/<STL_BINARY>/g, 'STL_BINARY').replace(/<\/STL_BINARY>/g, 'STL_BINARY');
};

export const loadDae = async (path: string, signal?: AbortSignal): Promise<THREE.Object3D> => {
  path = assetUrl(path);
  const data = await fetchAsset(path, { signal });
  const xml = asSafeColladaXml(new TextDecoder().decode(data));
  const result = new ColladaLoader().parse(xml, path.slice(0, path.lastIndexOf('/') + 1));
  return result.scene;
};

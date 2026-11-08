import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { assetUrl, fetchAsset, type AssetOptions } from './assets';
import { disposeObject } from './three-resources';

export async function loadGltf(path: string, options: AssetOptions = {}) {
  const url = assetUrl(path);
  const data = await fetchAsset(url, options);
  const gltf = await new GLTFLoader().parseAsync(data, new URL('.', new URL(url, location.href)).href);
  if (options.signal?.aborted) {
    disposeObject(gltf.scene);
    throw options.signal.reason;
  }
  return gltf;
}

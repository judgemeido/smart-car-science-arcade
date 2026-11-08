import * as THREE from 'three';

export interface LidarCameraControls {
  readonly target: THREE.Vector3;
  minDistance: number;
  maxDistance: number;
  enableDamping: boolean;
  autoRotate: boolean;
  update(): unknown;
}
export interface LidarCameraSnapshot {
  readonly position: THREE.Vector3;
  readonly target: THREE.Vector3;
  readonly minDistance: number;
  readonly maxDistance: number;
  readonly near: number;
  readonly far: number;
  readonly zoom: number;
}

export function captureLidarCamera(
  camera: THREE.PerspectiveCamera,
  controls: LidarCameraControls,
): LidarCameraSnapshot {
  return {
    position: camera.position.clone(),
    target: controls.target.clone(),
    minDistance: controls.minDistance,
    maxDistance: controls.maxDistance,
    near: camera.near,
    far: camera.far,
    zoom: camera.zoom,
  };
}

export function restoreLidarCamera(
  camera: THREE.PerspectiveCamera,
  controls: LidarCameraControls,
  snapshot: LidarCameraSnapshot,
): void {
  // Relinquishing teaching ownership must also clear its pending rotate/pan
  // inertia. Consume it through the public update before applying the saved view.
  const damping = controls.enableDamping;
  const autoRotate = controls.autoRotate;
  controls.enableDamping = false;
  controls.autoRotate = false;
  try {
    controls.update();
  } finally {
    controls.enableDamping = damping;
    controls.autoRotate = autoRotate;
  }
  applyLidarCameraSnapshot(camera, controls, snapshot);
}

function applyLidarCameraSnapshot(
  camera: THREE.PerspectiveCamera,
  controls: LidarCameraControls,
  snapshot: LidarCameraSnapshot,
): void {
  camera.position.copy(snapshot.position);
  controls.target.copy(snapshot.target);
  controls.minDistance = snapshot.minDistance;
  controls.maxDistance = snapshot.maxDistance;
  camera.near = snapshot.near;
  camera.far = snapshot.far;
  camera.zoom = snapshot.zoom;
  camera.updateProjectionMatrix();
  // Render the saved view without advancing controls during a model transaction.
  camera.lookAt(controls.target);
  camera.updateMatrixWorld(true);
}

/** Model normalization may fit/save the original view while teaching owns the shared camera. */
export function installWithLearningCamera(
  camera: THREE.PerspectiveCamera,
  controls: LidarCameraControls,
  original: LidarCameraSnapshot | null,
  install: () => void,
): LidarCameraSnapshot | null {
  if (!original) {
    install();
    return null;
  }
  const teaching = captureLidarCamera(camera, controls);
  applyLidarCameraSnapshot(camera, controls, original);
  try {
    install();
    // Keep the fitted original view, including clipping, for closing the teaching scene.
    // The model rig's saveState remains the fitted original reset position.
    return captureLidarCamera(camera, controls);
  } finally {
    applyLidarCameraSnapshot(camera, controls, teaching);
  }
}

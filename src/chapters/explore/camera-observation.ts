import type * as THREE from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function captureCameraObservation(camera: THREE.PerspectiveCamera, controls: OrbitControls) {
  return {
    position: camera.position.clone(),
    quaternion: camera.quaternion.clone(),
    up: camera.up.clone(),
    zoom: camera.zoom,
    target: controls.target.clone(),
    cursor: controls.cursor.clone(),
    constraints: {
      minDistance: controls.minDistance,
      maxDistance: controls.maxDistance,
      minZoom: controls.minZoom,
      maxZoom: controls.maxZoom,
      minPolarAngle: controls.minPolarAngle,
      maxPolarAngle: controls.maxPolarAngle,
      minAzimuthAngle: controls.minAzimuthAngle,
      maxAzimuthAngle: controls.maxAzimuthAngle,
      minTargetRadius: controls.minTargetRadius,
      maxTargetRadius: controls.maxTargetRadius,
      screenSpacePanning: controls.screenSpacePanning,
      enableDamping: controls.enableDamping,
      dampingFactor: controls.dampingFactor,
      autoRotate: controls.autoRotate,
    },
  };
}
export type CameraObservation = ReturnType<typeof captureCameraObservation>;

export function restoreCameraObservation(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  snapshot: CameraObservation,
): void {
  // Consume temporary orbit/pan damping before putting the original camera back.
  // Otherwise the next ordinary render could drift away from the restored view.
  controls.autoRotate = false;
  controls.enableDamping = false;
  controls.update();
  const { autoRotate, ...constraints } = snapshot.constraints;
  Object.assign(controls, constraints);
  controls.target.copy(snapshot.target);
  controls.cursor.copy(snapshot.cursor);
  camera.position.copy(snapshot.position);
  camera.quaternion.copy(snapshot.quaternion);
  camera.up.copy(snapshot.up);
  camera.zoom = snapshot.zoom;
  camera.updateProjectionMatrix();
  controls.update();
  controls.autoRotate = autoRotate;
  camera.updateMatrixWorld(true);
}

import * as THREE from 'three';
import { createConceptParts } from './concept';
import { setMaterialOpacity } from './model';
import { partCatalog, type LidarMode } from './data';
import type { ExperimentState } from './experiment-state';
import type { createScene } from './scene';
import type { createScope } from '../../shared/lifecycle';

export type LidarRigScene = Pick<
  ReturnType<typeof createScene>,
  | 'scene'
  | 'camera'
  | 'controls'
  | 'homeMaxDistance'
  | 'ground'
  | 'exhibitPedestal'
  | 'pedestalMaterials'
  | 'modelGroup'
  | 'conceptGroup'
  | 'scanGroup'
> & {
  getStageWidth(): number;
};

export function createModelRig(context: LidarRigScene, scope: ReturnType<typeof createScope>) {
  const {
    scene,
    camera,
    controls,
    homeMaxDistance,
    ground,
    exhibitPedestal,
    pedestalMaterials,
    modelGroup,
    conceptGroup,
    scanGroup,
    getStageWidth,
  } = context;
  let modelRoot: THREE.Object3D | null = null;
  const licensedComponentRoots = new Map<string, THREE.Object3D>();
  const componentOffsetTargets = new Map<string, number>();
  let modelScaleFactor = 1;
  let animationTime = 0;
  // This cache tracks the applied camera transition, not experiment progress.
  let displayedMode: LidarMode | null = null;
  let preExplodedCamera: { position: THREE.Vector3; target: THREE.Vector3 } | null = null;
  const normalizeModel = (root: THREE.Object3D) => {
    // The ROS mesh headers say Y-up, but these vertices are authored in a
    // Z-up frame. Rotating the complete licensed assembly keeps the stack
    // aligned while preserving the source proportions.
    root.rotation.x = -Math.PI / 2;
    root.rotation.y = 0;
    root.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mesh.material = sourceMaterials.map((source) => {
        const sourceColor = (source as THREE.MeshStandardMaterial).color?.getHex?.() ?? 0x4b5857;
        const displayColor = new THREE.Color(sourceColor).lerp(new THREE.Color(0x465653), 0.7);
        const partId = String(mesh.userData.partId ?? '');
        const partFinish =
          partId === 'VLP16_base_1' ? 0x59615f : partId === 'VLP16_base_2' ? 0xc4c4ba : 0x313d3b;
        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(partFinish).lerp(displayColor, 0.28),
          roughness: partId === 'VLP16_scan' ? 0.22 : 0.34,
          metalness: partId === 'VLP16_base_2' ? 0.5 : 0.34,
        });
        return material;
      });
    });
    const bounds = new THREE.Box3().setFromObject(root);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z, 0.001);
    modelScaleFactor = 1.7 / maxSize;
    root.scale.setScalar(modelScaleFactor);
    root.updateMatrixWorld(true);
    const scaledBounds = new THREE.Box3().setFromObject(root);
    const scaledCenter = scaledBounds.getCenter(new THREE.Vector3());
    root.position.sub(scaledCenter);
    root.updateMatrixWorld(true);
    const sphere = new THREE.Sphere();
    new THREE.Box3().setFromObject(root).getBoundingSphere(sphere);
    controls.target.copy(sphere.center).add(new THREE.Vector3(0, 0.015, 0));
    const distance = Math.max(
      2.35,
      (sphere.radius / Math.sin(THREE.MathUtils.degToRad(camera.fov * 0.5))) * 1.22,
    );
    const viewDirection = new THREE.Vector3(2.25, 1.15, 3.1).normalize();
    camera.position.copy(sphere.center).addScaledVector(viewDirection, distance);
    camera.near = Math.max(0.01, distance / 150);
    camera.far = distance * 12;
    camera.updateProjectionMatrix();
    controls.update();
    controls.saveState();
    const fittedBounds = new THREE.Box3().setFromObject(root);
    const fittedSize = fittedBounds.getSize(new THREE.Vector3());
    const modelBottom = fittedBounds.min.y;
    const platformRadius = Math.max(fittedSize.x, fittedSize.z) * 0.66;
    const platformHeight = Math.max(0.07, fittedSize.y * 0.085);
    const platformTop = modelBottom + 0.008;
    const platformBody = new THREE.Mesh(
      new THREE.CylinderGeometry(platformRadius, platformRadius * 1.12, platformHeight, 96),
      pedestalMaterials.body,
    );
    platformBody.position.y = platformTop - platformHeight * 0.5;
    platformBody.castShadow = true;
    exhibitPedestal.add(platformBody);
    ground.position.y = platformTop - platformHeight - 0.028;
    const platformCap = new THREE.Mesh(
      new THREE.CylinderGeometry(platformRadius * 0.97, platformRadius, 0.025, 96),
      pedestalMaterials.top,
    );
    platformCap.position.y = platformTop - 0.006;
    platformCap.castShadow = true;
    platformCap.receiveShadow = true;
    exhibitPedestal.add(platformCap);
    const trim = new THREE.Mesh(
      new THREE.TorusGeometry(platformRadius * 1.095, 0.007, 8, 96),
      pedestalMaterials.trim,
    );
    trim.rotation.x = Math.PI / 2;
    trim.position.y = platformTop - platformHeight + 0.012;
    exhibitPedestal.add(trim);
    modelGroup.rotation.y = Math.PI * 0.12;
    conceptGroup.position.copy(root.position);
    conceptGroup.rotation.x = -Math.PI / 2;
    conceptGroup.rotation.y = 0;
    conceptGroup.scale.setScalar(modelScaleFactor);
  };

  const {
    conceptRotor,
    channelEmitters,
    channelReceivers,
    conceptPartRoots,
    conceptOffsetTargets,
    conceptBaseZ,
  } = createConceptParts(conceptGroup);

  const hotspotGroup = new THREE.Group();
  hotspotGroup.name = 'SEMANTIC_HOTSPOTS';
  scene.add(hotspotGroup);
  const hotspotGeometry = new THREE.SphereGeometry(0.026, 12, 8);
  const hotspotMaterial = new THREE.MeshBasicMaterial({ color: 0xe1b778, transparent: true, opacity: 0.88 });
  scope.add(() => hotspotMaterial.dispose());
  const hotspotMeshes = new Map<string, THREE.Mesh>();
  for (const part of partCatalog) {
    const marker = new THREE.Mesh(hotspotGeometry, hotspotMaterial.clone());
    marker.name = `hotspot-${part.id}`;
    marker.userData.partId = part.id;
    marker.visible = false;
    hotspotGroup.add(marker);
    hotspotMeshes.set(part.id, marker);
  }

  const placeHotspots = (state: ExperimentState) => {
    scene.updateMatrixWorld(true);
    for (const [id, marker] of hotspotMeshes) {
      const component = licensedComponentRoots.get(id) ?? conceptPartRoots.get(id);
      if (!component) {
        marker.visible = false;
        continue;
      }
      const bounds = new THREE.Box3().setFromObject(component);
      if (bounds.isEmpty()) {
        marker.visible = false;
        continue;
      }
      const anchor = bounds.getCenter(new THREE.Vector3());
      anchor.y += Math.max(0.045, bounds.getSize(new THREE.Vector3()).y * 0.12);
      marker.position.copy(anchor);
      marker.visible = licensedComponentRoots.has(id)
        ? Boolean(modelRoot?.visible && state.mode !== 'cutaway')
        : Boolean(conceptGroup.visible && state.mode !== 'assembly');
    }
  };

  const apply = (state: ExperimentState) => {
    const mode = state.mode;
    const previousMode = displayedMode;
    displayedMode = mode;
    conceptGroup.visible = mode !== 'assembly';
    if (modelRoot) {
      modelRoot.visible = true;
      licensedComponentRoots.forEach((component, id) => {
        const opacity =
          mode === 'cutaway'
            ? 0.15
            : mode === 'exploded' && id === 'VLP16_base_1'
              ? 0.2
              : mode === 'exploded'
                ? 0.12
                : 1;
        setMaterialOpacity(component, opacity);
      });
    }
    if (mode === 'exploded') {
      conceptGroup.visible = true;
      const explodedGap = 0.18 / modelScaleFactor;
      componentOffsetTargets.set('VLP16_base_1', -explodedGap);
      componentOffsetTargets.set('VLP16_scan', 0);
      componentOffsetTargets.set('VLP16_base_2', explodedGap);
      conceptOffsetTargets.set('lidar_io', -0.018);
      conceptOffsetTargets.set('lidar_tof_board', -0.008);
      conceptOffsetTargets.set('lidar_encoder', 0.01);
      conceptOffsetTargets.set('lidar_motor', 0.022);
      conceptOffsetTargets.set('lidar_optical_array', 0.04);
      hotspotGroup.position.y = 0;
      if (previousMode !== 'exploded') {
        preExplodedCamera = { position: camera.position.clone(), target: controls.target.clone() };
      }
      const viewDirection = camera.position.clone().sub(controls.target).normalize();
      const explodedViewDistance = (getStageWidth() || 0) < 760 ? 5.35 : 4.35;
      if (camera.position.distanceTo(controls.target) < explodedViewDistance) {
        camera.position.copy(controls.target).addScaledVector(viewDirection, explodedViewDistance);
      }
      controls.maxDistance = Math.max(homeMaxDistance, explodedViewDistance + 1.2);
      controls.update();
    } else if (mode === 'cutaway') {
      conceptGroup.visible = true;
      componentOffsetTargets.set('VLP16_base_1', 0);
      componentOffsetTargets.set('VLP16_scan', 0);
      componentOffsetTargets.set('VLP16_base_2', 0);
      conceptOffsetTargets.forEach((_, id) => conceptOffsetTargets.set(id, 0));
      hotspotGroup.position.y = 0;
      if (previousMode === 'exploded' && preExplodedCamera) {
        camera.position.copy(preExplodedCamera.position);
        controls.target.copy(preExplodedCamera.target);
        preExplodedCamera = null;
        controls.maxDistance = homeMaxDistance;
        controls.update();
      }
    } else {
      conceptGroup.visible = false;
      componentOffsetTargets.set('VLP16_base_1', 0);
      componentOffsetTargets.set('VLP16_scan', 0);
      componentOffsetTargets.set('VLP16_base_2', 0);
      conceptOffsetTargets.forEach((_, id) => conceptOffsetTargets.set(id, 0));
      hotspotGroup.position.y = 0;
      if (previousMode === 'exploded' && preExplodedCamera) {
        camera.position.copy(preExplodedCamera.position);
        controls.target.copy(preExplodedCamera.target);
        preExplodedCamera = null;
        controls.maxDistance = homeMaxDistance;
        controls.update();
      }
    }
    placeHotspots(state);
  };

  const installLicensedParts = (parts: THREE.Object3D[]) => {
    modelRoot = new THREE.Group();
    const ids = ['VLP16_base_1', 'VLP16_base_2', 'VLP16_scan'];
    parts.forEach((part, index) => {
      const id = ids[index];
      part.name = id;
      part.userData.partId = id;
      part.traverse((object) => {
        object.userData.partId = id;
      });
      licensedComponentRoots.set(id, part);
      componentOffsetTargets.set(id, 0);
      modelRoot!.add(part);
    });
    // Attach before normalizing so scope cleanup also owns an installation failure.
    modelGroup.add(modelRoot);
    normalizeModel(modelRoot);
  };
  const update = (state: ExperimentState, delta: number) => {
    animationTime += delta;
    licensedComponentRoots.forEach((component, id) => {
      component.position.z = THREE.MathUtils.damp(
        component.position.z,
        componentOffsetTargets.get(id) ?? 0,
        8,
        delta,
      );
    });
    conceptPartRoots.forEach((component, id) => {
      component.position.z = THREE.MathUtils.damp(
        component.position.z,
        (conceptBaseZ.get(id) ?? 0) + (conceptOffsetTargets.get(id) ?? 0),
        8,
        delta,
      );
    });
    placeHotspots(state);
    let hotspotIndex = 0;
    hotspotMeshes.forEach((marker) => {
      marker.scale.setScalar(1 + Math.sin(animationTime * 3 + hotspotIndex) * 0.12);
      const material = marker.material as THREE.MeshBasicMaterial;
      material.opacity =
        marker.userData.partId === state.selectedPartId
          ? 1
          : 0.56 + Math.sin(animationTime * 2.4 + hotspotIndex) * 0.18;
      hotspotIndex += 1;
    });
  };
  const pickCandidates = (state: ExperimentState) => {
    const candidates: THREE.Object3D[] = [...hotspotMeshes.values()];
    if (modelRoot) candidates.push(modelRoot);
    if (conceptGroup.visible) candidates.push(conceptGroup);
    if (state.scanActive) candidates.push(scanGroup);
    return candidates;
  };
  return {
    apply,
    update,
    installLicensedParts,
    pickCandidates,
    resetCamera: () => controls.reset(),
    scanParts: { conceptRotor, channelEmitters, channelReceivers },
  };
}

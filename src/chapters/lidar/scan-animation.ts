import * as THREE from 'three';
import {
  MIN_DISTANCE_METERS,
  MAX_DISTANCE_METERS,
  STEP_DURATION_SECONDS,
  type ExperimentState,
} from './experiment-state';
import type { createScanScene } from './scan-scene';
import type { createConceptParts } from './concept';

type ScanAnimationScene = Pick<
  ReturnType<typeof createConceptParts>,
  'conceptRotor' | 'channelEmitters' | 'channelReceivers'
> & { scanGroup: THREE.Group };

export function createScanAnimation(
  scene: ScanAnimationScene,
  scanObjects: ReturnType<typeof createScanScene>,
) {
  const { scanGroup, conceptRotor, channelEmitters, channelReceivers } = scene;
  const {
    pointCount,
    pointsGeometry,
    pointTemplate,
    pointCloud,
    rayLines,
    scanRing,
    sweep,
    targetGroup,
    targetMarker,
    targetFrame,
    echoBeamGeometry,
    echoBeam,
    scanPulse,
  } = scanObjects;
  let animationTime = 0;
  let scanAngle = 0;
  let geometryDistance: number | undefined;
  const demoRadiusForDistance = (meters: number) =>
    THREE.MathUtils.mapLinear(meters, MIN_DISTANCE_METERS, MAX_DISTANCE_METERS, 0.42, 2.05);
  const updateScanGeometry = (state: ExperimentState) => {
    const radius = demoRadiusForDistance(state.distanceMeters);
    rayLines.forEach((ray) => {
      ray.scale.x = radius;
    });
    scanRing.scale.setScalar(radius);
    sweep.scale.x = radius;
    sweep.position.set(Math.sin(scanAngle) * radius * 0.5, 0.18, Math.cos(scanAngle) * radius * 0.5);
    sweep.rotation.y = scanAngle - Math.PI * 0.5;
    targetGroup.position.set(radius * 0.17, 0, radius * 0.93);
    const targetScale = THREE.MathUtils.clamp(radius * 0.22, 0.1, 0.32);
    targetFrame.scale.set(targetScale, targetScale, targetScale);
    targetMarker.position.set(0, 0.18, 0);
    targetMarker.scale.setScalar(THREE.MathUtils.clamp(radius * 0.12, 0.7, 1.8));
    const targetPoint = targetGroup.position.clone().add(new THREE.Vector3(0, 0.18, 0));
    echoBeamGeometry.setFromPoints([new THREE.Vector3(0, 0.18, 0), targetPoint]);
    const positionAttribute = pointsGeometry.getAttribute('position') as THREE.BufferAttribute;
    const rangeScale = radius / demoRadiusForDistance(20);
    for (let index = 0; index < pointCount; index += 1) {
      positionAttribute.setXYZ(
        index,
        pointTemplate[index * 3] * rangeScale,
        pointTemplate[index * 3 + 1],
        pointTemplate[index * 3 + 2] * rangeScale,
      );
    }
    positionAttribute.needsUpdate = true;
    pointsGeometry.computeBoundingSphere();
  };

  const update = (state: ExperimentState, delta: number) => {
    animationTime += delta;
    scanGroup.visible = state.scanActive;
    if (geometryDistance !== state.distanceMeters) {
      updateScanGeometry(state);
      geometryDistance = state.distanceMeters;
    }
    if (state.scanActive) {
      scanAngle += delta * 2.1;
      const stepDuration = STEP_DURATION_SECONDS;
      const stepProgress = THREE.MathUtils.clamp(state.stepElapsedSeconds / stepDuration, 0, 1);
      if (conceptRotor) conceptRotor.rotation.z = scanAngle;
      channelEmitters.forEach((emitter, index) => {
        const activeChannel = Math.floor(animationTime * 5.5) % channelEmitters.length === index;
        const material = emitter.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = state.stepIndex === 0 && activeChannel ? 2.8 : 0.75;
        const receiverMaterial = channelReceivers[index].material as THREE.MeshStandardMaterial;
        receiverMaterial.emissiveIntensity = state.stepIndex === 2 && activeChannel ? 2.4 : 0.45;
      });
      const targetRadius = demoRadiusForDistance(state.distanceMeters);
      sweep.position.set(
        Math.sin(scanAngle) * targetRadius * 0.5,
        0.18,
        Math.cos(scanAngle) * targetRadius * 0.5,
      );
      sweep.rotation.y = scanAngle - Math.PI * 0.5;
      scanRing.scale.setScalar(targetRadius * (0.985 + Math.sin(animationTime * 2.4) * 0.015));
      rayLines.forEach((ray, index) => {
        ray.rotation.y = (index / rayLines.length) * Math.PI * 2 + scanAngle * 0.18;
        const material = ray.material as THREE.LineBasicMaterial;
        material.opacity = 0.32 + (Math.sin(animationTime * 4 + index) + 1) * 0.16;
      });
      const targetPoint = targetGroup.position.clone().add(new THREE.Vector3(0, 0.18, 0));
      const sensorPoint = new THREE.Vector3(0, 0.18, 0);
      if (state.stepIndex === 0) scanPulse.position.lerpVectors(sensorPoint, targetPoint, stepProgress);
      else if (state.stepIndex === 1) {
        scanPulse.position.copy(targetPoint);
        targetMarker.scale.setScalar(
          THREE.MathUtils.clamp(targetRadius * 0.12, 0.7, 1.8) * (1.15 + Math.sin(animationTime * 12) * 0.22),
        );
      } else if (state.stepIndex === 2)
        scanPulse.position.lerpVectors(targetPoint, sensorPoint, stepProgress);
      scanPulse.visible = state.stepIndex !== 3;
      echoBeam.visible = state.stepIndex !== 3;
      pointCloud.visible = state.stepIndex === 3;
      targetGroup.visible = state.stepIndex !== 3;
      targetMarker.scale.setScalar(THREE.MathUtils.clamp(targetRadius * 0.12, 0.7, 1.8));
    } else {
      if (conceptRotor) conceptRotor.rotation.z = 0;
      channelEmitters.forEach((emitter) => {
        (emitter.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.75;
      });
      channelReceivers.forEach((receiver) => {
        (receiver.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.45;
      });
    }
  };
  return { update };
}

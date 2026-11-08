import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { createScope } from '../../../src/shared/lifecycle';
import { createLidarLearningWorld } from '../../../src/chapters/lidar/learning-world';
import {
  createDistanceTargets,
  worldTargets,
  getTargetDistanceMeters,
} from '../../../src/chapters/lidar/learning-measurement';
import { lidarLearningContent } from '../../../src/chapters/lidar/learning-data';

describe('teaching world', () => {
  it('places meter targets under one visual scale and shares model geometry with its points', () => {
    const parent = new THREE.Group();
    const scope = createScope();
    const world = createLidarLearningWorld(parent, scope);
    const targets = createDistanceTargets(lidarLearningContent.distance.rounds[0]);
    world.setTargets(targets);
    const root = parent.getObjectByName('LIDAR_LEARNING_WORLD')!;
    const a = root.getObjectByName(targets[0].id)!;
    expect(a.position.toArray()).toEqual([targets[0].positionMeters.x, 0, targets[0].positionMeters.z]);
    root.scale.setScalar(0.3);
    expect(getTargetDistanceMeters(targets[0], { x: 0, y: 0, z: 0 })).toBe(5);
    const mesh = a.children.find((child) => child instanceof THREE.Mesh) as THREE.Mesh;
    const cloud = a.children.find((child) => child instanceof THREE.Points) as THREE.Points;
    expect(cloud.geometry).toBe(mesh.geometry);
    expect(cloud.position.toArray()).toEqual(mesh.position.toArray());
    expect(world.pickCandidates().some((item) => item.userData.targetId === targets[0].id)).toBe(true);
    scope.dispose();
  });
  it('changes weather without relocating four targets and pauses the sweep explicitly', () => {
    const parent = new THREE.Group();
    const scope = createScope();
    const world = createLidarLearningWorld(parent, scope);
    world.setTargets(worldTargets);
    world.setVisible(true);
    const root = parent.getObjectByName('LIDAR_LEARNING_WORLD')!;
    const positions = worldTargets.map((target) => root.getObjectByName(target.id)!.position.toArray());
    const noise = root.getObjectByName('LEARNING_RAIN_ECHOES')!;
    world.setWeather('rain');
    expect(noise.visible).toBe(true);
    world.setWeather('fog');
    expect(noise.visible).toBe(false);
    expect(worldTargets.map((target) => root.getObjectByName(target.id)!.position.toArray())).toEqual(
      positions,
    );
    const sweep = root.getObjectByName('LEARNING_SWEEP')!;
    world.setScanRunning(true);
    world.update(0.2);
    const rotation = sweep.rotation.y;
    expect(rotation).not.toBe(0);
    world.setScanRunning(false);
    world.update(0.2);
    expect(sweep.rotation.y).toBe(rotation);
    world.setVisible(false);
    world.setScanRunning(true);
    world.update(0.2);
    expect(sweep.rotation.y).toBe(rotation);
    scope.dispose();
  });
  it('releases replaced and final teaching geometry once through the lifecycle scope', () => {
    const parent = new THREE.Group();
    const scope = createScope();
    const world = createLidarLearningWorld(parent, scope);
    world.setTargets(worldTargets);
    const first = world.pickCandidates()[0] as THREE.Mesh;
    const released = vi.fn();
    first.geometry.addEventListener('dispose', released);
    world.setTargets(createDistanceTargets(lidarLearningContent.distance.rounds[0]));
    expect(released).toHaveBeenCalledTimes(1);
    const final = world.pickCandidates()[0] as THREE.Mesh;
    const finalReleased = vi.fn();
    final.geometry.addEventListener('dispose', finalReleased);
    scope.dispose();
    scope.dispose();
    expect(finalReleased).toHaveBeenCalledTimes(1);
    expect(parent.children).toHaveLength(0);
  });
});

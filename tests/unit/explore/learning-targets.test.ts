import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  exploreLearningTasks,
  exploreLearningGroups,
  exploreReviewQuestions,
} from '../../../src/chapters/explore/learning-data';
import {
  exploreLearningTargets,
  resolveLearningTargetName,
  hasRequiredTargets,
} from '../../../src/chapters/explore/learning-targets';

describe('explore target matching', () => {
  it('matches the nearest allowed ancestor without promoting everything to ADAS', () => {
    const target = exploreLearningTargets['explore-sensor-front-camera'];
    expect(resolveLearningTargetName(['lens-mesh', 'Front_camera_optic', 'ADAS', 'EV_SUV'], target)).toBe(
      'Front_camera_optic',
    );
    expect(resolveLearningTargetName(['Rear_camera_optic', 'ADAS', 'EV_SUV'], target)).toBeNull();
    expect(
      resolveLearningTargetName(
        ['Lidar_optical_window', 'Roof_lidar_housing', 'ADAS'],
        exploreLearningTargets['explore-sensor-lidar'],
      ),
    ).toBe('Lidar_optical_window');
  });
  it('requires suspension AND brakes and deduplicates hits', () => {
    const target = exploreLearningTargets['explore-structure-chassis'];
    expect(hasRequiredTargets(target, ['FrontSuspension', 'RearSuspension'])).toBe(false);
    expect(hasRequiredTargets(target, ['FrontSuspension', 'FrontSuspension'])).toBe(false);
    expect(hasRequiredTargets(target, ['RearSuspension', 'Brakes'])).toBe(true);
    expect(hasRequiredTargets(target, ['FrontSuspension', 'RearSuspension', 'Brakes'])).toBe(true);
  });
  it('covers 4 + 4 + 5 tasks with real authored names; millimeter is only teaching', () => {
    expect(exploreLearningGroups.map((g) => g.taskIds.length)).toEqual([4, 4, 5]);
    const ids = exploreLearningGroups.flatMap((g) => [...g.taskIds]);
    expect(new Set(ids).size).toBe(13);
    expect(ids).toEqual(exploreLearningTasks.map((t) => t.id));
    const buffer = readFileSync('public/assets/yaojing-s9-optimized.glb');
    const gltf = JSON.parse(buffer.subarray(20, 20 + buffer.readUInt32LE(12)).toString());
    const names = new Set(gltf.nodes.map((node: { name?: string }) => node.name));
    for (const task of exploreLearningTasks) {
      const target = exploreLearningTargets[task.targetKey];
      if (target.kind === 'teaching-hotspot') {
        expect(target.names).toEqual([]);
        expect(target.hotspotId).toBe('teaching-millimeter-radar');
        expect(resolveLearningTargetName(['teaching-millimeter-radar'], target)).toBeNull();
        expect(hasRequiredTargets(target, ['teaching-millimeter-radar'])).toBe(true);
      } else for (const name of target.names) expect(names.has(name), name).toBe(true);
    }
    expect(exploreReviewQuestions[0]).toBe(exploreLearningTasks[0].question);
  });
});

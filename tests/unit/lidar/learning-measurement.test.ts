import { describe, expect, it } from 'vitest';
import { lidarLearningContent } from '../../../src/chapters/lidar/learning-data';
import {
  createDistanceTargets,
  findDistanceRange,
  getTargetDistanceMeters,
} from '../../../src/chapters/lidar/learning-measurement';

describe('meter measurements', () => {
  it('places the first round at 5, 12 and 20 meters, independently of display scale', () => {
    const targets = createDistanceTargets(lidarLearningContent.distance.rounds[0]);
    [5, 12, 20].forEach((distance, index) => {
      expect(getTargetDistanceMeters(targets[index], { x: 0, y: 0, z: 0 })).toBeCloseTo(distance, 10);
    });
    expect(targets[0].positionMeters.x).toBeLessThan(0);
    expect(targets[1].positionMeters.x).toBe(0);
    expect(targets[2].positionMeters.x).toBeGreaterThan(0);
    const visual = targets.map((target) => ({ ...target.positionMeters, x: target.positionMeters.x * 0.08 }));
    expect(visual[0].x).not.toBe(targets[0].positionMeters.x);
    expect(getTargetDistanceMeters(targets[0], { x: 0, y: 0, z: 0 })).toBe(5);
  });
  it('measures a three-dimensional straight line from the given origin', () => {
    expect(
      getTargetDistanceMeters(
        { id: 'test', label: 'test', positionMeters: { x: 4, y: 6, z: 4 } },
        { x: 1, y: 2, z: 4 },
      ),
    ).toBe(5);
  });
  it.each([
    [9.999, 'range-under-10'],
    [10, 'range-10-to-20'],
    [19.999, 'range-10-to-20'],
    [20, 'range-20-to-40'],
    [40, 'range-20-to-40'],
    [-1, null],
    [NaN, null],
    [Infinity, null],
    [40.001, null],
  ])('places %s in exactly its authored range', (value, expected) => {
    expect(findDistanceRange(value as number, lidarLearningContent.distance.ranges)).toBe(expected);
  });
});

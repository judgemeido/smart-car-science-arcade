import { describe, expect, it, vi } from 'vitest';

// Preparation documents are absent from source-only production deployments.
// Keep runtime content real while making that optional external source unavailable.
vi.mock('../../../docs/content/2026-11-08-upper-primary/03-lidar.json', () => {
  throw new Error('Preparation content is unavailable in a source-only deployment');
});

describe('chapter-local runtime content', () => {
  it('runs the complete distance curriculum without preparation documents', async () => {
    const { lidarLearningContent } = await import('../../../src/chapters/lidar/learning-data');
    const { createLidarLearningState, reduceLidarLearning } = await import(
      '../../../src/chapters/lidar/learning-state'
    );
    let state = createLidarLearningState();
    const answers = [
      ['lidar-distance-round-1-target-a', 'range-under-10'],
      ['lidar-distance-round-2-target-b', 'range-under-10'],
      ['lidar-distance-round-3-target-c', 'range-10-to-20'],
    ];
    for (const [id, rangeId] of answers) {
      state = reduceLidarLearning(state, { type: 'select-target', id }, lidarLearningContent);
      state = reduceLidarLearning(state, { type: 'select-range', id: rangeId }, lidarLearningContent);
      state = reduceLidarLearning(state, { type: 'submit' }, lidarLearningContent);
      expect(state.submission?.verdict).toBe('correct');
      state = reduceLidarLearning(state, { type: 'continue' }, lidarLearningContent);
    }
    expect(state.completed).toBe(true);
    expect(
      state.attempts.map((attempt) => attempt.measurements.map((target) => target.distanceMeters)),
    ).toEqual([
      [5, 12, 20],
      [18, 7, 25],
      [22, 30, 12],
    ]);
  });
});

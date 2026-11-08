import { describe, expect, it } from 'vitest';
import { lidarLearningContent } from '../../../src/chapters/lidar/learning-data';
import { createLidarLearningState, reduceLidarLearning } from '../../../src/chapters/lidar/learning-state';
import { createExperimentState } from '../../../src/chapters/lidar/experiment-state';

const content = lidarLearningContent;
const reduce = (
  state: ReturnType<typeof createLidarLearningState>,
  action: Parameters<typeof reduceLidarLearning>[1],
) => reduceLidarLearning(state, action, content);

describe('distance learning state', () => {
  it('ignores invalid and incomplete selections', () => {
    const initial = createLidarLearningState();
    expect(reduce(initial, { type: 'select-target', id: 'missing' })).toBe(initial);
    expect(reduce(initial, { type: 'select-range', id: 'missing' })).toBe(initial);
    expect(reduce(initial, { type: 'select-sensor', id: 'missing' })).toBe(initial);
    expect(reduce(initial, { type: 'submit' })).toBe(initial);
    const one = reduce(initial, { type: 'select-target', id: 'lidar-distance-round-1-target-a' });
    expect(reduce(one, { type: 'submit' })).toBe(one);
  });
  it('requires correction and an explicit continue, and cannot skip a round', () => {
    let state = createLidarLearningState();
    state = reduce(state, { type: 'select-target', id: 'lidar-distance-round-1-target-b' });
    state = reduce(state, { type: 'select-range', id: 'range-10-to-20' });
    state = reduce(state, { type: 'submit' });
    expect(state.submission?.verdict).toBe('incorrect');
    expect(state.submission?.measurements.map((entry) => entry.distanceMeters)).toEqual([5, 12, 20]);
    expect(reduce(state, { type: 'continue' })).toBe(state);
    state = reduce(state, { type: 'select-target', id: 'lidar-distance-round-1-target-a' });
    state = reduce(state, { type: 'select-range', id: 'range-under-10' });
    expect(state.submission).toBeNull();
    state = reduce(state, { type: 'submit' });
    expect(state.masteredRoundIds).toEqual(['lidar-distance-round-1']);
    expect(reduce(state, { type: 'submit' })).toBe(state);
    state = reduce(state, { type: 'continue' });
    expect(state.roundIndex).toBe(1);
    expect(reduce(state, { type: 'continue' })).toBe(state);
    expect(state.attempts).toHaveLength(2);
  });
  it('judges A, B, C by coordinates even when target order changes', () => {
    let state = createLidarLearningState();
    const reordered = {
      ...content,
      distance: {
        ...content.distance,
        rounds: content.distance.rounds.map((round) => ({ ...round, targets: [...round.targets].reverse() })),
      },
    };
    const targetIds = [
      'lidar-distance-round-1-target-a',
      'lidar-distance-round-2-target-b',
      'lidar-distance-round-3-target-c',
    ];
    const ranges = ['range-under-10', 'range-under-10', 'range-10-to-20'];
    targetIds.forEach((id, index) => {
      state = reduceLidarLearning(state, { type: 'select-target', id }, reordered);
      state = reduceLidarLearning(state, { type: 'select-range', id: ranges[index] }, reordered);
      state = reduceLidarLearning(state, { type: 'submit' }, reordered);
      expect(state.submission?.verdict).toBe('correct');
      state = reduceLidarLearning(state, { type: 'continue' }, reordered);
    });
    expect(state.masteredRoundIds).toHaveLength(3);
    expect(state.completed).toBe(true);
  });
  it('derives the answer from measurements rather than authored answer labels', () => {
    const edited = {
      ...content,
      distance: {
        ...content.distance,
        rounds: [
          {
            ...content.distance.rounds[0],
            correctNearestTargetId: 'lidar-distance-round-1-target-b',
            correctRangeId: 'range-20-to-40',
          },
        ],
      },
    };
    let state = createLidarLearningState();
    state = reduceLidarLearning(
      state,
      { type: 'select-target', id: 'lidar-distance-round-1-target-a' },
      edited,
    );
    state = reduceLidarLearning(state, { type: 'select-range', id: 'range-under-10' }, edited);
    expect(reduceLidarLearning(state, { type: 'submit' }, edited).submission?.verdict).toBe('correct');
  });
  it('resets only new learning, keeping original radar state independent', () => {
    const old = { ...createExperimentState(), distanceMeters: 60 };
    let state = reduce(createLidarLearningState(), { type: 'select-sensor', id: 'sensor-gnss' });
    expect(state.selectedSensorId).toBe('sensor-gnss');
    state = reduce(state, { type: 'reset' });
    expect(state).toEqual(createLidarLearningState());
    expect(old.distanceMeters).toBe(60);
  });
});

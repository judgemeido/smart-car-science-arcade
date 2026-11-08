import { describe, expect, it } from 'vitest';
import { powerflowStages } from '../../../src/chapters/explore/data';
import { createPowerflowState, reducePowerflow } from '../../../src/chapters/explore/powerflow-state';

const start = () => reducePowerflow(createPowerflowState(), { type: 'start' }, powerflowStages);

describe('the existing five-second powerflow story', () => {
  it('begins unplayed and advances at the authored stage boundaries', () => {
    expect(createPowerflowState()).toEqual({
      playing: false,
      played: false,
      elapsedSeconds: 0,
      stageIndex: -1,
    });
    for (const [elapsedSeconds, stageIndex] of [
      [0, 0],
      [1.199, 0],
      [1.2, 1],
      [2.549, 1],
      [2.55, 2],
      [3.449, 2],
      [3.45, 3],
      [4.999, 3],
    ]) {
      const state = reducePowerflow(start(), { type: 'tick', deltaSeconds: elapsedSeconds }, powerflowStages);
      expect(state.stageIndex).toBe(stageIndex);
      expect(state.playing).toBe(true);
      expect(state.elapsedSeconds).toBe(elapsedSeconds);
    }
  });

  it('completes at five seconds, clamps overshoot, and cannot autoplay a second time', () => {
    for (const deltaSeconds of [5, 7]) {
      const state = reducePowerflow(start(), { type: 'tick', deltaSeconds }, powerflowStages);
      expect(state).toEqual({ playing: false, played: true, elapsedSeconds: 5, stageIndex: 3 });
      expect(reducePowerflow(state, { type: 'start' }, powerflowStages)).toEqual(state);
      expect(reducePowerflow(state, { type: 'tick', deltaSeconds: 1 }, powerflowStages)).toEqual(state);
    }
  });

  it.each(['skip', 'deactivate'] as const)('%s immediately finishes and marks the story played', (type) => {
    const playing = reducePowerflow(start(), { type: 'tick', deltaSeconds: 2 }, powerflowStages);
    expect(reducePowerflow(playing, { type }, powerflowStages)).toEqual({
      playing: false,
      played: true,
      elapsedSeconds: 0,
      stageIndex: 1,
    });
    const inactive = createPowerflowState();
    expect(reducePowerflow(inactive, { type }, powerflowStages)).toEqual(inactive);
  });

  it('replays from the beginning but ignores start/replay during playback', () => {
    const played = reducePowerflow(start(), { type: 'skip' }, powerflowStages);
    const replay = reducePowerflow(played, { type: 'replay' }, powerflowStages);
    expect(replay).toEqual({ playing: true, played: true, elapsedSeconds: 0, stageIndex: -1 });
    const playing = reducePowerflow(replay, { type: 'tick', deltaSeconds: 2 }, powerflowStages);
    expect(reducePowerflow(playing, { type: 'replay' }, powerflowStages)).toEqual(playing);
    expect(reducePowerflow(playing, { type: 'start' }, powerflowStages)).toEqual(playing);
    expect(played.playing).toBe(false);
  });

  it.each([NaN, Infinity, -Infinity, -0.01])(
    'rejects invalid delta %s without changing state',
    (deltaSeconds) => {
      const state = start();
      expect(reducePowerflow(state, { type: 'tick', deltaSeconds }, powerflowStages)).toEqual(state);
    },
  );
});

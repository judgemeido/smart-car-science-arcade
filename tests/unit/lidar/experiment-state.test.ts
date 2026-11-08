import { describe, expect, it } from 'vitest';
import { createExperimentState, reduceExperiment } from '../../../src/chapters/lidar/experiment-state';
import { roundTripNanoseconds } from '../../../src/chapters/lidar/measurement';

describe('lidar experiment state', () => {
  it('starts assembled at 20 m with scanning stopped and no selected part', () => {
    expect(createExperimentState()).toEqual({
      mode: 'assembly',
      scanActive: false,
      stepIndex: 0,
      stepElapsedSeconds: 0,
      manualStepSelection: false,
      distanceMeters: 20,
      selectedPartId: null,
    });
  });

  it('accepts the current 5–80 m distance range without mutating the prior state', () => {
    const initial = createExperimentState();
    expect(reduceExperiment(initial, { type: 'distance', meters: 5 }).distanceMeters).toBe(5);
    expect(reduceExperiment(initial, { type: 'distance', meters: 80 }).distanceMeters).toBe(80);
    expect(initial.distanceMeters).toBe(20);
  });

  it.each([4, 81, NaN, Infinity, -Infinity])('rejects out-of-range distance %s', (meters) => {
    expect(() => reduceExperiment(createExperimentState(), { type: 'distance', meters })).toThrow(RangeError);
  });

  it('advances at 1.3 s and wraps the fourth step to the first', () => {
    let state = reduceExperiment(createExperimentState(), { type: 'scan', active: true });
    state = reduceExperiment(state, { type: 'tick', deltaSeconds: 1.25 });
    expect(state.stepIndex).toBe(0);
    state = reduceExperiment(state, { type: 'tick', deltaSeconds: 0.05 });
    expect(state.stepIndex).toBe(1);
    expect(state.stepElapsedSeconds).toBe(0);
    expect(state.selectedPartId).toBe('VLP16_scan');
    state = reduceExperiment(state, { type: 'tick', deltaSeconds: 1.3 });
    expect(state.stepIndex).toBe(2);
    state = reduceExperiment(state, { type: 'tick', deltaSeconds: 1.3 });
    expect(state.stepIndex).toBe(3);
    state = reduceExperiment(state, { type: 'tick', deltaSeconds: 1.3 });
    expect(state.stepIndex).toBe(0);
    expect(state.selectedPartId).toBe('lidar_optical_array');
  });

  it('starts scanning on manual selection and holds that step across ticks', () => {
    const selected = reduceExperiment(createExperimentState(), { type: 'step', index: 2 });
    expect(selected.scanActive).toBe(true);
    expect(selected.manualStepSelection).toBe(true);
    expect(selected.selectedPartId).toBe('lidar_tof_board');
    const later = reduceExperiment(selected, { type: 'tick', deltaSeconds: 5 });
    expect(later.stepIndex).toBe(2);
    expect(later.stepElapsedSeconds).toBe(5);
  });

  it('restarts scanning at step one while repeated start preserves manual selection', () => {
    let state = reduceExperiment(createExperimentState(), { type: 'step', index: 3 });
    state = reduceExperiment(state, { type: 'scan', active: true });
    expect(state.stepIndex).toBe(3);
    state = reduceExperiment(state, { type: 'scan', active: false });
    state = reduceExperiment(state, { type: 'scan', active: true });
    expect(state.stepIndex).toBe(0);
    expect(state.stepElapsedSeconds).toBe(0);
    expect(state.manualStepSelection).toBe(false);
    expect(state.selectedPartId).toBe('lidar_optical_array');
  });

  it('does not advance stopped scanning or catch up multiple steps in one frame', () => {
    const stopped = createExperimentState();
    expect(reduceExperiment(stopped, { type: 'tick', deltaSeconds: 10 })).toEqual(stopped);
    const running = reduceExperiment(stopped, { type: 'scan', active: true });
    const later = reduceExperiment(running, { type: 'tick', deltaSeconds: 10 });
    expect(later.stepIndex).toBe(1);
    expect(later.stepElapsedSeconds).toBe(0);
  });

  it('keeps 60 m on reset while clearing the experiment and selected part', () => {
    let state = reduceExperiment(createExperimentState(), { type: 'distance', meters: 60 });
    state = reduceExperiment(state, { type: 'mode', mode: 'exploded' });
    state = reduceExperiment(state, { type: 'scan', active: true });
    state = reduceExperiment(state, { type: 'step', index: 2 });
    state = reduceExperiment(state, { type: 'tick', deltaSeconds: 0.8 });
    state = reduceExperiment(state, { type: 'select-part', id: 'lidar_motor' });
    const reset = reduceExperiment(state, { type: 'reset' });
    expect(reset).toEqual({
      mode: 'assembly',
      scanActive: false,
      stepIndex: 0,
      stepElapsedSeconds: 0,
      manualStepSelection: false,
      distanceMeters: 60,
      selectedPartId: null,
    });
    expect(roundTripNanoseconds(reset.distanceMeters)).toBeCloseTo(400.276914, 5);
    expect(state.mode).toBe('exploded');
  });

  it('changes modes and selects catalog parts without changing the measurement', () => {
    let state = reduceExperiment(createExperimentState(), { type: 'mode', mode: 'cutaway' });
    state = reduceExperiment(state, { type: 'select-part', id: 'lidar_motor' });
    expect(state.mode).toBe('cutaway');
    expect(state.selectedPartId).toBe('lidar_motor');
    expect(state.distanceMeters).toBe(20);
    expect(reduceExperiment(state, { type: 'select-part', id: 'unknown' })).toEqual(state);
    expect(reduceExperiment(state, { type: 'select-part', id: null }).selectedPartId).toBeNull();
  });
});

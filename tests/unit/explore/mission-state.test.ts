import { describe, expect, it } from 'vitest';
import { disassemblyTasks } from '../../../src/chapters/explore/data';
import { createMissionState, reduceMission } from '../../../src/chapters/explore/mission-state';

describe('the existing three-target disassembly mission', () => {
  it('starts at zero and completes BatteryPack, ADAS, then Cabin', () => {
    const initial = createMissionState();
    expect(initial).toEqual({ index: 0, active: false });
    let { state } = reduceMission(initial, { type: 'start' }, disassemblyTasks);
    for (const [index, task] of disassemblyTasks.entries()) {
      const result = reduceMission(state, { type: 'pick', assemblyName: task.target }, disassemblyTasks);
      expect(result.verdict).toBe(index === 2 ? 'complete' : 'correct');
      expect(result.state).toEqual({ index: index + 1, active: true });
      state = result.state;
    }
    expect(initial).toEqual({ index: 0, active: false });
  });

  it('does not advance when ADAS is picked for the first task', () => {
    const { state } = reduceMission(createMissionState(), { type: 'start' }, disassemblyTasks);
    expect(reduceMission(state, { type: 'pick', assemblyName: 'ADAS' }, disassemblyTasks)).toEqual({
      state,
      verdict: 'incorrect',
    });
  });

  it('ignores picks before starting', () => {
    const state = createMissionState();
    expect(reduceMission(state, { type: 'pick', assemblyName: 'BatteryPack' }, disassemblyTasks)).toEqual({
      state,
      verdict: 'none',
    });
  });

  it('does not advance on repeated picks and preserves progress on another start', () => {
    let { state } = reduceMission(createMissionState(), { type: 'start' }, disassemblyTasks);
    ({ state } = reduceMission(state, { type: 'pick', assemblyName: 'BatteryPack' }, disassemblyTasks));
    expect(reduceMission(state, { type: 'pick', assemblyName: 'BatteryPack' }, disassemblyTasks)).toEqual({
      state,
      verdict: 'incorrect',
    });
    expect(reduceMission(state, { type: 'start' }, disassemblyTasks).state).toEqual(state);
  });

  it('never advances past the final task, and restarts after completion', () => {
    const state = { index: 3, active: true };
    for (const assemblyName of ['Cabin', 'ADAS', 'BatteryPack', 'BodyStructure']) {
      expect(reduceMission(state, { type: 'pick', assemblyName }, disassemblyTasks)).toEqual({
        state,
        verdict: 'none',
      });
    }
    expect(reduceMission(state, { type: 'start' }, disassemblyTasks).state).toEqual({
      index: 0,
      active: true,
    });
  });

  it.each(['exit', 'reset', 'close-exploded'] as const)('%s clears progress and exits', (type) => {
    expect(reduceMission({ index: 2, active: true }, { type }, disassemblyTasks)).toEqual({
      state: createMissionState(),
      verdict: 'none',
    });
  });
});

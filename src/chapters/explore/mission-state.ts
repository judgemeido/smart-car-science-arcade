import type { DisassemblyTask } from './data';

export type MissionState = { index: number; active: boolean };
export type MissionAction =
  | { type: 'start' | 'exit' | 'reset' | 'close-exploded' }
  | { type: 'pick'; assemblyName: string };
export type MissionVerdict = 'none' | 'correct' | 'incorrect' | 'complete';

export function createMissionState(): MissionState {
  return { index: 0, active: false };
}

export function reduceMission(
  state: MissionState,
  action: MissionAction,
  tasks: readonly DisassemblyTask[],
): { state: MissionState; verdict: MissionVerdict } {
  switch (action.type) {
    case 'start':
      return {
        state: !state.active || state.index >= tasks.length ? { index: 0, active: true } : state,
        verdict: 'none',
      };
    case 'exit':
    case 'reset':
    case 'close-exploded':
      return { state: createMissionState(), verdict: 'none' };
    case 'pick': {
      const task = tasks[state.index];
      if (!state.active || !task) return { state, verdict: 'none' };
      if (action.assemblyName !== task.target) return { state, verdict: 'incorrect' };
      const index = state.index + 1;
      return {
        state: { index, active: true },
        verdict: index >= tasks.length ? 'complete' : 'correct',
      };
    }
  }
}

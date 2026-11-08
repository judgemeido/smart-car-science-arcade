export type PowerflowState = {
  playing: boolean;
  played: boolean;
  elapsedSeconds: number;
  stageIndex: number;
};
export type PowerflowAction =
  | { type: 'start' | 'replay' | 'skip' | 'deactivate' }
  | { type: 'tick'; deltaSeconds: number };
export const powerflowDurationSeconds = 5;

export function createPowerflowState(): PowerflowState {
  return { playing: false, played: false, elapsedSeconds: 0, stageIndex: -1 };
}

export function reducePowerflow(
  state: PowerflowState,
  action: PowerflowAction,
  stages: readonly { at: number }[],
): PowerflowState {
  switch (action.type) {
    case 'start':
    case 'replay':
      if (state.playing || (state.played && action.type === 'start')) return state;
      return { ...state, playing: true, elapsedSeconds: 0, stageIndex: -1 };
    case 'skip':
    case 'deactivate':
      return state.playing ? { ...state, playing: false, played: true, elapsedSeconds: 0 } : state;
    case 'tick': {
      if (!state.playing || !Number.isFinite(action.deltaSeconds) || action.deltaSeconds < 0) return state;
      const elapsedSeconds = Math.min(powerflowDurationSeconds, state.elapsedSeconds + action.deltaSeconds);
      const stageIndex = stages.reduce(
        (active, stage, index) => (elapsedSeconds >= stage.at ? index : active),
        0,
      );
      const complete = elapsedSeconds >= powerflowDurationSeconds;
      return {
        playing: !complete,
        played: state.played || complete,
        elapsedSeconds,
        stageIndex,
      };
    }
  }
}

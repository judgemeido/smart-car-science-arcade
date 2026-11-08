import { lessonSteps, partById, type LidarMode } from './data';

export const MIN_DISTANCE_METERS = 5;
export const MAX_DISTANCE_METERS = 80;
export const DEFAULT_DISTANCE_METERS = 20;
export const STEP_DURATION_SECONDS = 1.3;

export interface ExperimentState {
  readonly mode: LidarMode;
  readonly scanActive: boolean;
  readonly stepIndex: number;
  readonly stepElapsedSeconds: number;
  readonly manualStepSelection: boolean;
  readonly distanceMeters: number;
  readonly selectedPartId: string | null;
}

export type ExperimentAction =
  | { type: 'mode'; mode: LidarMode }
  | { type: 'scan'; active: boolean }
  | { type: 'step'; index: number }
  | { type: 'distance'; meters: number }
  | { type: 'select-part'; id: string | null }
  | { type: 'reset' }
  | { type: 'tick'; deltaSeconds: number };

export function createExperimentState(): ExperimentState {
  return {
    mode: 'assembly',
    scanActive: false,
    stepIndex: 0,
    stepElapsedSeconds: 0,
    manualStepSelection: false,
    distanceMeters: DEFAULT_DISTANCE_METERS,
    selectedPartId: null,
  };
}

function atStep(state: ExperimentState, index: number): ExperimentState {
  return {
    ...state,
    stepIndex: index,
    stepElapsedSeconds: 0,
    selectedPartId: lessonSteps[index].partId ?? null,
  };
}

export function reduceExperiment(state: ExperimentState, action: ExperimentAction): ExperimentState {
  switch (action.type) {
    case 'mode':
      return { ...state, mode: action.mode };
    case 'scan':
      return action.active && !state.scanActive
        ? atStep({ ...state, scanActive: true, manualStepSelection: false }, 0)
        : { ...state, scanActive: action.active };
    case 'step': {
      if (!Number.isFinite(action.index)) throw new RangeError('Step must be finite');
      const index = Math.max(0, Math.min(Math.trunc(action.index), lessonSteps.length - 1));
      return atStep({ ...state, scanActive: true, manualStepSelection: true }, index);
    }
    case 'distance':
      if (
        !Number.isFinite(action.meters) ||
        action.meters < MIN_DISTANCE_METERS ||
        action.meters > MAX_DISTANCE_METERS
      ) {
        throw new RangeError('Demo distance must be between 5 and 80 meters');
      }
      return { ...state, distanceMeters: action.meters };
    case 'select-part':
      return action.id === null || partById.has(action.id) ? { ...state, selectedPartId: action.id } : state;
    case 'reset':
      return {
        ...state,
        mode: 'assembly',
        scanActive: false,
        stepIndex: 0,
        stepElapsedSeconds: 0,
        manualStepSelection: false,
        selectedPartId: null,
      };
    case 'tick': {
      if (!Number.isFinite(action.deltaSeconds) || action.deltaSeconds < 0) {
        throw new RangeError('Frame delta must be finite and non-negative');
      }
      if (!state.scanActive) return state;
      const elapsed = state.stepElapsedSeconds + action.deltaSeconds;
      // Preserve the existing single-step frame boundary and discard overshoot.
      if (!state.manualStepSelection && elapsed >= STEP_DURATION_SECONDS) {
        return atStep(state, (state.stepIndex + 1) % lessonSteps.length);
      }
      return { ...state, stepElapsedSeconds: elapsed };
    }
  }
}

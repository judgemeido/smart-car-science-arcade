import type { LidarLearningContent } from './learning-data';
import { createDistanceTargets, findDistanceRange, getTargetDistanceMeters } from './learning-measurement';

export interface DistanceSubmission {
  readonly roundId: string;
  readonly targetId: string;
  readonly rangeId: string;
  readonly verdict: 'correct' | 'incorrect';
  readonly measurements: readonly {
    readonly id: string;
    readonly label: string;
    readonly distanceMeters: number;
  }[];
}
export interface LidarLearningState {
  readonly roundIndex: number;
  readonly selectedTargetId: string | null;
  readonly selectedRangeId: string | null;
  readonly submission: DistanceSubmission | null;
  readonly masteredRoundIds: readonly string[];
  readonly selectedSensorId: string | null;
  readonly attempts: readonly DistanceSubmission[];
  readonly completed: boolean;
}
export type LidarLearningAction =
  | { type: 'select-target'; id: string }
  | { type: 'select-range'; id: string }
  | { type: 'select-sensor'; id: string }
  | { type: 'submit' }
  | { type: 'continue' }
  | { type: 'reset' };

export function createLidarLearningState(): LidarLearningState {
  return {
    roundIndex: 0,
    selectedTargetId: null,
    selectedRangeId: null,
    submission: null,
    masteredRoundIds: [],
    selectedSensorId: null,
    attempts: [],
    completed: false,
  };
}
export function reduceLidarLearning(
  state: LidarLearningState,
  action: LidarLearningAction,
  content: LidarLearningContent,
): LidarLearningState {
  if (action.type === 'reset') return createLidarLearningState();
  if (action.type === 'select-sensor')
    return content.sensorCards.some((card) => card.id === action.id)
      ? { ...state, selectedSensorId: action.id }
      : state;
  if (state.completed) return state;
  const round = content.distance.rounds[state.roundIndex];
  if (!round) return state;
  if (action.type === 'select-target') {
    if (!round.targets.some((target) => target.id === action.id) || state.submission?.verdict === 'correct')
      return state;
    return { ...state, selectedTargetId: action.id, submission: null };
  }
  if (action.type === 'select-range') {
    if (
      !content.distance.ranges.some((range) => range.id === action.id) ||
      state.submission?.verdict === 'correct'
    )
      return state;
    return { ...state, selectedRangeId: action.id, submission: null };
  }
  if (action.type === 'continue') {
    if (state.submission?.verdict !== 'correct') return state;
    if (state.roundIndex === content.distance.rounds.length - 1) return { ...state, completed: true };
    return {
      ...state,
      roundIndex: state.roundIndex + 1,
      selectedTargetId: null,
      selectedRangeId: null,
      submission: null,
    };
  }
  if (action.type !== 'submit' || state.submission || !state.selectedTargetId || !state.selectedRangeId)
    return state;
  const measurements = createDistanceTargets(round).map((target) => ({
    id: target.id,
    label: target.label,
    distanceMeters: getTargetDistanceMeters(target, { x: 0, y: 0, z: 0 }),
  }));
  const nearest = [...measurements].sort((a, b) => a.distanceMeters - b.distanceMeters)[0];
  const verdict =
    state.selectedTargetId === nearest.id &&
    state.selectedRangeId === findDistanceRange(nearest.distanceMeters, content.distance.ranges)
      ? 'correct'
      : 'incorrect';
  const submission: DistanceSubmission = {
    roundId: round.id,
    targetId: state.selectedTargetId,
    rangeId: state.selectedRangeId,
    verdict,
    measurements,
  };
  return {
    ...state,
    submission,
    attempts: [...state.attempts, submission],
    masteredRoundIds:
      verdict === 'correct' && !state.masteredRoundIds.includes(round.id)
        ? [...state.masteredRoundIds, round.id]
        : state.masteredRoundIds,
  };
}

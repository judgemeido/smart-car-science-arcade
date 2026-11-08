import { evaluateChoice } from '../../shared/learning-assessment';
import type { TrafficPracticeScenario } from './learning-data';

export type TrafficPracticePhase = 'ready' | 'observe' | 'decide' | 'feedback' | 'summarize' | 'complete';
export interface TrafficPracticeState {
  readonly phase: TrafficPracticePhase;
  readonly scenarioIndex: number;
  readonly choiceId: string | null;
  readonly verdict: 'correct' | 'incorrect' | null;
  readonly masteredScenarioIds: readonly string[];
}
export type TrafficPracticeEvent =
  | { type: 'start' }
  | { type: 'observed' }
  | { type: 'answer'; choiceId: string }
  | { type: 'retry' }
  | { type: 'continue'; fromPhase: 'feedback' | 'summarize'; scenarioId: string }
  | { type: 'reset' };

export function createTrafficPracticeState(): TrafficPracticeState {
  return { phase: 'ready', scenarioIndex: 0, choiceId: null, verdict: null, masteredScenarioIds: [] };
}

export function reduceTrafficPractice(
  state: TrafficPracticeState,
  event: TrafficPracticeEvent,
  scenarios: readonly TrafficPracticeScenario[],
): TrafficPracticeState {
  if (event.type === 'reset') return createTrafficPracticeState();
  const scenario = scenarios[state.scenarioIndex];
  if (!scenario) return state;
  switch (event.type) {
    case 'start':
      return state.phase === 'ready' ? { ...state, phase: 'observe' } : state;
    case 'observed':
      return state.phase === 'observe' ? { ...state, phase: 'decide' } : state;
    case 'answer': {
      if (state.phase !== 'decide') return state;
      const verdict = evaluateChoice(scenario.question, event.choiceId);
      return verdict === 'invalid'
        ? state
        : { ...state, phase: 'feedback', choiceId: event.choiceId, verdict };
    }
    case 'retry':
      return state.phase === 'feedback' && state.verdict === 'incorrect'
        ? { ...state, phase: 'decide', choiceId: null, verdict: null }
        : state;
    case 'continue': {
      if (event.fromPhase !== state.phase || event.scenarioId !== scenario.id || state.verdict !== 'correct')
        return state;
      if (state.phase === 'feedback') return { ...state, phase: 'summarize' };
      if (state.phase !== 'summarize') return state;
      const masteredScenarioIds = state.masteredScenarioIds.includes(scenario.id)
        ? state.masteredScenarioIds
        : [...state.masteredScenarioIds, scenario.id];
      if (state.scenarioIndex === scenarios.length - 1) {
        return scenarios.every((item) => masteredScenarioIds.includes(item.id))
          ? { ...state, phase: 'complete', masteredScenarioIds }
          : state;
      }
      return {
        phase: 'observe',
        scenarioIndex: state.scenarioIndex + 1,
        choiceId: null,
        verdict: null,
        masteredScenarioIds,
      };
    }
  }
}

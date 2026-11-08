import type { Scenario } from './data';

export const FEEDBACK_DELAY_MS = 2300;
export const CROSSING_FEEDBACK_DELAY_MS = 550;

export interface TrafficState {
  phase: 'ready' | 'driving' | 'question' | 'feedback' | 'crossing' | 'complete';
  scenarioIndex: number;
  score: number;
  answeredChoiceId: string | null;
}

export type TrafficEvent =
  | { type: 'start' | 'arrive' | 'continue' | 'crossing-complete' | 'reset' }
  | { type: 'answer'; choiceId: string };

export type TrafficEffect =
  | { type: 'schedule-continue'; delayMs: number }
  | { type: 'start-crossing'; scenarioId: string }
  | { type: 'show-result' };

export function createTrafficState(): TrafficState {
  return { phase: 'ready', scenarioIndex: 0, score: 0, answeredChoiceId: null };
}

export function reduceTraffic(
  state: TrafficState,
  event: TrafficEvent,
  scenarios: readonly Scenario[],
): { state: TrafficState; effects: TrafficEffect[] } {
  const unchanged = { state, effects: [] as TrafficEffect[] };
  switch (event.type) {
    case 'reset':
      return { state: createTrafficState(), effects: [] };
    case 'start':
      return { state: { ...createTrafficState(), phase: 'driving' }, effects: [] };
    case 'arrive':
      if (state.phase !== 'driving' || !scenarios[state.scenarioIndex]) return unchanged;
      return { state: { ...state, phase: 'question' }, effects: [] };
    case 'answer': {
      if (state.phase !== 'question') return unchanged;
      const scenario = scenarios[state.scenarioIndex];
      const choice = scenario?.options.find((option) => option.choiceId === event.choiceId);
      if (!choice) return unchanged;
      const crossing = choice.correct && ['pedestrians', 'green-pedestrians'].includes(scenario.id);
      return {
        state: {
          ...state,
          phase: crossing ? 'crossing' : 'feedback',
          score: state.score + (choice.correct ? 1 : 0),
          answeredChoiceId: choice.choiceId,
        },
        effects: crossing
          ? [{ type: 'start-crossing', scenarioId: scenario.id }]
          : [{ type: 'schedule-continue', delayMs: FEEDBACK_DELAY_MS }],
      };
    }
    case 'crossing-complete':
      if (state.phase !== 'crossing') return unchanged;
      return {
        state: { ...state, phase: 'feedback' },
        effects: [{ type: 'schedule-continue', delayMs: CROSSING_FEEDBACK_DELAY_MS }],
      };
    case 'continue':
      if (state.phase !== 'feedback') return unchanged;
      if (state.scenarioIndex + 1 >= scenarios.length) {
        return { state: { ...state, phase: 'complete' }, effects: [{ type: 'show-result' }] };
      }
      return {
        state: { ...state, phase: 'driving', scenarioIndex: state.scenarioIndex + 1, answeredChoiceId: null },
        effects: [],
      };
  }
}

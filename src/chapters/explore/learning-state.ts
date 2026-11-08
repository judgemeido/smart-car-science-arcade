import { evaluateChoice } from '../../shared/learning-assessment';
import type { ExploreLearningTask } from './learning-data';
import { hasRequiredTargets, type ExploreTargetDefinition } from './learning-targets';

export type ExploreLearningMethod = 'model' | 'diagram';
export interface ExploreLearningState {
  readonly active: boolean;
  readonly taskIndex: number;
  readonly found: Readonly<Record<string, readonly string[]>>;
  readonly answers: Readonly<Record<string, string>>;
  readonly completedTaskIds: readonly string[];
  readonly methods: Readonly<Record<string, ExploreLearningMethod>>;
}
export type ExploreLearningAction =
  | { readonly type: 'start' | 'reset' | 'continue' }
  | { readonly type: 'pick'; readonly targetName: string; readonly source: ExploreLearningMethod }
  | { readonly type: 'answer'; readonly choiceId: string };

export function createExploreLearningState(): ExploreLearningState {
  return { active: false, taskIndex: 0, found: {}, answers: {}, completedTaskIds: [], methods: {} };
}

export function reduceExploreLearning(
  state: ExploreLearningState,
  action: ExploreLearningAction,
  tasks: readonly ExploreLearningTask[],
  targets: Readonly<Record<string, ExploreTargetDefinition>>,
): ExploreLearningState {
  if (action.type === 'reset') return createExploreLearningState();
  if (action.type === 'start') return state.active ? state : { ...state, active: true };
  const task = tasks[state.taskIndex];
  if (!state.active || !task) return state;
  const target = targets[task.targetKey];
  if (!target) return state;
  if (action.type === 'pick') {
    if (action.source !== 'model' && action.source !== 'diagram') return state;
    const allowed =
      target.kind === 'teaching-hotspot'
        ? action.source === 'diagram' && action.targetName === target.hotspotId
        : target.names.includes(action.targetName);
    const found = state.found[task.id] ?? [];
    if (!allowed || found.includes(action.targetName)) return state;
    // Mixed input is reported as diagram learning, never as a fully real-model find.
    const method = state.methods[task.id] === 'diagram' || action.source === 'diagram' ? 'diagram' : 'model';
    return {
      ...state,
      found: { ...state.found, [task.id]: [...found, action.targetName] },
      methods: { ...state.methods, [task.id]: method },
    };
  }
  if (action.type === 'answer') {
    if (evaluateChoice(task.question, action.choiceId) === 'invalid') return state;
    return { ...state, answers: { ...state.answers, [task.id]: action.choiceId } };
  }
  if (
    !hasRequiredTargets(target, state.found[task.id] ?? []) ||
    evaluateChoice(task.question, state.answers[task.id] ?? '') !== 'correct'
  )
    return state;
  return { ...state, taskIndex: state.taskIndex + 1, completedTaskIds: [...state.completedTaskIds, task.id] };
}

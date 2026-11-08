import { expect, it } from 'vitest';
import { exploreLearningTasks as tasks } from '../../../src/chapters/explore/learning-data';
import { exploreLearningTargets as targets } from '../../../src/chapters/explore/learning-targets';
import {
  createExploreLearningState,
  reduceExploreLearning,
  type ExploreLearningAction,
} from '../../../src/chapters/explore/learning-state';
const reduce = (state: ReturnType<typeof createExploreLearningState>, action: ExploreLearningAction) =>
  reduceExploreLearning(state, action, tasks, targets);

it('requires both target and understanding, rejects unknown IDs, and continues once', () => {
  let state = reduce(createExploreLearningState(), { type: 'start' });
  expect(reduce(state, { type: 'answer', choiceId: 'unknown' })).toBe(state);
  state = reduce(state, { type: 'answer', choiceId: tasks[0].question.correctChoiceId });
  expect(reduce(state, { type: 'continue' })).toBe(state);
  expect(reduce(state, { type: 'pick', targetName: 'ADAS', source: 'model' })).toBe(state);
  state = reduce(state, { type: 'pick', targetName: 'BatteryPack', source: 'model' });
  expect(reduce(state, { type: 'pick', targetName: 'BatteryPack', source: 'diagram' })).toBe(state);
  state = reduce(state, {
    type: 'answer',
    choiceId: tasks[0].question.choices.find((c) => c.id !== tasks[0].question.correctChoiceId)!.id,
  });
  expect(reduce(state, { type: 'continue' })).toBe(state);
  state = reduce(state, { type: 'answer', choiceId: tasks[0].question.correctChoiceId });
  state = reduce(state, { type: 'continue' });
  expect(state.completedTaskIds).toEqual([tasks[0].id]);
  expect(state.methods[tasks[0].id]).toBe('model');
  expect(state.taskIndex).toBe(1);
  expect(reduce(state, { type: 'continue' })).toBe(state);
});
it('completes 13 tasks, records diagram learning, and reset is separate', () => {
  let state = reduce(createExploreLearningState(), { type: 'start' });
  for (const task of tasks) {
    const target = targets[task.targetKey];
    const names = target.kind === 'teaching-hotspot' ? [target.hotspotId!] : target.names;
    for (const name of names) state = reduce(state, { type: 'pick', targetName: name, source: 'diagram' });
    state = reduce(state, { type: 'answer', choiceId: task.question.correctChoiceId });
    state = reduce(state, { type: 'continue' });
  }
  expect(state.completedTaskIds).toHaveLength(13);
  expect(Object.values(state.methods).every((method) => method === 'diagram')).toBe(true);
  expect(reduce(state, { type: 'continue' })).toBe(state);
  expect(reduce(state, { type: 'start' })).toBe(state);
  expect(reduce(state, { type: 'reset' })).toEqual(createExploreLearningState());
});
it('never allows a model hit to count as millimeter-wave teaching', () => {
  const task = tasks.find((t) => t.id === 'explore-sensor-millimeter')!;
  const localTasks = [task];
  let state = reduceExploreLearning(createExploreLearningState(), { type: 'start' }, localTasks, targets);
  expect(
    reduceExploreLearning(
      state,
      { type: 'pick', targetName: 'teaching-millimeter-radar', source: 'model' },
      localTasks,
      targets,
    ),
  ).toBe(state);
  state = reduceExploreLearning(
    state,
    { type: 'pick', targetName: 'teaching-millimeter-radar', source: 'diagram' },
    localTasks,
    targets,
  );
  expect(state.methods[task.id]).toBe('diagram');
});

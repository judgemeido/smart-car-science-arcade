import { describe, expect, it } from 'vitest';
import { historyExhibits } from '../../../src/chapters/history/data';
import { historyLearningContent as content } from '../../../src/chapters/history/learning-data';
import {
  countReasonCharacters,
  createHistoryLearningState,
  isHistoryLearningComplete,
  reduceHistoryLearning,
  type HistoryLearningState,
} from '../../../src/chapters/history/learning-state';

const correctOrder = [
  'history-event-2001',
  'history-event-2009',
  'history-event-2015',
  'history-event-2020',
  'history-event-2026',
];
const reduce = (state: HistoryLearningState, action: Parameters<typeof reduceHistoryLearning>[1]) =>
  reduceHistoryLearning(state, action, content);

function finishUnderstanding(state = createHistoryLearningState(content)) {
  for (const [toIndex, cardId] of correctOrder.entries())
    state = reduce(state, { type: 'move', cardId, toIndex });
  state = reduce(state, { type: 'submit-order' });
  for (const [questionId, choiceId] of [
    ['history-efficiency', 'history-efficiency:choice-1'],
    ['history-cleaner-energy', 'history-cleaner-energy:choice-2'],
    ['history-complex-road', 'history-complex-road:choice-3'],
  ])
    state = reduce(state, { type: 'answer', questionId, choiceId });
  return state;
}

describe('history event order', () => {
  it('starts mixed up and requires a correct, explicitly submitted order', () => {
    let state = createHistoryLearningState(content);
    expect(state.order).toEqual([
      'history-event-2020',
      'history-event-2001',
      'history-event-2026',
      'history-event-2009',
      'history-event-2015',
    ]);
    expect(reduce(state, { type: 'submit-order' }).orderConfirmed).toBe(false);
    for (const [toIndex, cardId] of correctOrder.entries())
      state = reduce(state, { type: 'move', cardId, toIndex });
    expect(state.orderConfirmed).toBe(false);
    state = reduce(state, { type: 'submit-order' });
    expect(state.order).toEqual(correctOrder);
    expect(state.orderConfirmed).toBe(true);
    expect(reduce(state, { type: 'submit-order' })).toEqual(state);
    expect(isHistoryLearningComplete(state, content)).toBe(false);
  });

  it.each([-1, 5, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid destination %s', (toIndex) => {
    const state = createHistoryLearningState(content);
    expect(reduce(state, { type: 'move', cardId: 'history-event-2001', toIndex })).toBe(state);
  });

  it('rejects unknown cards and duplicate or unknown card states without changing them', () => {
    const state = createHistoryLearningState(content);
    expect(reduce(state, { type: 'move', cardId: 'missing', toIndex: 0 })).toBe(state);
    for (const order of [
      ['history-event-2001', 'history-event-2001', ...correctOrder.slice(2)],
      ['missing', ...correctOrder.slice(1)],
      correctOrder.slice(1),
    ]) {
      const invalid = { ...state, order };
      expect(reduce(invalid, { type: 'submit-order' })).toBe(invalid);
      expect(reduce(invalid, { type: 'move', cardId: 'history-event-2009', toIndex: 0 })).toBe(invalid);
      expect(isHistoryLearningComplete(invalid, content)).toBe(false);
    }
  });

  it('withdraws an order confirmation after a real move, but not a no-op move', () => {
    const state = finishUnderstanding();
    expect(reduce(state, { type: 'move', cardId: 'history-event-2001', toIndex: 0 })).toBe(state);
    const moved = reduce(state, { type: 'move', cardId: 'history-event-2001', toIndex: 4 });
    expect(moved.orderConfirmed).toBe(false);
    expect(moved.orderFeedback).toBeNull();
  });
});

describe('history technical understanding', () => {
  it('lets each question be corrected and records each mastery once', () => {
    let state = createHistoryLearningState(content);
    for (const question of content.matchQuestions) {
      const wrong = question.choices.find((choice) => choice.id !== question.correctChoiceId)!;
      state = reduce(state, { type: 'answer', questionId: question.id, choiceId: wrong.id });
      expect(state.masteredQuestionIds).not.toContain(question.id);
      expect(state.answers[question.id]).toBe(wrong.id);
      state = reduce(state, { type: 'answer', questionId: question.id, choiceId: question.correctChoiceId });
      const repeated = reduce(state, {
        type: 'answer',
        questionId: question.id,
        choiceId: question.correctChoiceId,
      });
      expect(repeated.masteredQuestionIds.filter((id) => id === question.id)).toHaveLength(1);
      state = repeated;
    }
    expect(state.masteredQuestionIds).toHaveLength(3);
    expect(isHistoryLearningComplete(state, content)).toBe(false);
  });

  it('rejects unknown question and choice IDs', () => {
    const state = createHistoryLearningState(content);
    expect(
      reduce(state, { type: 'answer', questionId: 'missing', choiceId: 'history-efficiency:choice-1' }),
    ).toBe(state);
    expect(reduce(state, { type: 'answer', questionId: 'history-efficiency', choiceId: 'missing' })).toBe(
      state,
    );
  });

  it('judges stable choice IDs when choices are displayed in a different order', () => {
    const reversed = {
      ...content,
      matchQuestions: content.matchQuestions.map((q) => ({ ...q, choices: [...q.choices].reverse() })),
    };
    const state = reduceHistoryLearning(
      createHistoryLearningState(reversed),
      {
        type: 'answer',
        questionId: 'history-cleaner-energy',
        choiceId: 'history-cleaner-energy:choice-2',
      },
      reversed,
    );
    expect(state.masteredQuestionIds).toEqual(['history-cleaner-energy']);
  });
});

describe('history future expression', () => {
  it('counts trimmed Unicode code points rather than UTF-16 units', () => {
    expect(countReasonCharacters('  汽车🚗  ')).toBe(3);
    expect(countReasonCharacters(' \n\t ')).toBe(0);
  });

  it.each([
    [9, false],
    [10, true],
    [120, true],
    [121, false],
  ] as const)('accepts %i characters only when in range', (length, accepted) => {
    let state = reduce(finishUnderstanding(), { type: 'choose-future', choiceId: 'future-safety' });
    state = reduce(state, { type: 'edit-reason', value: `  ${'车'.repeat(length)}  ` });
    expect(state.futureConfirmed).toBe(false);
    expect(isHistoryLearningComplete(state, content)).toBe(false);
    state = reduce(state, { type: 'submit-future' });
    expect(state.futureConfirmed).toBe(accepted);
    expect(isHistoryLearningComplete(state, content)).toBe(accepted);
  });

  it('requires a valid choice and preserves raw reasons as text', () => {
    const raw = '<img src=x onerror=alert(1)>';
    let state = reduce(finishUnderstanding(), { type: 'edit-reason', value: raw });
    expect(reduce(state, { type: 'choose-future', choiceId: 'missing' })).toBe(state);
    expect(reduce(state, { type: 'submit-future' }).futureConfirmed).toBe(false);
    state = reduce(state, { type: 'choose-future', choiceId: 'future-accessibility' });
    state = reduce(state, { type: 'submit-future' });
    expect(state.reason).toBe(raw);
    expect(isHistoryLearningComplete(state, content)).toBe(true);
  });

  it.each(['future-safety', 'future-energy', 'future-accessibility', 'future-comfort'])(
    'accepts the viewpoint %s without judging its content',
    (choiceId) => {
      let state = reduce(finishUnderstanding(), { type: 'choose-future', choiceId });
      state = reduce(state, { type: 'edit-reason', value: '我希望它能帮助更多人方便乘车。' });
      state = reduce(state, { type: 'submit-future' });
      expect(isHistoryLearningComplete(state, content)).toBe(true);
      expect(reduce(state, { type: 'submit-future' })).toEqual(state);
    },
  );

  it('withdraws completion after editing a confirmed reason or changing the future choice', () => {
    let state = reduce(finishUnderstanding(), { type: 'choose-future', choiceId: 'future-safety' });
    state = reduce(state, { type: 'edit-reason', value: '我希望汽车能提前发现学校附近的行人。' });
    state = reduce(state, { type: 'submit-future' });
    expect(reduce(state, { type: 'edit-reason', value: state.reason })).toBe(state);
    const edited = reduce(state, { type: 'edit-reason', value: `${state.reason}🚗` });
    expect(edited.futureConfirmed).toBe(false);
    expect(isHistoryLearningComplete(edited, content)).toBe(false);
    expect(reduce(state, { type: 'choose-future', choiceId: 'future-energy' }).futureConfirmed).toBe(false);
  });

  it('resets learning without mutating the source state or exhibit content', () => {
    const before = JSON.stringify({ content, historyExhibits });
    const state = finishUnderstanding();
    const snapshot = JSON.stringify(state);
    const reset = reduce(state, { type: 'reset' });
    expect(reset).toEqual(createHistoryLearningState(content));
    expect(JSON.stringify(state)).toBe(snapshot);
    expect(JSON.stringify({ content, historyExhibits })).toBe(before);
    expect(
      content.contextCards
        .flatMap((card) => card.sourceExhibitIds ?? [])
        .concat(content.orderActivity.cards.map((card) => card.sourceExhibitId))
        .every((id) => historyExhibits.some((exhibit) => exhibit.id === id)),
    ).toBe(true);
  });
});

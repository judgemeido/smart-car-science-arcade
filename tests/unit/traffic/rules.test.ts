import { describe, expect, it } from 'vitest';
import { scenarios, orderOptions } from '../../../src/chapters/traffic/data';
import {
  createTrafficState,
  reduceTraffic,
  type TrafficEvent,
  type TrafficState,
} from '../../../src/chapters/traffic/rules';

const send = (state: TrafficState, event: TrafficEvent) => reduceTraffic(state, event, scenarios);
const atQuestion = (index = 0): TrafficState => ({
  ...createTrafficState(),
  phase: 'question',
  scenarioIndex: index,
});
const correctChoice = (index: number) => scenarios[index].options.find((option) => option.correct)!.choiceId;

describe('traffic answer and progression rules', () => {
  it('starts driving and only arrival opens the question', () => {
    const started = send(createTrafficState(), { type: 'start' });
    expect(started.state.phase).toBe('driving');
    expect(send(started.state, { type: 'answer', choiceId: correctChoice(0) }).state.score).toBe(0);
    expect(send(started.state, { type: 'arrive' }).state.phase).toBe('question');
  });

  it('completes all eight correct answers with eight points', () => {
    let state = send(createTrafficState(), { type: 'start' }).state;
    for (let index = 0; index < 8; index += 1) {
      state = send(state, { type: 'arrive' }).state;
      state = send(state, { type: 'answer', choiceId: correctChoice(index) }).state;
      if (state.phase === 'crossing') state = send(state, { type: 'crossing-complete' }).state;
      const continued = send(state, { type: 'continue' });
      state = continued.state;
      expect(continued.effects).toEqual(index === 7 ? [{ type: 'show-result' }] : []);
    }
    expect(state).toMatchObject({ phase: 'complete', scenarioIndex: 7, score: 8 });
  });

  it('accepts a wrong answer for zero points and permits continuing', () => {
    const answered = send(atQuestion(), { type: 'answer', choiceId: scenarios[0].options[1].choiceId });
    expect(answered.state).toMatchObject({ phase: 'feedback', score: 0 });
    expect(answered.effects).toEqual([{ type: 'schedule-continue', delayMs: 2300 }]);
    expect(send(answered.state, { type: 'continue' }).state).toMatchObject({
      phase: 'driving',
      scenarioIndex: 1,
    });
  });

  it('rejects unknown or another scenario choice without consuming an answer', () => {
    const question = atQuestion();
    for (const choiceId of ['unknown', correctChoice(1)]) {
      expect(send(question, { type: 'answer', choiceId })).toEqual({ state: question, effects: [] });
    }
    expect(send(question, { type: 'answer', choiceId: correctChoice(0) }).state.score).toBe(1);
  });

  it('scores a repeated answer only once', () => {
    const answered = send(atQuestion(), { type: 'answer', choiceId: correctChoice(0) });
    expect(send(answered.state, { type: 'answer', choiceId: correctChoice(0) })).toEqual({
      state: answered.state,
      effects: [],
    });
    expect(answered.state.score).toBe(1);
  });

  it('advances only once when manual and timed continuation race', () => {
    const answered = send(atQuestion(), { type: 'answer', choiceId: correctChoice(0) }).state;
    const continued = send(answered, { type: 'continue' });
    expect(send(continued.state, { type: 'continue' })).toEqual({ state: continued.state, effects: [] });
    expect(continued.state.scenarioIndex).toBe(1);
  });

  it('finishes the final correct answer and reset clears the game', () => {
    const answered = send(
      { ...atQuestion(7), score: 7 },
      { type: 'answer', choiceId: correctChoice(7) },
    ).state;
    const completed = send(answered, { type: 'continue' });
    expect(completed.state).toMatchObject({ phase: 'complete', score: 8 });
    expect(send(completed.state, { type: 'continue' }).effects).toEqual([]);
    expect(send(completed.state, { type: 'reset' }).state).toEqual(createTrafficState());
    expect(send(completed.state, { type: 'start' }).state).toMatchObject({
      phase: 'driving',
      score: 0,
      scenarioIndex: 0,
    });
  });

  it.each([1, 4])('starts crossing only for a correct pedestrian answer at index %i', (index) => {
    const crossed = send(atQuestion(index), { type: 'answer', choiceId: correctChoice(index) });
    expect(crossed.state).toMatchObject({ phase: 'crossing', score: 1 });
    expect(crossed.effects).toEqual([{ type: 'start-crossing', scenarioId: scenarios[index].id }]);
    expect(send(crossed.state, { type: 'continue' }).state).toBe(crossed.state);
    const cleared = send(crossed.state, { type: 'crossing-complete' });
    expect(cleared.state.phase).toBe('feedback');
    expect(cleared.effects).toEqual([{ type: 'schedule-continue', delayMs: 550 }]);
    expect(send(cleared.state, { type: 'crossing-complete' })).toEqual({ state: cleared.state, effects: [] });
    const wrong = send(atQuestion(index), { type: 'answer', choiceId: scenarios[index].options[1].choiceId });
    expect(wrong.state.phase).toBe('feedback');
    expect(wrong.effects).toEqual([{ type: 'schedule-continue', delayMs: 2300 }]);
  });

  it.each([0, 2, 3, 5, 6, 7])('uses normal feedback for other correct answers at index %i', (index) => {
    const answered = send(atQuestion(index), { type: 'answer', choiceId: correctChoice(index) });
    expect(answered.state.phase).toBe('feedback');
    expect(answered.effects).toEqual([{ type: 'schedule-continue', delayMs: 2300 }]);
  });

  it('keeps answer identity when options are reordered for display', () => {
    for (let index = 0; index < 8; index += 1) {
      const options = orderOptions(scenarios[index], index);
      const slot = [0, 2, 1, 2, 0, 1, 2, 1][index];
      expect(options[slot].choiceId).toBe(`${scenarios[index].id}:0`);
      expect(send(atQuestion(index), { type: 'answer', choiceId: options[slot].choiceId }).state.score).toBe(
        1,
      );
    }
  });
});

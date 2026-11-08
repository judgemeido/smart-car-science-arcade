import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { trafficPracticeScenarios as scenarios } from '../../../src/chapters/traffic/learning-data';
import {
  createTrafficPracticeState,
  reduceTrafficPractice,
  type TrafficPracticeEvent,
  type TrafficPracticeState,
} from '../../../src/chapters/traffic/practice-state';
import { createTrafficState, reduceTraffic } from '../../../src/chapters/traffic/rules';
import { scenarios as originalScenarios } from '../../../src/chapters/traffic/data';

const send = (state: TrafficPracticeState, event: TrafficPracticeEvent) =>
  reduceTrafficPractice(state, event, scenarios);
const decide = () => send(send(createTrafficPracticeState(), { type: 'start' }), { type: 'observed' });
const correct = (index = 0) => scenarios[index].question.correctChoiceId;
const continueAt = (state: TrafficPracticeState, fromPhase: 'feedback' | 'summarize') =>
  send(state, { type: 'continue', fromPhase, scenarioId: scenarios[state.scenarioIndex].id });

describe('traffic independent practice progression', () => {
  it('requires start and explicit observation before answering', () => {
    const ready = createTrafficPracticeState();
    expect(send(ready, { type: 'answer', choiceId: correct() })).toBe(ready);
    const observe = send(ready, { type: 'start' });
    expect(observe.phase).toBe('observe');
    expect(send(observe, { type: 'answer', choiceId: correct() })).toBe(observe);
    expect(send(observe, { type: 'observed' }).phase).toBe('decide');
  });
  it('ignores unknown and foreign IDs without consuming a decision', () => {
    const state = decide();
    for (const choiceId of ['', 'unknown', correct(1)])
      expect(send(state, { type: 'answer', choiceId })).toBe(state);
  });
  it('requires retry after a wrong answer and cannot summarize it', () => {
    const choiceId = scenarios[0].question.choices.find((choice) => choice.id !== correct())!.id;
    const wrong = send(decide(), { type: 'answer', choiceId });
    expect(wrong).toMatchObject({ phase: 'feedback', verdict: 'incorrect', masteredScenarioIds: [] });
    expect(continueAt(wrong, 'feedback')).toBe(wrong);
    expect(send(wrong, { type: 'retry' })).toMatchObject({ phase: 'decide', choiceId: null, verdict: null });
  });
  it('requires two phase-specific continues and ignores replay and old scenario events', () => {
    const feedback = send(decide(), { type: 'answer', choiceId: correct() });
    const event = { type: 'continue', fromPhase: 'feedback', scenarioId: scenarios[0].id } as const;
    const summary = send(feedback, event);
    expect(summary.phase).toBe('summarize');
    expect(send(summary, event)).toBe(summary);
    const next = continueAt(summary, 'summarize');
    expect(next).toMatchObject({
      phase: 'observe',
      scenarioIndex: 1,
      masteredScenarioIds: [scenarios[0].id],
    });
    expect(send(next, { type: 'continue', fromPhase: 'summarize', scenarioId: scenarios[0].id })).toBe(next);
    expect(send(next, { type: 'answer', choiceId: correct(1) })).toBe(next);
    expect(send(feedback, { type: 'answer', choiceId: correct() })).toBe(feedback);
  });
  it('masters each scenario only after its summary and completes all five once', () => {
    let state = send(createTrafficPracticeState(), { type: 'start' });
    for (let index = 0; index < 5; index += 1) {
      state = send(state, { type: 'observed' });
      state = send(state, { type: 'answer', choiceId: correct(index) });
      expect(state.masteredScenarioIds).toHaveLength(index);
      state = continueAt(state, 'feedback');
      expect(state.masteredScenarioIds).toHaveLength(index);
      const consumed = { type: 'continue', fromPhase: 'summarize', scenarioId: scenarios[index].id } as const;
      state = send(state, consumed);
      expect(send(state, consumed)).toBe(state);
      expect(state.masteredScenarioIds).toHaveLength(index + 1);
    }
    expect(state.phase).toBe('complete');
    expect(new Set(state.masteredScenarioIds).size).toBe(5);
  });
  it('resets only practice and does not import original reduceTraffic', () => {
    let originalTrafficState = createTrafficState();
    originalTrafficState = reduceTraffic(originalTrafficState, { type: 'start' }, originalScenarios).state;
    for (const scenario of originalScenarios) {
      originalTrafficState = reduceTraffic(originalTrafficState, { type: 'arrive' }, originalScenarios).state;
      originalTrafficState = reduceTraffic(
        originalTrafficState,
        { type: 'answer', choiceId: scenario.options.find((option) => option.correct)!.choiceId },
        originalScenarios,
      ).state;
      if (originalTrafficState.phase === 'crossing')
        originalTrafficState = reduceTraffic(
          originalTrafficState,
          { type: 'crossing-complete' },
          originalScenarios,
        ).state;
      originalTrafficState = reduceTraffic(
        originalTrafficState,
        { type: 'continue' },
        originalScenarios,
      ).state;
    }
    expect(send(decide(), { type: 'reset' })).toEqual(createTrafficPracticeState());
    expect(originalTrafficState.score).toBe(8);
    const source = readFileSync(
      new URL('../../../src/chapters/traffic/practice-state.ts', import.meta.url),
      'utf8',
    );
    expect(source).not.toMatch(/from ['"].*\/rules['"]/);
  });
});

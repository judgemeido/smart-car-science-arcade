import { describe, expect, it } from 'vitest';
import { scenarios, orderOptions } from '../../../src/chapters/traffic/data';
import {
  trafficReviewAnnotations,
  trafficPracticeScenarios,
} from '../../../src/chapters/traffic/learning-data';
import { evaluateChoice } from '../../../src/shared/learning-assessment';

describe('traffic learning content identity', () => {
  it('maps eight review annotations and all 24 choices to original stable IDs', () => {
    expect(trafficReviewAnnotations).toHaveLength(8);
    expect(new Set(trafficReviewAnnotations.map((item) => item.sourceScenarioId)).size).toBe(8);
    let choices = 0;
    for (const scenario of scenarios) {
      const annotation = trafficReviewAnnotations.find((item) => item.sourceScenarioId === scenario.id)!;
      expect(annotation).toBeDefined();
      expect(annotation.choiceFeedback).toHaveLength(3);
      for (const feedback of annotation.choiceFeedback) {
        expect(scenario.options.some((option) => option.choiceId === feedback.sourceChoiceId)).toBe(true);
        expect(feedback.copy.length).toBeGreaterThan(0);
        choices += 1;
      }
      expect(annotation).not.toHaveProperty('correctChoiceId');
    }
    expect(choices).toBe(24);
  });

  it('resolves explanations after display reordering by ID rather than slot', () => {
    scenarios.forEach((scenario, index) => {
      const annotation = trafficReviewAnnotations.find((item) => item.sourceScenarioId === scenario.id)!;
      for (const option of orderOptions(scenario, index).reverse()) {
        const before = annotation.choiceFeedback.find((item) => item.sourceChoiceId === option.choiceId);
        expect(before).toBeDefined();
        expect(before?.sourceChoiceId).toBe(option.choiceId);
      }
    });
  });

  it('defines five independent, valid questions and explicit scene assumptions', () => {
    expect(trafficPracticeScenarios).toHaveLength(5);
    expect(new Set(trafficPracticeScenarios.map((item) => item.id)).size).toBe(5);
    for (const scenario of trafficPracticeScenarios) {
      expect(scenarios.some((original) => original.id === scenario.id)).toBe(false);
      expect(scenario.sceneAssumptions.length).toBeGreaterThan(0);
      expect(evaluateChoice(scenario.question, scenario.question.correctChoiceId)).toBe('correct');
      expect(new Set(scenario.question.choices.map((choice) => choice.id)).size).toBe(3);
    }
    expect(trafficPracticeScenarios.map((item) => item.sceneKind)).toEqual([
      'green-clear',
      'sudden-person',
      'obstacle',
      'heavy-rain',
      'sensor-uncertain',
    ]);
  });
});

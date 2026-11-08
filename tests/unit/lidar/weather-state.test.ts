import { describe, expect, it } from 'vitest';
import { lidarLearningContent } from '../../../src/chapters/lidar/learning-data';
import { createWeatherLearningState, reduceWeatherLearning } from '../../../src/chapters/lidar/weather-state';

const questions = lidarLearningContent.weather.questions;
const reduce = (
  state: ReturnType<typeof createWeatherLearningState>,
  action: Parameters<typeof reduceWeatherLearning>[1],
) => reduceWeatherLearning(state, action, questions);
describe('weather learning', () => {
  it('accepts only normal, rain and fog without granting mastery', () => {
    let state = createWeatherLearningState();
    for (const weather of ['normal', 'rain', 'fog'] as const) {
      state = reduce(state, { type: 'set-weather', weather });
      expect(state.weather).toBe(weather);
      expect(state.masteredQuestionIds).toEqual([]);
    }
    expect(reduce(state, { type: 'set-weather', weather: 'snow' as 'normal' })).toBe(state);
  });
  it('ignores unknown questions and choices', () => {
    const state = createWeatherLearningState();
    expect(reduce(state, { type: 'answer', questionId: 'missing', choiceId: 'missing' })).toBe(state);
    expect(reduce(state, { type: 'answer', questionId: questions[0].id, choiceId: 'missing' })).toBe(state);
  });
  it('records corrections and mastery once, retaining them across weather changes', () => {
    let state = createWeatherLearningState();
    for (const question of questions) {
      const wrong = question.choices.find((choice) => choice.id !== question.correctChoiceId)!;
      state = reduce(state, { type: 'answer', questionId: question.id, choiceId: wrong.id });
      expect(state.result?.verdict).toBe('incorrect');
      expect(reduce(state, { type: 'continue' })).toBe(state);
      state = reduce(state, { type: 'answer', questionId: question.id, choiceId: question.correctChoiceId });
      expect(state.result?.verdict).toBe('correct');
      const count = state.masteredQuestionIds.length;
      state = reduce(state, { type: 'answer', questionId: question.id, choiceId: question.correctChoiceId });
      expect(state.masteredQuestionIds).toHaveLength(count);
      state = reduce(state, { type: 'set-weather', weather: 'rain' });
      expect(state.masteredQuestionIds).toHaveLength(count);
      state = reduce(state, { type: 'continue' });
      expect(reduce(state, { type: 'continue' })).toBe(state);
    }
    expect(state.masteredQuestionIds).toHaveLength(3);
    expect(state.completed).toBe(true);
    expect(state.answers).toHaveLength(6);
    expect(reduce(state, { type: 'reset' })).toEqual(createWeatherLearningState());
  });
});

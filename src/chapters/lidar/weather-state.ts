import { evaluateChoice, type ChoiceQuestion } from '../../shared/learning-assessment';

export type LearningWeather = 'normal' | 'rain' | 'fog';
export interface WeatherAnswer {
  readonly questionId: string;
  readonly choiceId: string;
  readonly verdict: 'correct' | 'incorrect';
  readonly weather: LearningWeather;
}
export interface WeatherLearningState {
  readonly weather: LearningWeather;
  readonly answers: readonly WeatherAnswer[];
  readonly masteredQuestionIds: readonly string[];
  readonly questionIndex: number;
  readonly result: WeatherAnswer | null;
  readonly completed: boolean;
}
export type WeatherLearningAction =
  | { type: 'set-weather'; weather: LearningWeather }
  | { type: 'answer'; questionId: string; choiceId: string }
  | { type: 'continue' }
  | { type: 'reset' };

export function createWeatherLearningState(): WeatherLearningState {
  return {
    weather: 'normal',
    answers: [],
    masteredQuestionIds: [],
    questionIndex: 0,
    result: null,
    completed: false,
  };
}
export function reduceWeatherLearning(
  state: WeatherLearningState,
  action: WeatherLearningAction,
  questions: readonly ChoiceQuestion[],
): WeatherLearningState {
  if (action.type === 'reset') return createWeatherLearningState();
  if (action.type === 'set-weather')
    return ['normal', 'rain', 'fog'].includes(action.weather) ? { ...state, weather: action.weather } : state;
  if (state.completed) return state;
  if (action.type === 'continue') {
    if (state.result?.verdict !== 'correct') return state;
    return state.questionIndex === questions.length - 1
      ? { ...state, completed: true }
      : { ...state, questionIndex: state.questionIndex + 1, result: null };
  }
  if (action.type !== 'answer' || state.result?.verdict === 'correct') return state;
  const question = questions[state.questionIndex];
  if (!question || action.questionId !== question.id) return state;
  const verdict = evaluateChoice(question, action.choiceId);
  if (verdict === 'invalid') return state;
  const answer: WeatherAnswer = {
    questionId: question.id,
    choiceId: action.choiceId,
    verdict,
    weather: state.weather,
  };
  return {
    ...state,
    result: answer,
    answers: [...state.answers, answer],
    masteredQuestionIds:
      verdict === 'correct' && !state.masteredQuestionIds.includes(question.id)
        ? [...state.masteredQuestionIds, question.id]
        : state.masteredQuestionIds,
  };
}

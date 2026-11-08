import { evaluateChoice } from '../../shared/learning-assessment';
import type { HistoryLearningContent } from './learning-data';

export interface HistoryLearningState {
  readonly order: readonly string[];
  readonly orderConfirmed: boolean;
  readonly orderFeedback: 'correct' | 'incorrect' | null;
  readonly answers: Readonly<Record<string, string>>;
  readonly masteredQuestionIds: readonly string[];
  readonly futureChoiceId: string | null;
  readonly reason: string;
  readonly futureConfirmed: boolean;
  readonly futureFeedback: 'confirmed' | 'invalid' | null;
}

export type HistoryLearningAction =
  | { readonly type: 'move'; readonly cardId: string; readonly toIndex: number }
  | { readonly type: 'submit-order' }
  | { readonly type: 'answer'; readonly questionId: string; readonly choiceId: string }
  | { readonly type: 'choose-future'; readonly choiceId: string }
  | { readonly type: 'edit-reason'; readonly value: string }
  | { readonly type: 'submit-future' }
  | { readonly type: 'reset' };

export function countReasonCharacters(value: string): number {
  return Array.from(value.trim()).length;
}

export function createHistoryLearningState(content: HistoryLearningContent): HistoryLearningState {
  return {
    order: [...content.orderActivity.initialOrder],
    orderConfirmed: false,
    orderFeedback: null,
    answers: {},
    masteredQuestionIds: [],
    futureChoiceId: null,
    reason: '',
    futureConfirmed: false,
    futureFeedback: null,
  };
}

function isValidOrder(order: readonly string[], content: HistoryLearningContent): boolean {
  const ids = content.orderActivity.cards.map((card) => card.id);
  return (
    order.length === ids.length &&
    new Set(order).size === order.length &&
    order.every((id) => ids.includes(id))
  );
}

function hasCorrectOrder(state: HistoryLearningState, content: HistoryLearningContent): boolean {
  return (
    isValidOrder(state.order, content) &&
    state.order.length === content.orderActivity.correctOrder.length &&
    state.order.every((id, index) => id === content.orderActivity.correctOrder[index])
  );
}

function hasValidFuture(state: HistoryLearningState, content: HistoryLearningContent): boolean {
  const length = countReasonCharacters(state.reason);
  return (
    content.futureActivity.choices.some((choice) => choice.id === state.futureChoiceId) &&
    length >= content.futureActivity.response.minCharacters &&
    length <= content.futureActivity.response.maxCharacters
  );
}

export function reduceHistoryLearning(
  state: HistoryLearningState,
  action: HistoryLearningAction,
  content: HistoryLearningContent,
): HistoryLearningState {
  switch (action.type) {
    case 'move': {
      if (
        !isValidOrder(state.order, content) ||
        !Number.isInteger(action.toIndex) ||
        action.toIndex < 0 ||
        action.toIndex >= state.order.length
      )
        return state;
      const fromIndex = state.order.indexOf(action.cardId);
      if (fromIndex < 0 || fromIndex === action.toIndex) return state;
      const order = [...state.order];
      order.splice(fromIndex, 1);
      order.splice(action.toIndex, 0, action.cardId);
      return { ...state, order, orderConfirmed: false, orderFeedback: null };
    }
    case 'submit-order': {
      if (!isValidOrder(state.order, content)) return state;
      const correct = hasCorrectOrder(state, content);
      return { ...state, orderConfirmed: correct, orderFeedback: correct ? 'correct' : 'incorrect' };
    }
    case 'answer': {
      const question = content.matchQuestions.find((item) => item.id === action.questionId);
      if (!question || state.masteredQuestionIds.includes(question.id)) return state;
      const verdict = evaluateChoice(question, action.choiceId);
      if (verdict === 'invalid') return state;
      return {
        ...state,
        answers: { ...state.answers, [question.id]: action.choiceId },
        masteredQuestionIds:
          verdict === 'correct' ? [...state.masteredQuestionIds, question.id] : state.masteredQuestionIds,
      };
    }
    case 'choose-future':
      if (
        state.futureChoiceId === action.choiceId ||
        !content.futureActivity.choices.some((item) => item.id === action.choiceId)
      )
        return state;
      return { ...state, futureChoiceId: action.choiceId, futureConfirmed: false, futureFeedback: null };
    case 'edit-reason':
      if (state.reason === action.value) return state;
      return { ...state, reason: action.value, futureConfirmed: false, futureFeedback: null };
    case 'submit-future': {
      const valid = hasValidFuture(state, content);
      return { ...state, futureConfirmed: valid, futureFeedback: valid ? 'confirmed' : 'invalid' };
    }
    case 'reset':
      return createHistoryLearningState(content);
    default:
      return state;
  }
}

export function isHistoryLearningComplete(
  state: HistoryLearningState,
  content: HistoryLearningContent,
): boolean {
  return (
    state.orderConfirmed &&
    hasCorrectOrder(state, content) &&
    content.matchQuestions.every(
      (question) =>
        state.masteredQuestionIds.includes(question.id) &&
        evaluateChoice(question, state.answers[question.id]) === 'correct',
    ) &&
    state.futureConfirmed &&
    hasValidFuture(state, content)
  );
}

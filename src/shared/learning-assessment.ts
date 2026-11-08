export interface ChoiceQuestion {
  readonly id: string;
  readonly kind?: 'single-choice';
  readonly prompt: string;
  readonly choices: readonly { readonly id: string; readonly label: string }[];
  readonly correctChoiceId: string;
  readonly correctFeedback: string;
  readonly retryFeedback: string;
}

export type ChoiceVerdict = 'correct' | 'incorrect' | 'invalid';

export function evaluateChoice(question: ChoiceQuestion, choiceId: string): ChoiceVerdict {
  if (choiceId === '') return 'invalid';
  if (!question.choices.some((choice) => choice.id === choiceId)) return 'invalid';
  return choiceId === question.correctChoiceId ? 'correct' : 'incorrect';
}

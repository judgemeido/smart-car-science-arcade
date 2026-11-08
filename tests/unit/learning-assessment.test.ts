import { describe, expect, it } from 'vitest';
import { evaluateChoice, type ChoiceQuestion } from '../../src/shared/learning-assessment';

const question: ChoiceQuestion = {
  id: 'safety-question',
  prompt: '道路信息不可靠时，怎样降低风险？',
  choices: [
    { id: 'keep-speed', label: '保持原速度' },
    { id: 'reduce-risk', label: '降低风险并在安全条件下停车' },
    { id: 'ignore-warning', label: '忽略提示' },
  ],
  correctChoiceId: 'reduce-risk',
  correctFeedback: '不确定时应降低风险。',
  retryFeedback: '没有可靠信息不能当作已经安全。',
};

describe('learning choice assessment', () => {
  it('accepts the authored safe choice regardless of its display position', () => {
    expect(evaluateChoice(question, 'reduce-risk')).toBe('correct');
    const choices = [...question.choices.slice(1), ...question.choices.slice(0, 1)];
    expect(evaluateChoice({ ...question, choices }, 'reduce-risk')).toBe('correct');
  });

  it('returns correction feedback status for a known unsafe choice', () => {
    expect(evaluateChoice(question, 'keep-speed')).toBe('incorrect');
    expect(evaluateChoice(question, 'ignore-warning')).toBe('incorrect');
  });

  it('rejects stale and missing choice IDs instead of treating them as answers', () => {
    expect(evaluateChoice(question, 'another-question:correct')).toBe('invalid');
    expect(evaluateChoice(question, '')).toBe('invalid');
  });

  it.each(['', 'reduce-risk'])('rejects an authored empty ID when the correct ID is %j', (correctChoiceId) => {
    const questionWithEmptyChoice: ChoiceQuestion = {
      ...question,
      choices: [...question.choices, { id: '', label: 'Empty authored choice' }],
      correctChoiceId,
    };
    expect(evaluateChoice(questionWithEmptyChoice, '')).toBe('invalid');
  });

  it('rejects a submitted correct ID that is absent from the authored choices', () => {
    const questionWithAbsentCorrectChoice: ChoiceQuestion = {
      ...question,
      correctChoiceId: 'absent-correct-choice',
    };
    expect(evaluateChoice(questionWithAbsentCorrectChoice, 'absent-correct-choice')).toBe('invalid');
  });
});

import { evaluateChoice } from '../../shared/learning-assessment';
import type { HistoryLearningContent } from './learning-data';
import {
  countReasonCharacters,
  isHistoryLearningComplete,
  type HistoryLearningState,
} from './learning-state';

function node<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  copy?: string,
  className?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (copy !== undefined) element.textContent = copy;
  if (className) element.className = className;
  return element;
}

function button(copy: string, key: string): HTMLButtonElement {
  const element = node('button', copy, 'history-learning-button');
  element.type = 'button';
  element.dataset.historyFocusKey = key;
  return element;
}

function feedback(copy: string, attribute: string): HTMLParagraphElement {
  const element = node('p', copy, 'history-learning-feedback');
  element.setAttribute(attribute, '');
  element.setAttribute('role', 'status');
  element.tabIndex = -1;
  return element;
}

export function renderHistoryReading(host: HTMLElement, content: HistoryLearningContent): void {
  const heading = node('h2', content.title);
  heading.tabIndex = -1;
  heading.dataset.historyReadingHeading = '';
  const cards = node('div', undefined, 'history-reading-grid');
  for (const card of content.contextCards) {
    const article = node('article', undefined, 'history-reading-card');
    article.dataset.historyReadingCard = card.id;
    if (card.role) article.append(node('span', '补充阅读', 'timeline-kicker'));
    article.append(node('h3', card.title), node('p', card.copy));
    if (card.note) article.append(node('p', card.note, 'history-learning-note'));
    for (const [index, sourceId] of (card.sourceExhibitIds ?? []).entries()) {
      const link = button(
        `查看相关展品${card.sourceExhibitIds!.length > 1 ? ` ${index + 1}` : ''}`,
        `reading-${card.id}-${index}`,
      );
      link.dataset.historyExhibit = sourceId;
      article.append(link);
    }
    cards.append(article);
  }
  host.replaceChildren(heading, node('p', content.studentCopy.intro, 'history-learning-intro'), cards);
}

export function renderHistoryLearning(
  host: HTMLElement,
  state: HistoryLearningState,
  content: HistoryLearningContent,
): void {
  const tasks = node('div', undefined, 'history-learning-tasks');
  const order = node('section', undefined, 'history-learning-task');
  const orderHeading = node('h3', content.orderActivity.title);
  orderHeading.id = 'history-order-heading';
  order.setAttribute('aria-labelledby', orderHeading.id);
  order.append(orderHeading, node('p', content.orderActivity.prompt));
  order.append(node('p', '这五张卡来自馆内展品；它们是汽车进化的一部分。', 'history-learning-note'));
  const orderList = node('ol', undefined, 'history-order-list');
  for (const [index, cardId] of state.order.entries()) {
    const card = content.orderActivity.cards.find((item) => item.id === cardId);
    if (!card) continue;
    const item = node('li', undefined, 'history-order-card');
    item.dataset.historyOrderCard = cardId;
    item.dataset.historyDropIndex = String(index);
    item.draggable = true;
    const select = button(`${card.year} · ${card.label}`, `card-${cardId}`);
    select.dataset.historySelectCard = cardId;
    select.setAttribute('aria-pressed', 'false');
    const controls = node('div', undefined, 'history-order-controls');
    const place = button(`放到第 ${index + 1} 位`, `place-${index}`);
    place.dataset.historyPlace = String(index);
    place.disabled = true;
    const source = button(`查看 ${card.year} 展品`, `source-${cardId}`);
    source.dataset.historyExhibit = card.sourceExhibitId;
    controls.append(place, source);
    item.append(select, controls);
    orderList.append(item);
  }
  const selection = feedback('先选一张卡片，再选择要放到的位置。', 'data-history-order-selection');
  const submitOrder = button('确认我的顺序', 'submit-order');
  submitOrder.dataset.historySubmitOrder = '';
  order.append(
    orderList,
    selection,
    submitOrder,
    feedback(
      state.orderFeedback === 'correct'
        ? content.orderActivity.correctFeedback
        : state.orderFeedback === 'incorrect'
          ? content.orderActivity.retryFeedback
          : '排好后，点击“确认我的顺序”。',
      'data-history-order-feedback',
    ),
  );

  const match = node('section', undefined, 'history-learning-task');
  const matchHeading = node('h3', content.matchTitle);
  matchHeading.id = 'history-match-heading';
  match.setAttribute('aria-labelledby', matchHeading.id);
  match.append(matchHeading, node('p', '每题先选择，再提交。读完反馈后，点击继续。'));
  for (const [index, question] of content.matchQuestions.entries()) {
    const form = node('form', undefined, 'history-match-question');
    form.dataset.historyMatchQuestion = question.id;
    form.hidden = index !== 0;
    const fieldset = node('fieldset');
    const legend = node('legend', `${index + 1} / ${content.matchQuestions.length} · ${question.prompt}`);
    legend.tabIndex = -1;
    legend.dataset.historyQuestionHeading = '';
    fieldset.append(legend);
    const mastered = state.masteredQuestionIds.includes(question.id);
    for (const choice of question.choices) {
      const label = node('label', undefined, 'history-choice');
      const input = node('input');
      input.type = 'radio';
      input.name = question.id;
      input.value = choice.id;
      input.dataset.historyFocusKey = choice.id;
      input.checked = state.answers[question.id] === choice.id;
      input.disabled = mastered;
      label.append(input, node('span', choice.label));
      fieldset.append(label);
    }
    const submit = button(mastered ? '已理解' : '提交我的选择', `submit-${question.id}`);
    submit.type = 'submit';
    submit.dataset.historySubmitAnswer = '';
    submit.disabled = mastered;
    const verdict = state.answers[question.id] ? evaluateChoice(question, state.answers[question.id]) : null;
    const response = feedback(
      verdict === 'correct'
        ? question.correctFeedback
        : verdict === 'incorrect'
          ? question.retryFeedback
          : '请选择一个办法，再提交。',
      'data-history-match-feedback',
    );
    const next = button(
      index + 1 === content.matchQuestions.length ? '读完了，去表达我的想法' : '读完了，继续下一题',
      `continue-${question.id}`,
    );
    next.dataset.historyMatchContinue = question.id;
    next.disabled = !mastered;
    form.append(fieldset, submit, response, next);
    match.append(form);
  }

  const future = node('form', undefined, 'history-learning-task');
  future.dataset.historyFutureForm = '';
  const futureHeading = node('h3', content.futureActivity.title);
  futureHeading.tabIndex = -1;
  futureHeading.dataset.historyFutureHeading = '';
  future.append(futureHeading, node('p', content.futureActivity.prompt));
  const futureChoices = node('fieldset');
  futureChoices.append(node('legend', '我最重视的能力（没有唯一正确选择）'));
  for (const choice of content.futureActivity.choices) {
    const label = node('label', undefined, 'history-choice');
    const input = node('input');
    input.type = 'radio';
    input.name = 'history-future-choice';
    input.value = choice.id;
    input.dataset.historyFutureChoice = choice.id;
    input.dataset.historyFocusKey = choice.id;
    input.checked = state.futureChoiceId === choice.id;
    label.append(input, node('span', choice.label));
    futureChoices.append(label);
  }
  const reasonLabel = node('label', content.futureActivity.response.prompt, 'history-reason-label');
  reasonLabel.htmlFor = 'history-learning-reason';
  const textarea = node('textarea');
  textarea.id = reasonLabel.htmlFor;
  textarea.rows = 4;
  textarea.value = state.reason;
  textarea.dataset.historyReason = '';
  textarea.dataset.historyFocusKey = 'reason';
  textarea.setAttribute('aria-describedby', 'history-reason-rule history-reason-count');
  const rule = node(
    'p',
    `写 ${content.futureActivity.response.minCharacters}–${content.futureActivity.response.maxCharacters} 个字，首尾空白不计。字数只用于确认写完，不评价观点好坏。`,
    'history-learning-note',
  );
  rule.id = 'history-reason-rule';
  const count = node('p', `已写 ${countReasonCharacters(state.reason)} 个字`, 'history-learning-note');
  count.id = 'history-reason-count';
  count.dataset.historyReasonCount = '';
  const example = node('details', undefined, 'history-learning-example');
  example.append(node('summary', '看看表达例子'), node('p', content.futureActivity.response.sample));
  const submitFuture = button('确认我的选择和理由', 'submit-future');
  submitFuture.type = 'submit';
  submitFuture.dataset.historySubmitFuture = '';
  future.append(
    futureChoices,
    reasonLabel,
    textarea,
    rule,
    count,
    example,
    submitFuture,
    feedback(
      state.futureFeedback === 'confirmed'
        ? content.futureActivity.feedback
        : state.futureFeedback === 'invalid'
          ? `请选择一项能力，写 ${content.futureActivity.response.minCharacters}–${content.futureActivity.response.maxCharacters} 个字后再确认。`
          : '选择和理由写好后，记得确认。',
      'data-history-future-feedback',
    ),
  );
  tasks.append(order, match, future);

  const progress = node(
    'p',
    `任务A：${state.orderConfirmed ? '已确认' : '待确认'} · 任务B：${state.masteredQuestionIds.length}/${content.matchQuestions.length} 题已理解 · 任务C：${state.futureConfirmed ? '已确认' : '待确认'}`,
    'history-learning-progress',
  );
  progress.dataset.historyLearningProgress = '';
  const reset = button('重新开始学习任务', 'reset');
  reset.dataset.historyReset = '';
  host.replaceChildren(progress, tasks);
  if (isHistoryLearningComplete(state, content)) {
    const outcome = node('article', undefined, 'history-outcome');
    outcome.dataset.historyOutcome = '';
    outcome.append(node('h3', content.outcomeCard.title), node('p', content.studentCopy.completion));
    outcome.append(node('h4', content.outcomeCard.fields[0]));
    const events = node('ol');
    for (const id of state.order) {
      const card = content.orderActivity.cards.find((item) => item.id === id)!;
      events.append(node('li', `${card.year} · ${card.label}`));
    }
    const understood = content.matchQuestions.find((question) =>
      state.masteredQuestionIds.includes(question.id),
    )!;
    outcome.append(events, node('h4', content.outcomeCard.fields[1]), node('p', understood.correctFeedback));
    const choice = content.futureActivity.choices.find((item) => item.id === state.futureChoiceId)!;
    const reason = node('p', state.reason.trim());
    reason.dataset.historyOutcomeReason = '';
    outcome.append(node('h4', content.outcomeCard.fields[2]), node('p', choice.label), reason);
    host.append(outcome);
  }
  host.append(reset);
}

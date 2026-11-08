import { archiveAssets, historyExhibits } from './data';
import { renderArchive, renderTimeline } from './render';
import { createScope } from '../../shared/lifecycle';
import type { ChapterController } from '../../app/types';
import { historyLearningContent as content } from './learning-data';
import {
  countReasonCharacters,
  createHistoryLearningState,
  reduceHistoryLearning,
  type HistoryLearningAction,
} from './learning-state';
import { renderHistoryLearning, renderHistoryReading } from './learning-view';
export function mount(host: HTMLElement): ChapterController {
  const scope = createScope();
  let active = true;
  let disposed = false;
  let state = createHistoryLearningState(content);
  let selectedCardId: string | null = null;
  let matchIndex = 0;
  let composing = false;
  const matchDrafts: Record<string, string> = {};
  const panel = host.querySelector<HTMLElement>('[data-history-learning-panel]');
  const toggle = host.querySelector<HTMLButtonElement>('[data-history-learning-toggle]');
  const reading = host.querySelector<HTMLElement>('[data-history-reading]');
  const learning = host.querySelector<HTMLElement>('[data-history-learning]');
  const intro = host.querySelector<HTMLElement>('[data-history-learning-intro]');
  const bridge = host.querySelector<HTMLElement>('[data-history-learning-bridge]');
  if (intro) intro.textContent = content.studentCopy.intro;
  if (bridge) bridge.textContent = content.studentCopy.bridge;
  if (reading) renderHistoryReading(reading, content);

  function showSelection() {
    learning?.querySelectorAll<HTMLButtonElement>('[data-history-select-card]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.historySelectCard === selectedCardId));
    });
    learning?.querySelectorAll<HTMLButtonElement>('[data-history-place]').forEach((button) => {
      button.disabled = !selectedCardId;
    });
    const status = learning?.querySelector<HTMLElement>('[data-history-order-selection]');
    const card = content.orderActivity.cards.find((item) => item.id === selectedCardId);
    if (status)
      status.textContent = card
        ? `已选择 ${card.year}，请选择要放到第几位。`
        : '先选一张卡片，再选择要放到的位置。';
  }

  function showMatch() {
    learning?.querySelectorAll<HTMLElement>('[data-history-match-question]').forEach((form, index) => {
      form.hidden = index !== matchIndex;
      const id = form.dataset.historyMatchQuestion!;
      const draft = matchDrafts[id];
      if (draft && !state.masteredQuestionIds.includes(id)) {
        form.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((input) => {
          input.checked = input.value === draft;
        });
      }
    });
  }

  function redraw() {
    if (!learning) return;
    const focused =
      document.activeElement instanceof HTMLElement && learning.contains(document.activeElement)
        ? document.activeElement
        : null;
    const focusKey = focused?.dataset.historyFocusKey;
    renderHistoryLearning(learning, state, content);
    showSelection();
    showMatch();
    if (focusKey)
      [...learning.querySelectorAll<HTMLElement>('[data-history-focus-key]')]
        .find((element) => element.dataset.historyFocusKey === focusKey)
        ?.focus({ preventScroll: true });
  }

  function dispatch(action: HistoryLearningAction) {
    state = reduceHistoryLearning(state, action, content);
    redraw();
  }

  function updateReason(input: HTMLTextAreaElement) {
    state = reduceHistoryLearning(state, { type: 'edit-reason', value: input.value }, content);
    const count = learning?.querySelector<HTMLElement>('[data-history-reason-count]');
    if (count) count.textContent = `已写 ${countReasonCharacters(state.reason)} 个字`;
    if (!state.futureConfirmed) {
      learning?.querySelector('[data-history-outcome]')?.remove();
      const feedback = learning?.querySelector<HTMLElement>('[data-history-future-feedback]');
      if (feedback) feedback.textContent = '选择或理由改好后，请再次确认。';
      const progress = learning?.querySelector<HTMLElement>('[data-history-learning-progress]');
      if (progress)
        progress.textContent = `任务A：${state.orderConfirmed ? '已确认' : '待确认'} · 任务B：${state.masteredQuestionIds.length}/${content.matchQuestions.length} 题已理解 · 任务C：待确认`;
    }
  }

  function setOpen(open: boolean, restoreFocus = true) {
    if (!panel || !toggle) return;
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? '收起学习任务' : '打开学习任务';
    if (restoreFocus)
      (open ? reading?.querySelector<HTMLElement>('[data-history-reading-heading]') : toggle)?.focus();
  }

  function resetLearning() {
    selectedCardId = null;
    matchIndex = 0;
    composing = false;
    for (const id of Object.keys(matchDrafts)) delete matchDrafts[id];
    dispatch({ type: 'reset' });
  }

  function visitExhibit(id: string) {
    const originalButton = [...host.querySelectorAll<HTMLButtonElement>('[data-timeline-target]')].find(
      (button) => button.dataset.timelineTarget === id,
    );
    if (!originalButton) return;
    host
      .querySelectorAll('[data-timeline-target]')
      .forEach((item) => item.classList.toggle('is-selected', item === originalButton));
    const article = [...host.querySelectorAll<HTMLElement>('[data-archive-article]')].find(
      (item) => item.id === id,
    );
    article?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  redraw();
  // BFCache exits keep this controller mounted; uncached teardown also resets in dispose below.
  scope.listen(
    window,
    'pagehide',
    () => {
      setOpen(false, false);
      resetLearning();
    },
    { capture: true },
  );
  const timeline = host.querySelector<HTMLDivElement>('[data-history-timeline]');
  if (timeline) timeline.innerHTML = renderTimeline(historyExhibits);
  const archive = host.querySelector<HTMLDivElement>('[data-history-archive-list]');
  if (archive) archive.innerHTML = renderArchive(historyExhibits, archiveAssets);
  scope.listen(host, 'click', (event: MouseEvent) => {
    if (!active || !(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>('button');
    if (!button || !host.contains(button)) return;
    if (button.hasAttribute('data-history-learning-toggle')) {
      setOpen(Boolean(panel?.hidden));
      return;
    }
    if (button.hasAttribute('data-history-learning-close')) {
      setOpen(false);
      return;
    }
    const exhibitId = button.dataset.timelineTarget ?? button.dataset.historyExhibit;
    if (exhibitId) {
      visitExhibit(exhibitId);
      return;
    }
    if (!learning?.contains(button)) return;
    if (button.dataset.historySelectCard) {
      if (state.order.includes(button.dataset.historySelectCard)) {
        selectedCardId = button.dataset.historySelectCard;
        showSelection();
      }
    } else if (button.dataset.historyPlace !== undefined && selectedCardId) {
      dispatch({ type: 'move', cardId: selectedCardId, toIndex: Number(button.dataset.historyPlace) });
    } else if (button.hasAttribute('data-history-submit-order')) {
      dispatch({ type: 'submit-order' });
    } else if (button.dataset.historyMatchContinue) {
      const question = content.matchQuestions[matchIndex];
      if (
        question?.id !== button.dataset.historyMatchContinue ||
        !state.masteredQuestionIds.includes(question.id)
      )
        return;
      if (matchIndex + 1 < content.matchQuestions.length) {
        matchIndex += 1;
        showMatch();
        learning
          .querySelector<HTMLElement>(
            '[data-history-match-question]:not([hidden]) [data-history-question-heading]',
          )
          ?.focus();
      } else learning.querySelector<HTMLElement>('[data-history-future-heading]')?.focus();
    } else if (button.hasAttribute('data-history-reset')) {
      resetLearning();
    }
  });

  scope.listen(host, 'submit', (event: SubmitEvent) => {
    if (!(event.target instanceof HTMLFormElement) || !learning?.contains(event.target)) return;
    event.preventDefault();
    if (!active || composing) return;
    const form = event.target;
    if (form.hasAttribute('data-history-future-form')) {
      dispatch({ type: 'submit-future' });
    } else if (form.dataset.historyMatchQuestion === content.matchQuestions[matchIndex]?.id) {
      const choice = form.querySelector<HTMLInputElement>('input[type="radio"]:checked');
      if (choice) {
        dispatch({ type: 'answer', questionId: form.dataset.historyMatchQuestion!, choiceId: choice.value });
        learning
          .querySelector<HTMLElement>(
            '[data-history-match-question]:not([hidden]) [data-history-match-feedback]',
          )
          ?.focus();
      }
    }
  });

  scope.listen(host, 'change', (event: Event) => {
    if (!active || !(event.target instanceof HTMLInputElement) || !learning?.contains(event.target)) return;
    const input = event.target;
    if (input.dataset.historyFutureChoice)
      dispatch({ type: 'choose-future', choiceId: input.dataset.historyFutureChoice });
    else {
      const question = content.matchQuestions.find((item) => item.id === input.name);
      if (question?.choices.some((choice) => choice.id === input.value))
        matchDrafts[question.id] = input.value;
    }
  });

  scope.listen(host, 'input', (event: InputEvent) => {
    if (
      active &&
      event.target instanceof HTMLTextAreaElement &&
      learning?.contains(event.target) &&
      event.target.hasAttribute('data-history-reason')
    )
      updateReason(event.target);
  });
  scope.listen(host, 'compositionstart', (event: CompositionEvent) => {
    if (active && event.target instanceof HTMLTextAreaElement && learning?.contains(event.target))
      composing = true;
  });
  scope.listen(host, 'compositionend', (event: CompositionEvent) => {
    if (event.target instanceof HTMLTextAreaElement && learning?.contains(event.target)) {
      composing = false;
      if (active) updateReason(event.target);
    }
  });

  scope.listen(host, 'dragstart', (event: DragEvent) => {
    if (!active || !(event.target instanceof Element)) return;
    const card = event.target.closest<HTMLElement>('[data-history-order-card]');
    if (!card || !learning?.contains(card) || !state.order.includes(card.dataset.historyOrderCard!)) return;
    selectedCardId = card.dataset.historyOrderCard!;
    event.dataTransfer?.setData('text/plain', selectedCardId);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    showSelection();
  });
  scope.listen(host, 'dragover', (event: DragEvent) => {
    if (!active || !(event.target instanceof Element) || !selectedCardId) return;
    const card = event.target.closest<HTMLElement>('[data-history-drop-index]');
    if (card && learning?.contains(card)) event.preventDefault();
  });
  scope.listen(host, 'drop', (event: DragEvent) => {
    if (!active || !(event.target instanceof Element)) return;
    const card = event.target.closest<HTMLElement>('[data-history-drop-index]');
    if (!card || !learning?.contains(card)) return;
    event.preventDefault();
    const cardId = event.dataTransfer?.getData('text/plain') || selectedCardId;
    if (cardId) dispatch({ type: 'move', cardId, toIndex: Number(card.dataset.historyDropIndex) });
  });
  return {
    setActive(value) {
      if (disposed) return;
      active = value;
      if (!value) composing = false;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      active = false;
      scope.dispose();
      setOpen(false, false);
      resetLearning();
    },
  };
}

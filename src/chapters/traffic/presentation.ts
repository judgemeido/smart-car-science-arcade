import { scenarios, orderOptions, type Scenario } from './data';
import type { TrafficState } from './rules';
import { setText, setTextAll } from '../../shared/dom';

export interface TrafficFeedback {
  choiceId: string;
  correct: boolean;
}

/** Render a rule transition; animation frames do not rebuild the controls. */
export function renderTrafficUI(
  host: HTMLElement,
  state: TrafficState,
  scenario: Scenario,
  feedback: TrafficFeedback | null,
) {
  const overlay = host.querySelector<HTMLElement>('[data-traffic-overlay]');
  const optionHost = host.querySelector<HTMLElement>('[data-traffic-options]');
  const startButton = host.querySelector<HTMLButtonElement>('[data-traffic-start]');
  const nextButton = host.querySelector<HTMLButtonElement>('[data-traffic-next]');
  const feedbackElement = host.querySelector<HTMLElement>('[data-traffic-feedback]');
  const showOverlay = (visible: boolean) => {
    if (!overlay) return;
    overlay.hidden = !visible;
    overlay.classList.toggle('is-visible', visible);
    overlay.setAttribute('aria-hidden', String(!visible));
  };
  switch (state.phase) {
    case 'ready':
      optionHost?.replaceChildren();
      setText(host, '[data-traffic-title]', '准备好了吗？');
      setText(host, '[data-traffic-copy]', '跟着曜境 S9 上路，认识红绿灯、人行横道和道路标志。');
      setText(host, '[data-traffic-feedback]', '');
      setText(host, '[data-traffic-state]', '准备出发 · 观察道路，遇到情境时点选答案');
      setText(host, '[data-traffic-score]', '0 分');
      if (startButton) {
        startButton.hidden = false;
        startButton.textContent = '开始上路';
      }
      if (nextButton) nextButton.hidden = true;
      showOverlay(true);
      overlay?.classList.add('is-ready');
      overlay?.classList.remove('is-question', 'is-complete');
      break;
    case 'driving':
      if (startButton) startButton.hidden = true;
      if (nextButton) nextButton.hidden = true;
      showOverlay(false);
      if (state.scenarioIndex === 0) {
        setText(host, '[data-traffic-score]', '0 分');
        overlay?.classList.remove('is-ready', 'is-question', 'is-complete');
      }
      setTextAll(host, '[data-traffic-progress]', `${state.scenarioIndex} / ${scenarios.length}`);
      setText(
        host,
        '[data-traffic-state]',
        state.scenarioIndex === 0 ? '车辆正在自动行驶 · 留意前方交通信号' : '车辆继续自动行驶 · 留意前方道路',
      );
      break;
    case 'question':
      setText(
        host,
        '[data-traffic-state]',
        `情境 ${String(state.scenarioIndex + 1).padStart(2, '0')} / ${scenarios.length} · ${scenario.tag}`,
      );
      setText(host, '[data-traffic-title]', scenario.title);
      setText(host, '[data-traffic-copy]', scenario.copy);
      setTextAll(host, '[data-traffic-progress]', `${state.scenarioIndex + 1} / ${scenarios.length}`);
      setText(host, '[data-traffic-feedback]', '请选择一个做法');
      feedbackElement?.classList.remove('is-correct', 'is-wrong');
      showOverlay(true);
      overlay?.classList.remove('is-ready', 'is-complete');
      overlay?.classList.add('is-question');
      if (startButton) startButton.hidden = true;
      if (nextButton) nextButton.hidden = true;
      optionHost?.replaceChildren();
      orderOptions(scenario, state.scenarioIndex).forEach((option, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'traffic-choice';
        button.dataset.correct = String(option.correct);
        button.dataset.choiceId = option.choiceId;
        button.innerHTML = `<span class="traffic-choice__index">${String.fromCharCode(65 + index)}</span><strong></strong><span class="traffic-choice__arrow" aria-hidden="true">↗</span>`;
        button.querySelector('strong')!.textContent = option.label;
        optionHost?.append(button);
      });
      break;
    case 'crossing':
    case 'feedback': {
      if (!feedback) break;
      optionHost?.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
        const choice = scenario.options.find((option) => option.choiceId === button.dataset.choiceId);
        button.disabled = true;
        if (choice?.correct) button.classList.add('is-correct');
        if (choice?.choiceId === feedback.choiceId)
          button.classList.add(feedback.correct ? 'is-selected-correct' : 'is-selected-wrong');
      });
      feedbackElement?.classList.toggle('is-correct', feedback.correct);
      feedbackElement?.classList.toggle('is-wrong', !feedback.correct);
      setText(host, '[data-traffic-score]', `${state.score} 分`);
      setText(
        host,
        '[data-traffic-feedback]',
        `${feedback.correct ? '答对了！' : '再记住这个安全做法。'} ${scenario.feedback}`,
      );
      const pedestrianAnswer = feedback.correct && ['pedestrians', 'green-pedestrians'].includes(scenario.id);
      if (pedestrianAnswer) {
        setText(
          host,
          '[data-traffic-state]',
          state.phase === 'crossing' ? '已停车礼让 · 行人正在通过斑马线' : '行人已安全通过 · 车辆继续行驶',
        );
        if (nextButton) nextButton.hidden = true;
        showOverlay(false);
      } else if (nextButton) nextButton.hidden = false;
      break;
    }
    case 'complete':
      setText(host, '[data-traffic-state]', '本次道路观察完成');
      setText(host, '[data-traffic-title]', `安全小队得分：${state.score} / ${scenarios.length}`);
      setText(host, '[data-traffic-copy]', '你已经认识了信号灯、人行横道和限速标志。安全出行，记得多观察。');
      setText(host, '[data-traffic-feedback]', '');
      optionHost?.replaceChildren();
      if (nextButton) nextButton.hidden = true;
      showOverlay(true);
      overlay?.classList.remove('is-question', 'is-ready');
      overlay?.classList.add('is-complete');
      if (startButton) {
        startButton.hidden = false;
        startButton.textContent = '再走一次';
      }
      break;
  }
}

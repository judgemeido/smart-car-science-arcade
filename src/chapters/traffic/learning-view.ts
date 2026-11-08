import type { Scenario } from './data';
import { orderOptions } from './data';
import type { TrafficPracticeScenario, TrafficReviewAnnotation } from './learning-data';
import type { TrafficPracticeState } from './practice-state';

function textElement<K extends keyof HTMLElementTagNameMap>(tag: K, copy: string, className = '') {
  const element = document.createElement(tag);
  element.textContent = copy;
  element.className = className;
  return element;
}
function lines(copy: readonly string[]) {
  const list = document.createElement('ul');
  copy.forEach((line) => list.append(textElement('li', line)));
  return list;
}
function button(copy: string, attribute: string, value = '') {
  const element = textElement('button', copy, 'traffic-secondary');
  element.type = 'button';
  element.setAttribute(attribute, value);
  return element;
}
function heading(host: HTMLElement, title: string) {
  const element = textElement('h3', title);
  element.tabIndex = -1;
  element.dataset.trafficLearningHeading = '';
  host.append(element);
}
function close(host: HTMLElement) {
  host.append(button('返回原道路体验', 'data-traffic-learning-close'));
}

export function renderTrafficReview(
  host: HTMLElement,
  scenarios: readonly Scenario[],
  annotations: readonly TrafficReviewAnnotation[],
): void {
  host.replaceChildren();
  host.dataset.mode = 'review';
  delete host.dataset.phase;
  delete host.dataset.scenarioId;
  heading(host, '道路观察 · 全题复习');
  host.append(textElement('p', '回看全部八题的观察线索和选择解释，和同伴说说理由。'));
  close(host);
  scenarios.forEach((scenario, index) => {
    const annotation = annotations.find((item) => item.sourceScenarioId === scenario.id);
    if (!annotation) return;
    const card = document.createElement('details');
    card.dataset.trafficReviewCard = scenario.id;
    card.open = index === 0;
    card.append(textElement('summary', `${String(index + 1).padStart(2, '0')} · ${scenario.title}`));
    card.append(textElement('p', `观察线索：${annotation.observationClue}`));
    for (const option of orderOptions(scenario, index)) {
      const explanation = annotation.choiceFeedback.find((item) => item.sourceChoiceId === option.choiceId);
      const choice = document.createElement('div');
      choice.dataset.trafficReviewChoice = option.choiceId;
      choice.append(textElement('strong', `${option.correct ? '安全做法：' : '再想一想：'}${option.label}`));
      choice.append(textElement('p', explanation?.copy ?? ''));
      card.append(choice);
    }
    card.append(lines(annotation.knowledgeSummary));
    card.append(textElement('p', `和同伴说说：${annotation.reflection.prompt}`));
    const answer = document.createElement('details');
    answer.append(textElement('summary', '读一个参考理由'));
    answer.append(textElement('p', annotation.reflection.suggestedAnswer));
    card.append(answer);
    host.append(card);
  });
}

export function renderTrafficPractice(
  host: HTMLElement,
  state: TrafficPracticeState,
  scenarios: readonly TrafficPracticeScenario[],
): void {
  host.replaceChildren();
  host.dataset.mode = 'practice';
  host.dataset.phase = state.phase;
  const scenario = scenarios[state.scenarioIndex];
  host.dataset.scenarioId = scenario?.id ?? '';
  const progress = textElement(
    'p',
    `已掌握 ${state.masteredScenarioIds.length} / ${scenarios.length}`,
    'traffic-learning__progress',
  );
  progress.dataset.trafficPracticeProgress = '';
  host.append(progress);
  const phaseCopy = {
    ready: '准备',
    observe: '① 观察',
    decide: '② 决策',
    feedback: '③ 读反馈',
    summarize: '④ 总结',
    complete: '进阶完成',
  };
  const phase = textElement('p', phaseCopy[state.phase], 'traffic-learning__phase');
  phase.dataset.trafficPracticePhase = '';
  host.append(phase);
  heading(
    host,
    state.phase === 'ready'
      ? '安全决策：先观察，再行动'
      : state.phase === 'complete'
        ? '我能解释安全决策了'
        : (scenario?.title ?? '道路观察'),
  );
  if (state.phase === 'ready') {
    host.append(
      textElement(
        'p',
        '你是道路安全观察员。帮助测试车看清线索、选择行动，再说说为什么更安全。共五题，每题读完反馈和总结后再继续。',
      ),
    );
    host.append(button('开始五题挑战', 'data-traffic-practice-start'));
  } else if (state.phase === 'complete') {
    host.append(textElement('p', '我能解释：安全决策需要观察规则，也需要观察真实道路和信息是否可靠。'));
    host.append(textElement('p', `五题全部掌握。原道路体验的安全分保持不变。`));
  } else if (scenario) {
    host.append(textElement('p', '本题给定条件'), lines(scenario.sceneAssumptions));
    host.append(textElement('p', `观察线索：${scenario.observation}`));
    const sceneCopy = {
      'green-clear': '画面：绿灯与斑马线；本题已确认前方空间没有冲突。',
      'sudden-person': '画面：行人进入前方路径，黄色区域表示本题给定的停车空间。未确认旁边能否绕行。',
      obstacle: '画面：本车道有障碍；邻道黄色条纹表示安全未知，不能当成通行路线。',
      'heavy-rain': '画面：雨、湿滑路面和模糊的前方。安全停靠地点需要另行确认。',
      'sensor-uncertain':
        '系统提示：前方感知信息不可靠。灰色区域表示未知；未检测到不等于没有目标。感知是用设备收集周围信息。',
    };
    host.append(textElement('p', sceneCopy[scenario.sceneKind], 'traffic-learning__scene-note'));
    if (state.phase === 'observe')
      host.append(button('我已观察，进入决策', 'data-traffic-practice-observed'));
    if (state.phase === 'decide') {
      host.append(textElement('p', scenario.question.prompt));
      const choices = document.createElement('div');
      choices.className = 'traffic-learning__choices';
      scenario.question.choices.forEach((choice) =>
        choices.append(button(choice.label, 'data-traffic-practice-choice', choice.id)),
      );
      host.append(choices);
    }
    if (state.phase === 'feedback') {
      const choice = scenario.question.choices.find((item) => item.id === state.choiceId);
      host.append(textElement('p', `你的选择：${choice?.label ?? ''}`));
      const feedback = textElement(
        'p',
        `${state.verdict === 'correct' ? '这个行动更安全。' : '再看看风险。'} ${state.verdict === 'correct' ? scenario.question.correctFeedback : scenario.question.retryFeedback}`,
        'traffic-learning__feedback',
      );
      feedback.dataset.trafficPracticeFeedback = '';
      host.append(feedback);
      host.append(
        textElement(
          'p',
          state.verdict === 'correct'
            ? '绿色短线表示谨慎通过或减速停车的行动示意。'
            : '红色区域表示可能出现冲突的前方。先重新判断，车辆保持等待。',
        ),
      );
      if (state.verdict === 'incorrect') host.append(button('再判断一次', 'data-traffic-practice-retry'));
    }
    if (state.phase === 'summarize')
      host.append(
        lines(scenario.summary),
        textElement('p', '和同伴说说：我观察到了什么？为什么这个行动更安全？'),
      );
    if (state.phase === 'summarize' || (state.phase === 'feedback' && state.verdict === 'correct')) {
      const next = button(
        state.phase === 'feedback'
          ? '读完反馈，进入总结'
          : state.scenarioIndex === scenarios.length - 1
            ? '我能说明理由，完成挑战'
            : '我能说明理由，下一题',
        'data-traffic-practice-continue',
      );
      next.dataset.fromPhase = state.phase;
      next.dataset.scenarioId = scenario.id;
      host.append(next);
    }
  }
  host.append(
    textElement(
      'p',
      '场景和行动是学习示意，不表示某车型的真实制动距离或设备识别率。',
      'traffic-learning__scene-note',
    ),
  );
  if (state.phase !== 'ready') host.append(button('重新开始五题挑战', 'data-traffic-practice-reset'));
  close(host);
}

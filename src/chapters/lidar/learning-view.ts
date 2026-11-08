import type { LidarLearningContent } from './learning-data';
import type { LidarLearningState } from './learning-state';
import type { WeatherLearningState } from './weather-state';
import { roundTripNanoseconds } from './measurement';

export type LidarLearningTab = 'guide' | 'world' | 'distance' | 'weather';
const text = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!,
  );
const button = (attribute: string, id: string, label: string, selected = false, disabled = false) =>
  `<button type="button" ${attribute}="${text(id)}" aria-pressed="${selected}" ${disabled ? 'disabled' : ''}>${text(label)}</button>`;

export function renderLidarLearningGuide(host: HTMLElement, content: LidarLearningContent): void {
  host.innerHTML = `
    <div class="lidar-learning__heading"><h3>传感器实验室</h3><button type="button" data-lidar-learning-close>收起学习区</button></div>
    <p>${text(content.intro)}</p>
    <p class="lidar-learning__note">本章记录暂存在本次页面中；普通切章保留，刷新或退出页面后重新开始。</p>
    <div class="lidar-learning__tabs" role="group" aria-label="选择感知实验">
      ${button('data-lidar-learning-tab', 'guide', '光的旅程', true)}
      ${button('data-lidar-learning-tab', 'world', '四目标点云')}
      ${button('data-lidar-learning-tab', 'distance', '距离挑战')}
      ${button('data-lidar-learning-tab', 'weather', '天气与局限')}
    </div>
    <section data-lidar-guide-activity>
      <details data-lidar-learning-guide><summary>打开实验引导：光怎样往返？</summary>
        <ol>${content.guide.instructions.map((instruction) => `<li>${text(instruction)}</li>`).join('')}</ol>
        <dl>${content.guide.vocabulary.map((item) => `<dt>${text(item.term)}</dt><dd>${text(item.explanation)}</dd>`).join('')}</dl>
        <p>${text(content.guide.observationPrompt)}</p>
        <details><summary>观察后读一读解释</summary><p>${text(content.guide.suggestedAnswer)}</p></details>
      </details>
      <p>用原实验的距离滑块试一试：先看20米，再看60米。纳秒（ns）是一秒的十亿分之一，这里只需比较变化。</p>
    </section>
    <section data-lidar-world-activity hidden>
      <h4>汽车、行人、树和路障</h4><p>点选标签或画面中的目标，看看轮廓与点云怎样对应。</p>
      <div class="lidar-learning__choices" data-lidar-world-target-list>
        ${[
          ['world-car', '汽车'],
          ['world-person', '行人'],
          ['world-tree', '树'],
          ['world-obstacle', '路障'],
        ]
          .map(([id, label]) => button('data-lidar-world-target', id, label))
          .join('')}
      </div><p data-lidar-world-selection aria-live="polite">选择一种目标观察。</p>
    </section>
    <section data-lidar-distance-activity hidden></section>
    <section data-lidar-weather-activity hidden></section>
    <div data-lidar-world-controls hidden><button type="button" data-lidar-learning-scan aria-pressed="true">暂停点云扫描</button><p class="lidar-learning__note">教学示意：点云来自这些模型的几何轮廓，并非真实扫描或自动识别。拖动旋转、双指或滚轮缩放；目标参考标记用于比较直线距离，画面缩放不改变答案。</p></div>
    <details class="lidar-learning__sensors"><summary>传感器知识卡 · 6种设备</summary>
      <div class="lidar-learning__choices" role="group" aria-label="选择传感器知识卡">${content.sensorCards.map((card) => button('data-lidar-sensor', card.id, card.name)).join('')}</div>
      <article data-lidar-sensor-card aria-live="polite"><p>选择一张卡，认识它的作用与局限。</p></article>
    </details>
    <details><summary>传感器实验记录</summary><div data-lidar-learning-record></div></details>
  `;
}

export function updateLidarLearningView(
  host: HTMLElement,
  content: LidarLearningContent,
  state: LidarLearningState,
  weather: WeatherLearningState,
  tab: LidarLearningTab,
  scanRunning: boolean,
  selectedWorldId: string | null,
): void {
  const active =
    document.activeElement instanceof HTMLElement && host.contains(document.activeElement)
      ? document.activeElement
      : null;
  const focusKey = active
    ? [...active.attributes].find((attribute) => attribute.name.startsWith('data-lidar-'))
    : null;
  host
    .querySelectorAll<HTMLElement>('[data-lidar-learning-tab]')
    .forEach((item) => item.setAttribute('aria-pressed', String(item.dataset.lidarLearningTab === tab)));
  for (const name of ['guide', 'world', 'distance', 'weather'])
    host.querySelector<HTMLElement>(`[data-lidar-${name}-activity]`)!.hidden = name !== tab;
  host.querySelector<HTMLElement>('[data-lidar-world-controls]')!.hidden = tab === 'guide';
  const scan = host.querySelector<HTMLElement>('[data-lidar-learning-scan]')!;
  scan.setAttribute('aria-pressed', String(scanRunning));
  scan.textContent = scanRunning ? '暂停点云扫描' : '继续点云扫描';
  host
    .querySelectorAll<HTMLElement>('[data-lidar-world-target]')
    .forEach((item) =>
      item.setAttribute('aria-pressed', String(item.dataset.lidarWorldTarget === selectedWorldId)),
    );
  const selectedWorld = host.querySelector<HTMLElement>(`[data-lidar-world-target="${selectedWorldId}"]`);
  host.querySelector<HTMLElement>('[data-lidar-world-selection]')!.textContent = selectedWorld
    ? `正在观察${selectedWorld.textContent}的教学轮廓与点云。`
    : '选择一种目标观察。';

  const distanceHost = host.querySelector<HTMLElement>('[data-lidar-distance-activity]')!;
  const round = content.distance.rounds[state.roundIndex];
  const correct = state.submission?.verdict === 'correct';
  distanceHost.innerHTML = state.completed
    ? '<h4>三轮已完成</h4><p>你用测量验证了远近判断。可以到天气实验继续思考：看不清时怎么办？</p><button type="button" data-lidar-learning-tab="weather">继续天气实验</button><button type="button" data-lidar-distance-reset>重置距离与设备记录</button>'
    : `<h4>${text(content.distance.title)}</h4><p>第 ${state.roundIndex + 1} / ${content.distance.rounds.length} 轮</p><p>${text(content.distance.prompt)}</p>
      <p>传感器在金色参考点；三个目标按固定方向放置。用目标底部标记比较距离。</p>
      <fieldset><legend>谁离传感器最近？</legend><div class="lidar-learning__choices">${round.targets.map((target) => button('data-lidar-target', target.id, target.label, target.id === state.selectedTargetId, correct)).join('')}</div></fieldset>
      <fieldset><legend>最近目标在哪个距离区间？</legend><div class="lidar-learning__choices">${content.distance.ranges.map((range) => button('data-lidar-range-choice', range.id, range.label, range.id === state.selectedRangeId, correct)).join('')}</div></fieldset>
      <button type="button" data-lidar-learning-submit ${!state.selectedTargetId || !state.selectedRangeId || state.submission ? 'disabled' : ''}>提交判断，揭示测量</button>
      <div data-lidar-distance-result role="status" tabindex="-1">${state.submission ? `<p>${text(correct ? content.distance.correctFeedback : content.distance.retryFeedback)}</p><ul>${state.submission.measurements.map((entry) => `<li>${text(entry.label)}：${entry.distanceMeters.toFixed(1)} 米</li>`).join('')}</ul><p>这是传感器参考点到目标底部参考标记的直线距离。</p><button type="button" data-lidar-learning-continue ${correct ? '' : 'disabled'}>${state.roundIndex === content.distance.rounds.length - 1 ? '读完了，完成距离实验' : '读完了，下一轮'}</button>` : '<p>先选择目标和区间；提交后才显示测量值。</p>'}</div>
      <button type="button" data-lidar-distance-reset>重置距离与设备记录</button>`;
  const question = content.weather.questions[weather.questionIndex];
  const environment = content.weather.environments.find((item) => item.id === `weather-${weather.weather}`)!;
  const weatherHost = host.querySelector<HTMLElement>('[data-lidar-weather-activity]')!;
  weatherHost.innerHTML = `<h4>${text(content.weather.title)}</h4>
    <div class="lidar-learning__choices" role="group" aria-label="选择天气">${content.weather.environments.map((item) => button('data-lidar-weather', item.id.replace('weather-', ''), item.label, item.id === `weather-${weather.weather}`)).join('')}</div>
    <p data-lidar-weather-copy>${text(environment.copy)}</p><p class="lidar-learning__note">同一组目标、同一位置。雨的额外散点、雾中远处轮廓的变化是定性教学示意，不能当作设备实际测量结果。</p>
    ${
      weather.completed
        ? `<p>${text(content.completion)}</p><p>${text(content.bridge)}</p>`
        : `<p>思考 ${weather.questionIndex + 1} / ${content.weather.questions.length}</p><fieldset><legend>${text(question.prompt)}</legend><div class="lidar-learning__choices">${question.choices.map((choice) => button('data-lidar-weather-choice', choice.id, choice.label, choice.id === weather.result?.choiceId, weather.result?.verdict === 'correct')).join('')}</div></fieldset>
      <div data-lidar-weather-feedback role="status" tabindex="-1">${weather.result ? `<p>${text(weather.result.verdict === 'correct' ? question.correctFeedback : question.retryFeedback)}</p><button type="button" data-lidar-weather-continue ${weather.result.verdict === 'correct' ? '' : 'disabled'}>${weather.questionIndex === content.weather.questions.length - 1 ? '读完了，完成天气实验' : '读完了，继续思考'}</button>` : '<p>选择一个答案，读完解释后再继续。</p>'}</div>`
    }
    <button type="button" data-lidar-weather-reset>重做天气思考</button>`;

  const card = content.sensorCards.find((item) => item.id === state.selectedSensorId);
  host
    .querySelectorAll<HTMLElement>('[data-lidar-sensor]')
    .forEach((item) =>
      item.setAttribute('aria-pressed', String(item.dataset.lidarSensor === state.selectedSensorId)),
    );
  host.querySelector<HTMLElement>('[data-lidar-sensor-card]')!.innerHTML = card
    ? `<h4>${text(card.name)}</h4><p>${text(card.analogy)}</p><p>作用：${text(card.helps)}</p><p>局限：${text(card.limits)}</p>`
    : '<p>选择一张卡，认识它的作用与局限。</p>';
  const attempts = state.attempts.map((attempt) => {
    const roundIndex = content.distance.rounds.findIndex((item) => item.id === attempt.roundId);
    const target = attempt.measurements.find((item) => item.id === attempt.targetId)!;
    const range = content.distance.ranges.find((item) => item.id === attempt.rangeId)!;
    return `<li>第${roundIndex + 1}轮：选择${text(target.label)}，${text(range.label)}；${attempt.verdict === 'correct' ? '正确' : '需纠正'}。测量：${attempt.measurements.map((item) => `${text(item.label)} ${item.distanceMeters.toFixed(1)}米`).join('、')}。</li>`;
  });
  const answers = weather.answers.map((answer) => {
    const item = content.weather.questions.find((question) => question.id === answer.questionId)!;
    const choice = item.choices.find((choice) => choice.id === answer.choiceId)!;
    return `<li>${text(item.prompt)}<br />我的选择：${text(choice.label)}（${answer.verdict === 'correct' ? '正确' : '需纠正'}）。<br />题目解释：${text(answer.verdict === 'correct' ? item.correctFeedback : item.retryFeedback)}</li>`;
  });
  host.querySelector<HTMLElement>('[data-lidar-learning-record]')!.innerHTML = `<h4>传感器实验记录</h4>
    <p>原理对照：20米约${roundTripNanoseconds(20).toFixed(1)} ns；60米约${roundTripNanoseconds(60).toFixed(1)} ns。距离更远，光的往返时间更长。</p>
    <p>距离挑战已掌握 ${state.masteredRoundIds.length} / ${content.distance.rounds.length}</p>${attempts.length ? `<ol>${attempts.join('')}</ol>` : '<p>你还没有提交距离判断。</p>'}
    <p>天气思考已掌握 ${weather.masteredQuestionIds.length} / ${content.weather.questions.length}</p>${answers.length ? `<ol>${answers.join('')}</ol>` : '<p>你还没有回答天气题。切换天气只是在观察。</p>'}
    <p>${card ? `我选择的设备：${text(card.name)}。作用：${text(card.helps)} 局限：${text(card.limits)}` : '你还没有选择设备知识卡。'}</p>
    ${state.completed && weather.completed ? `<p>${text(content.completion)}</p>` : ''}`;
  if (focusKey) {
    const restored = [...host.querySelectorAll<HTMLElement>(`[${focusKey.name}]`)].find(
      (item) => item.getAttribute(focusKey.name) === focusKey.value,
    );
    if (restored && !restored.hasAttribute('disabled')) restored.focus({ preventScroll: true });
    else {
      const next =
        focusKey.name === 'data-lidar-learning-submit'
          ? host.querySelector<HTMLElement>('[data-lidar-distance-result]')
          : focusKey.name === 'data-lidar-learning-continue'
            ? (host.querySelector<HTMLElement>('[data-lidar-target]') ??
              host.querySelector<HTMLElement>('[data-lidar-learning-tab="weather"]'))
            : focusKey.name === 'data-lidar-weather-choice'
              ? host.querySelector<HTMLElement>('[data-lidar-weather-feedback]')
              : focusKey.name === 'data-lidar-weather-continue'
                ? host.querySelector<HTMLElement>('[data-lidar-weather-choice]')
                : null;
      next?.focus({ preventScroll: true });
    }
  }
}

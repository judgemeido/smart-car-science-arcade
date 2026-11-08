import { evaluateChoice, type ChoiceQuestion } from '../../shared/learning-assessment';
import { exploreLearningGroups, exploreLearningTasks, exploreReviewQuestions } from './learning-data';
import { exploreLearningTargets, hasRequiredTargets } from './learning-targets';
import type { ExploreLearningState } from './learning-state';
import { teachingAssemblyGroups, type AssemblyReturnState } from './assembly-state';

function element<K extends keyof HTMLElementTagNameMap>(tag: K, copy?: string, className?: string) {
  const node = document.createElement(tag);
  if (copy !== undefined) node.textContent = copy;
  if (className) node.className = className;
  return node;
}
function button(copy: string, attribute: string, value = '') {
  const node = element('button', copy);
  node.type = 'button';
  node.setAttribute(attribute, value);
  return node;
}
function questionCard(question: ChoiceQuestion, answer: string | undefined, review = false) {
  const card = element('fieldset', undefined, 'explore-question');
  card.append(element('legend', question.prompt));
  const choices = element('div', undefined, 'explore-learning-choices');
  for (const choice of question.choices) {
    const option = button(choice.label, review ? 'data-review-answer' : 'data-learning-answer', choice.id);
    if (review) option.dataset.reviewQuestion = question.id;
    option.setAttribute('aria-pressed', String(answer === choice.id));
    choices.append(option);
  }
  const feedback = element('p', undefined, 'explore-learning-feedback');
  feedback.setAttribute(
    review ? 'data-review-feedback' : 'data-learning-feedback',
    review ? question.id : '',
  );
  feedback.setAttribute('role', 'status');
  const verdict = evaluateChoice(question, answer ?? '');
  feedback.textContent =
    verdict === 'correct'
      ? question.correctFeedback
      : verdict === 'incorrect'
        ? question.retryFeedback
        : '选择一个答案，读完解释后再继续。';
  card.append(choices, feedback);
  return card;
}

export function renderExploreReview(host: HTMLElement, answers: Readonly<Record<string, string>>): void {
  const panel = host.querySelector<HTMLElement>('[data-explore-review]');
  if (!panel) return;
  panel.replaceChildren(
    element('h3', '三组系统功能复习'),
    element('p', '回想刚才找到的部件。每题都可以修改答案，复习不会改变拆解进度。'),
  );
  for (const question of exploreReviewQuestions)
    panel.append(questionCard(question, answers[question.id], true));
  panel.append(button('关闭复习，继续观察', 'data-explore-review-close'));
}

// Location descriptions are a keyboard/touch diagram, not GLB configuration claims.
const diagramLocations: Readonly<Record<string, string>> = {
  BatteryPack: '▰ 车底中央的能量盒',
  FrontEaxle_Motor: '↻ 前轴内的转动装置',
  RearEaxle_Motor: '↻ 后轴内的转动装置',
  Wheel_FL: '◉ 左前方接触路面的圆形部分',
  Wheel_FR: '◉ 右前方接触路面的圆形部分',
  Wheel_RL: '◉ 左后方接触路面的圆形部分',
  Wheel_RR: '◉ 右后方接触路面的圆形部分',
  FrontEaxle_ReductionDifferential: '⚙ 前轴内连接转动与车轮的齿轮结构',
  RearEaxle_ReductionDifferential: '⚙ 后轴内连接转动与车轮的齿轮结构',
  BodyStructure: '⌂ 车身内的支撑框架',
  FrontSuspension: '〰 前轮与车身之间的弹性连接',
  RearSuspension: '〰 后轮与车身之间的弹性连接',
  Brakes: '⊙ 车轮附近帮助减速的机构',
  Front_camera_optic: '◎ 朝向车前方的图像窗口',
  Left_camera_optic: '◎ 朝向左侧的图像窗口',
  Right_camera_optic: '◎ 朝向右侧的图像窗口',
  Rear_camera_optic: '◎ 朝向车尾的图像窗口',
  Roof_lidar_housing: '◇ 车顶发出激光的测距装置',
  Lidar_optical_window: '◇ 车顶装置上的光学窗口',
  'Ultrasonic_F_-1_0.23': '• 前保险杠左侧靠内的小探头',
  'Ultrasonic_F_-1_0.64': '• 前保险杠左侧靠外的小探头',
  'Ultrasonic_F_1_0.23': '• 前保险杠右侧靠内的小探头',
  'Ultrasonic_F_1_0.64': '• 前保险杠右侧靠外的小探头',
};

export function renderExploreLearning(host: HTMLElement, state: ExploreLearningState): void {
  const panel = host.querySelector<HTMLElement>('[data-explore-learning]');
  if (!panel) return;
  const progress = element('b', `${state.completedTaskIds.length} / ${exploreLearningTasks.length}`);
  progress.dataset.learningProgress = '';
  const header = element('div', undefined, 'explore-learning-header');
  header.append(element('h3', '汽车结构挑战'), progress);
  const mode = element('p', '可点击真实模型，或用下面的部件示意完成图文学习。', 'explore-learning-mode');
  mode.dataset.learningMode = '';
  panel.replaceChildren(header, mode);
  const task = exploreLearningTasks[state.taskIndex];
  if (task) {
    const target = exploreLearningTargets[task.targetKey];
    const found = state.found[task.id] ?? [];
    const ready = hasRequiredTargets(target, found);
    const group = exploreLearningGroups.find((item) => item.taskIds.some((id) => id === task.id));
    panel.append(
      element('p', group?.title ?? '', 'explore-learning-group'),
      element('h4', `任务 ${state.taskIndex + 1}：根据提示找部件`),
      element('p', task.hint),
    );
    const frameNote = element('p', '有些部件拆开后会移到视野外。调整视角只帮助观察，仍需你点击部件确认。');
    frameNote.dataset.learningFrameNote = '';
    panel.append(button('调整视角，观察提示区域', 'data-learning-frame'), frameNote);
    const notice = element(
      'p',
      ready
        ? `已找到：${task.title.replace(/^找到/, '')}。现在解释它的功能。`
        : `已找到 ${found.length} 处；先根据提示选择部件。`,
      'explore-learning-found',
    );
    notice.dataset.learningFound = '';
    notice.setAttribute('role', 'status');
    panel.append(notice);
    const diagram = element('details', undefined, 'explore-learning-diagram');
    diagram.open = true;
    diagram.append(
      element('summary', '部件位置示意 · 鼠标、触屏和键盘均可选择'),
      element(
        'p',
        '这是一张简化的位置示意。选择示意位置会在报告中标明“图文学习”。可用 Tab 找到按钮，再按 Enter 或空格选择。',
      ),
    );
    const silhouette = element('div', '车前 ←  ◉ ━━ 车身 ━━ ◉  → 车尾', 'explore-learning-silhouette');
    silhouette.setAttribute('aria-hidden', 'true');
    diagram.append(silhouette);
    const hotspots = element('div', undefined, 'explore-learning-hotspots');
    for (const [name, label] of Object.entries(diagramLocations)) {
      const option = button(label, 'data-learning-diagram', name);
      option.setAttribute('aria-pressed', String(found.includes(name)));
      hotspots.append(option);
    }
    const teaching = button(
      '教学示意 · 利用无线电波探测的设备',
      'data-learning-diagram',
      'teaching-millimeter-radar',
    );
    teaching.setAttribute('aria-pressed', String(found.includes('teaching-millimeter-radar')));
    hotspots.append(teaching);
    diagram.append(
      hotspots,
      element('p', '毫米波雷达的卡片是教学示意，位置不代表这辆模型车的实际配置。毫米波是一种无线电波。'),
    );
    panel.append(diagram);
    if (ready) panel.append(questionCard(task.question, state.answers[task.id]));
    const next = button('读完解释，继续下一项', 'data-learning-continue');
    next.disabled = !ready || evaluateChoice(task.question, state.answers[task.id] ?? '') !== 'correct';
    panel.append(next);
  } else
    panel.append(
      element(
        'p',
        '你完成了 13 项探索！汽车的运动和安全，需要许多不同部件配合。下一站可以用激光雷达做测距实验。',
      ),
    );
  const report = element('section', undefined, 'explore-learning-report');
  report.dataset.learningReport = '';
  report.append(element('h4', '汽车结构探索报告'), element('p', '我找到的部件 · 我能说明的功能'));
  const list = element('ul');
  for (const id of state.completedTaskIds) {
    const completed = exploreLearningTasks.find((item) => item.id === id);
    if (!completed) continue;
    const choice = completed.question.choices.find((item) => item.id === state.answers[id]);
    list.append(
      element(
        'li',
        `${completed.title.replace(/^找到/, '')} · ${state.methods[id] === 'model' ? '模型探索' : '图文学习'}：${choice?.label ?? ''}`,
      ),
    );
  }
  report.append(list);
  if (state.completedTaskIds.length === 0)
    report.append(element('p', '完成一项后，它和你理解的功能会出现在这里。'));
  const label = element('label', '还想研究的一个问题（可选）');
  const research = element('textarea');
  research.dataset.learningResearch = '';
  research.maxLength = 240;
  research.rows = 2;
  label.append(research);
  report.append(label);
  panel.append(
    report,
    button('退出挑战，继续自由观察', 'data-learning-cancel'),
    button('重置结构挑战', 'data-learning-reset'),
  );
}

export function renderExploreAssembly(host: HTMLElement, state: AssemblyReturnState): void {
  const panel = host.querySelector<HTMLElement>('[data-explore-assembly]');
  if (!panel) return;
  const count = element('b', `${state.returnedGroups.length} / 4`);
  count.dataset.assemblyCount = '';
  const header = element('div', undefined, 'explore-learning-header');
  header.append(element('h3', '把结构放回去'), count);
  const summary = element(
    'p',
    state.status === 'complete' ? '四组已完成，车保持组装状态。' : '按这条教学顺序，让模型逐组回到位置。',
  );
  summary.dataset.assemblySummary = '';
  panel.replaceChildren(header, summary, element('p', '这是认识系统关系的归位演示，不是工厂真实装配流程。'));
  const list = element('ol');
  for (const group of teachingAssemblyGroups)
    list.append(
      element(
        'li',
        `${group.label} · ${state.returnedGroups.includes(group.id) ? '已归位' : state.currentGroup === group.id ? '正在归位' : '等待'}`,
      ),
    );
  const meter = element('progress');
  meter.max = 1;
  meter.value = state.progress;
  meter.setAttribute('aria-label', '当前组归位进度');
  meter.dataset.assemblyProgress = '';
  const nextGroup = teachingAssemblyGroups[state.returnedGroups.length];
  const next = button(nextGroup ? `归位：${nextGroup.label}` : '全部归位', 'data-assembly-next');
  next.disabled = !!state.currentGroup || state.status !== 'ready';
  panel.append(
    list,
    meter,
    next,
    button(state.status === 'complete' ? '返回自由观察' : '取消归位，恢复进入前状态', 'data-assembly-cancel'),
  );
}

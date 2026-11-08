import { assemblyInfo, disassemblyTasks, humanizeNodeName } from './data';
import type { MissionState, MissionVerdict } from './mission-state';

export function renderDisassemblyPanel(
  host: HTMLElement,
  state: MissionState,
  feedback?: { verdict: MissionVerdict; assemblyName: string },
) {
  const { index: disassemblyIndex, active: disassemblyActive } = state;
  const panel = host.querySelector<HTMLElement>('[data-disassembly-panel]');
  const progress = host.querySelector<HTMLElement>('[data-disassembly-progress]');
  const title = host.querySelector<HTMLElement>('[data-disassembly-title]');
  const copy = host.querySelector<HTMLElement>('[data-disassembly-task]');
  const target = host.querySelector<HTMLElement>('[data-disassembly-target]');
  const startLabel = host.querySelector<HTMLElement>('[data-disassembly-start-label]');
  const steps = Array.from(host.querySelectorAll<HTMLElement>('[data-disassembly-step]'));
  const complete = disassemblyIndex >= disassemblyTasks.length;
  if (progress)
    progress.textContent = complete
      ? `${disassemblyTasks.length} / ${disassemblyTasks.length}`
      : `${disassemblyIndex} / ${disassemblyTasks.length}`;
  if (title) title.textContent = complete ? '拆解任务完成' : disassemblyTasks[disassemblyIndex].title;
  if (copy)
    copy.textContent = complete
      ? '你已经找到三组核心系统。现在可以继续点击其他零件，查看完整的结构信息。'
      : disassemblyTasks[disassemblyIndex].copy;
  if (target) target.textContent = complete ? '全部完成' : disassemblyTasks[disassemblyIndex].label;
  if (startLabel)
    startLabel.textContent = complete ? '重新开始任务' : disassemblyActive ? '任务进行中' : '开始拆解任务';
  steps.forEach((step, index) => {
    step.classList.toggle('is-done', index < disassemblyIndex);
    step.classList.toggle('is-current', index === disassemblyIndex && !complete);
  });
  panel?.classList.toggle('is-complete', complete);
  if (copy && feedback?.verdict === 'incorrect') {
    const task = disassemblyTasks[disassemblyIndex];
    copy.textContent = `已查看“${assemblyInfo[feedback.assemblyName]?.label ?? humanizeNodeName(feedback.assemblyName)}”。再找找：${task.label}。`;
  }
}

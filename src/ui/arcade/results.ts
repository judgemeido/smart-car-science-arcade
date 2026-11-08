import type { ArcadeResult, Persistence } from '../../shared/arcade';

export const activityNames = { 'history-lab': '进化修复站', 'structure-lab': '系统维修台', 'sensor-lab': '回波侦探' };
export const statusNames = { completed: '全部完成', timeout: '时间到了', abandoned: '主动结束', interrupted: '挑战中断' };
export function persistenceCopy(persistence: Persistence) {
  return persistence === 'saved' ? '本机记录已保存' : persistence === 'read-only' ? '本机数据只读，本次记录未保存' : '本次记录未保存，暂留当前页面';
}
function line(host: HTMLElement, label: string, value: string) {
  const row = document.createElement('div'); row.className = 'arcade-result__line';
  const term = document.createElement('span'); term.textContent = label;
  const detail = document.createElement('strong'); detail.textContent = value;
  row.append(term, detail); host.append(row);
}
/** Render real stored/session facts; callers never pass invented ranking or totals. */
export function renderArcadeResult(host: HTMLElement, result: ArcadeResult, persistence: Persistence, labels: Readonly<Record<string, string>> = {}) {
  host.replaceChildren(); host.classList.add('arcade-result');
  const title = document.createElement('h2'); title.textContent = statusNames[result.status];
  const player = document.createElement('p'); player.textContent = `${result.config.nickname}的实验记录`;
  const total = document.createElement('p'); total.className = 'arcade-result__total';
  total.textContent = result.score ? `${result.score.total} 分` : result.config.mode === 'practice' ? '练习观察，不计分' : '本次中断，不计成绩';
  host.append(title, player, total);
  if (result.score) { line(host, '探索完成', `${result.score.progress} / 700`); line(host, '首次验证', `${result.score.quality} / 200`); line(host, '完成时间奖励', `${result.score.efficiency} / 100`); }
  line(host, '完成目标', `${result.objectives.filter(o => o.completed).length} / ${result.objectives.length}`);
  if (result.elapsedMs !== null) line(host, '本次用时', `${Math.floor(result.elapsedMs / 1000)} 秒`);
  const facts = document.createElement('ul'); facts.className = 'arcade-result__objectives';
  result.objectives.forEach(objective => { const item = document.createElement('li');
    item.textContent = `${objective.completed ? '✓' : '○'} ${labels[objective.id] ?? '实验目标'}${objective.usedHint ? '（用过答案提示）' : objective.completed && !objective.firstCorrect ? '（修正后完成）' : ''}`; facts.append(item); });
  host.append(facts);
  const details = document.createElement('details'); const summary = document.createElement('summary'); summary.textContent = '同题比较信息'; details.append(summary);
  line(details, '游戏', activityNames[result.config.activityId]); line(details, '方式', result.config.mode === 'contest' ? '正式挑战' : '练习');
  line(details, '档位', result.config.profile === 'guided' ? '引导' : '标准'); line(details, '挑战码', result.config.challengeCode);
  line(details, '内容版本', result.config.contentVersion); line(details, '计分版本', result.config.scoringVersion);
  line(details, '总时限', result.config.durationMs === null ? '不限时' : '360 秒');
  line(details, '比较资格', result.eligible ? '相同游戏、挑战码、档位、版本和时限可比较' : '本次不作为正式比较成绩'); host.append(details);
  const saved = document.createElement('p'); saved.className = 'arcade-persistence'; saved.textContent = persistenceCopy(persistence); host.append(saved);
}

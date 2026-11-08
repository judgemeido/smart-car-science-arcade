import { createScope } from '../../shared/lifecycle';
import { recoverInterruptedArcadeDraft, type ArcadeRepository, type ArcadeRepositorySnapshot, type ArcadeSession, type ArcadeSnapshot, type ParsedChallengeCode, type Profile, type StartResult } from '../../shared/arcade';
import { changeReadyProfile, confirmRecordAction, createReadySetup, createRecordConfirmation, editReadyCode, validateReadySetup, type RecordAction, type RecordConfirmation } from './model';
import { activityNames, persistenceCopy, renderArcadeResult, statusNames } from './results';
import { mountArcadeAssistant } from './assistant';
import { createArcadeSound } from './sound';

export interface ArcadeStartRequest { mode: 'practice' | 'contest'; challenge: ParsedChallengeCode; nickname: string; profile: Profile }
export interface ArcadeShellOptions {
  title: string; subtitle: string; repository: ArcadeRepository; session: ArcadeSession;
  objectiveLabels?: Readonly<Record<string, string>>;
  onStart(request: ArcadeStartRequest): StartResult;
  onRestart(): void; onHint(): void; onPause(paused: boolean): void;
}
const startFailures = {
  'invalid-config': '本轮设置还不完整，请检查挑战码和档位。', 'already-running': '这次实验还在进行，先完成或结束它。',
  'attempt-used': '这个挑战码的首次正式尝试已保留。可以继续练习，或请老师提供新轮次码。',
  'other-run-active': '本机还有一场未完成挑战。可以先练习，或明确结束那场挑战。',
  'capacity-full': '本机首次尝试记录已满。练习仍可使用，也可以在记录中明确清理。',
};

/** Stable stage/tools mounts; timer and repository callbacks never replace game DOM. */
export function createArcadeShell(host: HTMLElement, options: ArcadeShellOptions) {
  const scope = createScope(); const sound = createArcadeSound();
  const repository = options.repository; const session = options.session;
  let local = repository.read(); let ready = createReadySetup(local.store.preferences);
  let snapshot: ArcadeSnapshot | null = null; let active = true; let paused = false; let disposed = false;
  let confirmation: RecordConfirmation | null = null; let selectedResultId: string | null = null; let resultRenderedId: string | null = null;
  let previousFeedback = ''; let previousGoal = ''; let recordsSignature = '';
  host.innerHTML = `<section class="arcade-shell" data-arcade-shell>
    <header class="arcade-heading"><div><h1 data-game-title></h1><p data-game-subtitle></p></div><div class="arcade-heading__actions"><button type="button" data-tutorial>怎么玩</button><button type="button" data-records-open>我的记录与设置</button></div></header>
    <div class="arcade-ready" data-ready><label>挑战档位<select aria-label="挑战档位" data-profile><option value="guided">引导</option><option value="standard">标准</option></select></label><button class="arcade-primary" type="button" data-start-practice>开始练习</button><button type="button" data-start-contest>正式挑战</button><details class="arcade-round-details"><summary>本轮设置</summary><div><label>我的昵称（可不填）<input data-nickname maxlength="30" autocomplete="off"></label><label>老师的挑战码（可不填）<input data-code autocomplete="off" spellcheck="false"></label><p>相同游戏、挑战码和档位，才能比较真实成绩。练习不限时。</p></div></details></div>
    <p class="arcade-start-error" data-start-error role="status"></p>
    <div class="arcade-draft-warning" data-draft-warning hidden><p data-draft-message></p><button type="button" data-recover>结束未完成挑战</button></div>
    <div class="arcade-hud"><div class="arcade-goal"><span class="arcade-goal__number" data-stage-number>1</span><h2 data-goal></h2></div><div class="arcade-hud__status"><span data-mode>准备实验</span><strong data-timer></strong><span class="arcade-progress" data-progress>0 / 6</span><button type="button" data-pause hidden>暂停操作</button><button type="button" data-hint hidden>答案提示</button></div></div>
    <div class="arcade-paused" data-paused hidden>操作已暂停。正式挑战的倒计时继续。</div>
    <div class="arcade-playtable"><div data-stage-host></div><div data-tools-host></div></div>
    <div class="arcade-feedback" data-feedback data-game-feedback role="status" aria-live="polite"></div>
    <div class="arcade-run-footer"><p class="arcade-persistence" data-persistence></p><button type="button" data-restart hidden>再练一遍</button><button type="button" data-finish hidden>结束本次实验</button></div>
    <section class="arcade-finished" data-finished hidden><div data-result-host></div><button type="button" class="arcade-primary" data-result-practice>开始新练习</button></section>
    <dialog class="arcade-dialog" data-tutorial-dialog><div class="arcade-dialog__heading"><h2>光怎样出去又回来？</h2><button type="button" data-tutorial-close>关闭</button></div><ol class="arcade-tutorial"><li>转动发射器，让光碰到反光点。</li><li>选接收线头，再选插口，把接收通路接好。</li><li>发射一次，看光路和读数，发现原因再修正。</li></ol><p>这些操作说明不影响首次验证分。答案提示会先询问你。</p><button class="arcade-primary" type="button" data-tutorial-close>我知道了</button></dialog>
    <dialog class="arcade-dialog" data-contest-dialog><h2>正式挑战准备好了吗？</h2><p>360 秒完成六个目标。暂停操作、切到后台仍会计时。</p><p>跳转到其他页面或刷新会结束本次挑战，返回后不能继续这一次。</p><p>每个挑战码保留本机首次正式尝试。修正仍可获得探索分，答案提示影响首次验证分。</p><div class="arcade-dialog__actions"><button type="button" data-contest-cancel>先练习</button><button class="arcade-primary" type="button" data-contest-confirm>开始正式挑战</button></div></dialog>
    <dialog class="arcade-drawer" data-records-dialog><div class="arcade-dialog__heading"><h2>我的记录与设置</h2><button type="button" data-records-close>关闭</button></div><p data-records-persistence></p><label class="arcade-sound"><input type="checkbox" data-sound> 开启实验音效</label><p>昵称只存在本机。改昵称不会重置首次尝试。</p><label>我的昵称<input data-settings-nickname maxlength="30" autocomplete="off"></label><button type="button" data-save-nickname>保存昵称</button><div class="arcade-records-list" data-records-list></div><div data-record-detail hidden></div><p class="arcade-confirmation" data-confirmation role="status"></p><div class="arcade-maintenance"><button type="button" data-record-action="next-player">下一位实验员</button><button type="button" data-record-action="clear">清除本机记录</button><button type="button" data-record-action="reset">重置本机设置与记录</button></div><p>删除单条成绩会保留首次尝试限制。清除记录会同时清除限制，只影响这个科学游戏的本机数据。</p></dialog>
  </section>`;
  const el = <T extends HTMLElement = HTMLElement>(selector: string) => host.querySelector<T>(selector)!;
  const stageHost = el('[data-stage-host]'); const toolsHost = el('[data-tools-host]');
  const tutorial = el<HTMLDialogElement>('[data-tutorial-dialog]'); const contest = el<HTMLDialogElement>('[data-contest-dialog]'); const records = el<HTMLDialogElement>('[data-records-dialog]');
  el('[data-game-title]').textContent = options.title; el('[data-game-subtitle]').textContent = options.subtitle;
  el<HTMLSelectElement>('[data-profile]').value = ready.profile;
  el<HTMLInputElement>('[data-nickname]').value = ready.nickname;
  el<HTMLInputElement>('[data-code]').value = ready.manualCode ? ready.code : '';
  el<HTMLInputElement>('[data-code]').placeholder = ready.code;
  const assistant = mountArcadeAssistant(el<HTMLButtonElement>('[data-hint]'), el('[data-feedback]'), options.onHint); scope.add(assistant.dispose);
  scope.add(sound.dispose); sound.setEnabled(local.store.preferences.soundEnabled);

  function setPaused(value: boolean) {
    paused = value; el('[data-paused]').hidden = !paused;
    el('[data-pause]').textContent = paused ? '继续操作' : '暂停操作';
    options.onPause(paused); updateControls(); sound.setActive(active && !paused);
  }
  function updateControls() {
    const enabled = active && !paused && snapshot?.phase === 'running';
    toolsHost.querySelectorAll<HTMLInputElement | HTMLButtonElement>('button,input,select').forEach(control => { control.disabled = !enabled || control.dataset.locked === 'true'; });
    el<HTMLButtonElement>('[data-hint]').disabled = !enabled;
  }
  function close(dialog: HTMLDialogElement) { dialog.close(); if (snapshot?.phase === 'running') setPaused(false); }
  function open(dialog: HTMLDialogElement) { if (snapshot?.phase === 'running') setPaused(true); confirmation = null; el('[data-confirmation]').textContent = ''; dialog.showModal(); }
  function start(mode: 'practice' | 'contest') {
    const validation = validateReadySetup(ready);
    if (!validation.ok) {
      el('[data-start-error]').textContent = validation.reason === 'profile-mismatch' ? '挑战码末尾的 G/S 与当前档位不一致。请选择对应档位，或向老师确认挑战码。' : '挑战码格式不对。请检查老师的代码，或清空后使用默认练习。'; return;
    }
    const preferences = repository.updatePreferences({ nickname: el<HTMLInputElement>('[data-nickname]').value, profile: ready.profile, lastChallengeCode: validation.challenge.code });
    const result = options.onStart({ mode, challenge: validation.challenge, profile: preferences.profile, nickname: preferences.nickname });
    el('[data-start-error]').textContent = result.ok ? '' : startFailures[result.reason];
    if (result.ok) { paused = false; assistant.reset(); el('[data-paused]').hidden = true;
      queueMicrotask(() => { if (disposed) return; el('[data-goal]').tabIndex = -1; el('[data-goal]').focus({ preventScroll: true }); if (matchMedia('(max-width: 600px)').matches) window.scrollTo({ top: 0, behavior: 'instant' }); });
    }
  }
  function updateLocal(next: ArcadeRepositorySnapshot) {
    local = next; sound.setEnabled(next.store.preferences.soundEnabled);
    const copy = persistenceCopy(next.persistence); el('[data-persistence]').textContent = copy; el('[data-records-persistence]').textContent = copy;
    el('[data-draft-warning]').hidden = !next.store.activeDraft || next.store.activeDraft.runId === snapshot?.runId;
    el('[data-draft-message]').textContent = next.store.activeDraft ? `本机有“${next.store.activeDraft.config.nickname}”的未完成挑战。不会自动恢复，也不会自动结束。练习仍可使用。` : '';
    if (records.open) renderRecords();
  }
  function renderRecords() {
    el<HTMLInputElement>('[data-sound]').checked = local.store.preferences.soundEnabled;
    const signature = JSON.stringify(local.store.results.map(r => r.runId));
    if (signature === recordsSignature) return; recordsSignature = signature;
    const list = el('[data-records-list]'); list.replaceChildren();
    if (!local.store.results.length) { const empty = document.createElement('p'); empty.textContent = '还没有实验记录。开始一次练习，留下自己的发现。'; list.append(empty); }
    for (const result of [...local.store.results].reverse()) {
      const row = document.createElement('div'); row.className = 'arcade-record-row';
      const button = document.createElement('button'); button.type = 'button'; button.dataset.resultId = result.runId;
      button.textContent = `${activityNames[result.config.activityId]} · ${result.config.nickname} · ${result.score ? `${result.score.total} 分` : result.config.mode === 'practice' ? '练习' : statusNames[result.status]}`;
      const remove = document.createElement('button'); remove.type = 'button'; remove.dataset.deleteId = result.runId; remove.textContent = '删除'; row.append(button, remove); list.append(row);
    }
    if (selectedResultId && !local.store.results.some(result => result.runId === selectedResultId)) el('[data-record-detail]').hidden = true;
  }
  function requestRecordAction(action: RecordAction, runId?: string) {
    const fresh = repository.read(); const candidate = createRecordConfirmation(action, fresh, runId);
    if (!confirmRecordAction(confirmation, candidate)) {
      confirmation = candidate;
      const activeWarning = snapshot?.phase === 'running' ? '当前实验也会结束。' : fresh.store.activeDraft ? '未完成挑战也会结束，可能影响另一个窗口。' : '';
      const messages = { clear: `将删除 ${candidate.resultCount} 条记录和 ${candidate.lockCount} 个首次尝试限制。${activeWarning}再次点击“清除本机记录”确认。`, reset: `将删除 ${candidate.resultCount} 条记录、首次尝试限制和昵称/音效设置。${activeWarning}再次点击“重置本机设置与记录”确认。`, 'next-player': `为下一位建立新昵称位置，旧记录保留。${snapshot?.phase === 'running' ? '当前实验会先结束。' : ''}再次点击“下一位实验员”确认。`, recover: '将结束这场未完成挑战，保留首次尝试限制，可能影响另一个窗口。再次点击“结束未完成挑战”确认。', delete: '只删除这条记录，首次尝试限制保留。再次点击同一条记录的“删除”确认。' };
      const target = action === 'recover' ? el('[data-draft-message]') : el('[data-confirmation]'); target.textContent = messages[action]; return;
    }
    confirmation = null;
    if (action === 'recover') {
      const ended = candidate.expectedRunId ? recoverInterruptedArcadeDraft(repository, candidate.expectedRunId) : null;
      el('[data-draft-message]').textContent = ended ? '这场未完成挑战已结束，首次尝试限制仍保留。' : '未完成挑战已变化，请重新查看，不会结束另一场新挑战。';
    } else if (action === 'delete') {
      if (runId) repository.deleteResult(runId); el('[data-confirmation]').textContent = '记录已删除，首次尝试限制仍保留。';
    } else {
      session.finish('abandoned');
      if (action === 'next-player') repository.createPlayerSlot('下一位'); else if (action === 'clear') repository.clearRecords(); else repository.reset();
      ready = createReadySetup(repository.read().store.preferences);
      el<HTMLInputElement>('[data-nickname]').value = ready.nickname; el<HTMLInputElement>('[data-settings-nickname]').value = ready.nickname;
      el<HTMLSelectElement>('[data-profile]').value = ready.profile; el<HTMLInputElement>('[data-code]').value = ready.manualCode ? ready.code : '';
      el('[data-confirmation]').textContent = action === 'next-player' ? '已准备好下一位。关闭设置后开始新练习。' : '本机数据已清理。';
    }
    updateLocal(repository.read());
  }
  function renderSession(next: ArcadeSnapshot) {
    snapshot = next; const running = next.phase === 'running'; const finished = next.phase === 'finished';
    el('[data-ready]').hidden = running; el('[data-finished]').hidden = !finished;
    el('[data-pause]').hidden = !running; el('[data-hint]').hidden = !running;
    el('[data-restart]').hidden = !running || next.config?.mode !== 'practice'; el('[data-finish]').hidden = !running;
    el('[data-mode]').textContent = next.config?.mode === 'contest' ? '正式挑战' : running ? '自由练习' : '准备实验';
    el('[data-timer]').textContent = next.remainingMs === null ? '' : `${String(Math.floor(Math.ceil(next.remainingMs / 1000) / 60)).padStart(2, '0')}:${String(Math.ceil(next.remainingMs / 1000) % 60).padStart(2, '0')}`;
    el('[data-progress]').textContent = `${next.objectives.filter(o => o.completed).length} / ${next.objectives.length || 6}`;
    el('[data-persistence]').textContent = persistenceCopy(next.persistence);
    if (finished && next.result && resultRenderedId !== next.result.runId) { resultRenderedId = next.result.runId; renderArcadeResult(el('[data-result-host]'), next.result, next.persistence, options.objectiveLabels); }
    el('[data-draft-warning]').hidden = !local.store.activeDraft || local.store.activeDraft.runId === next.runId;
    updateControls();
  }
  scope.listen(el('[data-start-practice]'), 'click', () => start('practice'));
  scope.listen(el('[data-start-contest]'), 'click', () => open(contest));
  scope.listen(el('[data-contest-confirm]'), 'click', () => { close(contest); start('contest'); });
  scope.listen(el('[data-contest-cancel]'), 'click', () => close(contest));
  scope.listen(el('[data-tutorial]'), 'click', () => open(tutorial));
  host.querySelectorAll('[data-tutorial-close]').forEach(button => scope.listen(button, 'click', () => close(tutorial)));
  scope.listen(el('[data-profile]'), 'change', () => { ready = changeReadyProfile(ready, el<HTMLSelectElement>('[data-profile]').value as Profile); if (!ready.manualCode) el<HTMLInputElement>('[data-code]').placeholder = ready.code; });
  scope.listen(el('[data-code]'), 'input', () => { ready = editReadyCode(ready, el<HTMLInputElement>('[data-code]').value); });
  scope.listen(el('[data-pause]'), 'click', () => setPaused(!paused));
  scope.listen(el('[data-restart]'), 'click', options.onRestart);
  scope.listen(el('[data-result-practice]'), 'click', () => { closeIfOpen(); start('practice'); });
  scope.listen(el('[data-finish]'), 'click', () => { session.finish('abandoned'); });
  scope.listen(el('[data-records-open]'), 'click', () => { recordsSignature = ''; el<HTMLInputElement>('[data-settings-nickname]').value = local.store.preferences.nickname; renderRecords(); open(records); });
  scope.listen(el('[data-records-close]'), 'click', () => close(records));
  scope.listen(el('[data-save-nickname]'), 'click', () => { const preferences = repository.updatePreferences({ nickname: el<HTMLInputElement>('[data-settings-nickname]').value }); ready.nickname = preferences.nickname; el<HTMLInputElement>('[data-nickname]').value = preferences.nickname; el<HTMLInputElement>('[data-settings-nickname]').value = preferences.nickname; });
  scope.listen(el('[data-sound]'), 'change', () => { const enabled = el<HTMLInputElement>('[data-sound]').checked; repository.updatePreferences({ soundEnabled: enabled }); sound.setEnabled(enabled); sound.play('neutral'); });
  scope.listen(el('[data-recover]'), 'click', () => requestRecordAction('recover'));
  scope.listen(el('[data-records-dialog]'), 'click', (event: MouseEvent) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button'); if (!button) return;
    if (button.dataset.recordAction) requestRecordAction(button.dataset.recordAction as RecordAction);
    if (button.dataset.deleteId) requestRecordAction('delete', button.dataset.deleteId);
    if (button.dataset.resultId) {
      selectedResultId = button.dataset.resultId; const result = local.store.results.find(r => r.runId === selectedResultId);
      if (result) { el('[data-record-detail]').hidden = false; renderArcadeResult(el('[data-record-detail]'), result, local.persistence, options.objectiveLabels); }
    }
  });
  function closeIfOpen() { [records, tutorial, contest].forEach(dialog => { if (dialog.open) close(dialog); }); }
  [records, tutorial, contest].forEach(dialog => scope.listen(dialog, 'close', () => { if (snapshot?.phase === 'running') setPaused(false); }));
  scope.add(session.subscribe(renderSession)); scope.add(repository.subscribe(updateLocal));
  return {
    stageHost, toolsHost, renderSession,
    setGoal(text: string, stageNumber = '1') { if (previousGoal !== text) { previousGoal = text; assistant.reset(); } el('[data-goal]').textContent = text; el('[data-stage-number]').textContent = stageNumber; },
    setFeedback(text: string, kind: 'neutral' | 'correct' | 'incorrect' = 'neutral') { el('[data-feedback]').textContent = text; el('[data-feedback]').dataset.kind = kind; if (text !== previousFeedback) sound.play(kind); previousFeedback = text; },
    refreshControls: updateControls,
    setActive(value: boolean) { active = value; updateControls(); sound.setActive(active && !paused); },
    dispose() { if (disposed) return; disposed = true; closeIfOpen(); scope.dispose(); },
  };
}

import { ARCADE_CONTENT_VERSION, ARCADE_DURATION_MS, ARCADE_SCORING_VERSION, createArcadeRepository, createArcadeSession } from '../../shared/arcade';
import type { ChapterController } from '../../app/types';
import { createArcadeShell, type ArcadeStartRequest } from '../../ui/arcade/shell';
import { createSensorScenario } from './scenario';
import { createSensorState, getSensorSnapshot, reduceSensorLab } from './state';
import { mountSensorView } from './view';
import { sensorObjectiveLabels } from './content';
import type { SensorAction } from './types';

export function mount(host: HTMLElement): ChapterController {
  const repository = createArcadeRepository(); const session = createArcadeSession({ repository });
  let scenario = createSensorScenario({ seed: '7K2M4C', profile: repository.read().store.preferences.profile, contentVersion: ARCADE_CONTENT_VERSION });
  let state = createSensorState(scenario); let documentActive = true; let paused = false; let disposed = false;
  let lastRequest: ArcadeStartRequest | null = null;
  const shell = createArcadeShell(host, {
    title: '回波侦探', subtitle: '把光送出去，再接回来', repository, session, objectiveLabels: sensorObjectiveLabels,
    onStart: start,
    onRestart() { session.finish('abandoned'); start(lastRequest ? { ...lastRequest, mode: 'practice' } : { mode: 'practice', challenge: { code: `SA1-R07-7K2M4C-${scenario.profile === 'guided' ? 'G' : 'S'}`, seed: '7K2M4C', round: 'R07', profile: scenario.profile }, nickname: repository.read().store.preferences.nickname, profile: scenario.profile }); },
    onHint() { act({ type: 'hint' }); },
    onPause(value) { paused = value; session.setActive(documentActive && !paused); view?.setActive(documentActive && !paused); },
  });
  const view = mountSensorView(shell.stageHost, shell.toolsHost, act);
  function render() {
    view.render(getSensorSnapshot(state, scenario), scenario.angleStep);
    shell.setGoal(state.stage === 'aim' ? '让光碰到路标上的反光点' : state.stage === 'receive' ? '接好接收通路，再发射一次' : '光与回波的实验完成了');
    shell.setFeedback(state.feedback, state.feedbackKind); shell.refreshControls();
  }
  function start(request: ArcadeStartRequest) {
    const candidateScenario = createSensorScenario({ seed: request.challenge.seed, profile: request.profile, contentVersion: ARCADE_CONTENT_VERSION });
    const preferences = repository.read().store.preferences;
    const admitted = session.start({ activityId: 'sensor-lab', mode: request.mode, profile: request.profile, challengeCode: request.challenge.code,
      contentVersion: ARCADE_CONTENT_VERSION, scoringVersion: ARCADE_SCORING_VERSION, durationMs: request.mode === 'contest' ? ARCADE_DURATION_MS : null,
      slotId: preferences.slotId, nickname: preferences.nickname, objectives: candidateScenario.objectives });
    if (admitted.ok) { scenario = candidateScenario; state = createSensorState(scenario); lastRequest = request; paused = false; session.setActive(documentActive); render(); }
    return admitted;
  }
  function act(action: SensorAction) { if (disposed) return; const candidate = reduceSensorLab(state, action, scenario); if (session.record(candidate.facts)) { state = candidate.state; render(); } }
  render();
  return {
    setActive(value) { if (disposed) return; documentActive = value; session.setActive(value && !paused); shell.setActive(value); view.setActive(value && !paused); },
    dispose() { if (disposed) return; disposed = true; session.dispose(); shell.dispose(); view.dispose(); repository.dispose(); },
  };
}

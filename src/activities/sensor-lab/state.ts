import { hitReflectiveMarker } from './measurement';
import type { SensorAction, SensorScenario, SensorSnapshot, SensorState, SensorTransition } from './types';

export function createSensorState(_scenario: SensorScenario): SensorState {
  return { stage: 'aim', angleDegrees: 0, cableSelected: false, connection: null,
    pulseRevision: 0, echoRevision: 0, pulseHint: false, echoHint: false, ray: null, shots: 0,
    feedback: '转动发射器，让光碰到路标上的反光点。', feedbackKind: 'neutral' };
}
export function reduceSensorLab(state: SensorState, action: SensorAction, scenario: SensorScenario): SensorTransition {
  const unchanged = { state, facts: [] };
  if (state.stage === 'first-complete') return unchanged;
  if (action.type === 'aim') {
    if (!Number.isFinite(action.degrees) || action.degrees < -40 || action.degrees > 40) return unchanged;
    const angle = Math.round(action.degrees / scenario.angleStep) * scenario.angleStep;
    if (state.angleDegrees === angle) return unchanged;
    return { state: { ...state, angleDegrees: angle, ray: null,
      pulseRevision: state.pulseRevision + (state.stage === 'aim' ? 1 : 0),
      echoRevision: state.echoRevision + (state.stage === 'receive' ? 1 : 0) }, facts: [] };
  }
  if (action.type === 'hint') {
    return { state: { ...state, pulseHint: state.pulseHint || state.stage === 'aim',
      echoHint: state.echoHint || state.stage === 'receive',
      feedback: state.stage === 'aim' ? `把方向调到 ${scenario.targets[0].bearingDegrees}° 附近，再发射。` : '选中接收线头，再接到 Rx 接收口，然后重新发射。', feedbackKind: 'neutral' }, facts: [] };
  }
  if (action.type === 'select-cable') return state.stage === 'receive' ? { state: { ...state, cableSelected: true }, facts: [] } : unchanged;
  if (action.type === 'connect') {
    if (!state.cableSelected || state.stage !== 'receive') return unchanged;
    return { state: { ...state, connection: action.socket, cableSelected: false, ray: null,
      echoRevision: state.echoRevision + (state.connection !== action.socket ? 1 : 0),
      feedback: `线头已连接到 ${action.socket === 'tx' ? 'Tx 发射口' : 'Rx 接收口'}。发射一次，检查结果。`, feedbackKind: 'neutral' }, facts: [] };
  }
  const hit = hitReflectiveMarker({ x: 0, y: 0 }, state.angleDegrees, scenario.targets[0], scenario.halfAngleDegrees);
  const ray = { degrees: state.angleDegrees, hit: !!hit, received: !!hit && state.stage === 'receive' && state.connection === 'rx', reflectivePoint: hit?.reflectivePoint ?? null };
  const candidate = { ...state, ray, shots: state.shots + 1 };
  if (state.stage === 'aim') return {
    state: { ...candidate, stage: hit ? 'receive' : 'aim', feedbackKind: hit ? 'correct' : 'incorrect',
      feedback: hit ? '命中反光点！一部分光返回来了。现在把接收线头接好，再发射。' : '光没有碰到反光点。顺着光路，转动发射器再试一次。' },
    facts: [{ objectiveId: 'pulse-hit', revision: state.pulseRevision, verdict: hit ? 'correct' : 'incorrect', usedHint: state.pulseHint }],
  };
  if (!state.connection) return { state: { ...candidate, feedbackKind: 'neutral', feedback: '回波还没有接收通路。先选接收线头，再选择插口。' }, facts: [] };
  const received = !!hit && state.connection === 'rx';
  return {
    state: { ...candidate, stage: received ? 'first-complete' : 'receive', feedbackKind: received ? 'correct' : 'incorrect',
      feedback: received ? '接收到回波！光出去又回来，接收器记录了这段时间。' : !hit ? '这次光没有碰到反光点。接好线后，也要对准目标。' : '回波回来了，但线头接在发射口。把线头改接到 Rx 接收口。' },
    facts: [{ objectiveId: 'echo-received', revision: state.echoRevision, verdict: received ? 'correct' : 'incorrect', usedHint: state.echoHint }],
  };
}
export function getSensorSnapshot(state: SensorState, scenario: SensorScenario): SensorSnapshot {
  const target = scenario.targets[0];
  const hit = state.ray?.hit ? hitReflectiveMarker({ x: 0, y: 0 }, state.ray.degrees, target, scenario.halfAngleDegrees) : null;
  return { ...state, target, measuredTargets: hit ? [{ id: target.id, ...hit, uniqueSampleIds: [] }] : [] };
}

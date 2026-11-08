import type { Scenario } from './data';

export const CROSSING_DURATION_SECONDS = 4.8;
export const CRUISE_SPEED = 7.2;
export const BRAKING_ACCELERATION = 5.5;
export type CrossingState = 'idle' | 'waiting' | 'crossing' | 'cleared';

export interface WorldState {
  carZ: number;
  ambulanceZ: number;
  trafficCarZs: number[];
  worldTime: number;
  driving: boolean;
  courtesyState: CrossingState;
  courtesyProgress: number;
  greenLightState: CrossingState;
  greenLightProgress: number;
}

export function createWorldState(): WorldState {
  return {
    carZ: -1.5,
    ambulanceZ: -176,
    trafficCarZs: Array.from({ length: 6 }, (_, index) => -18 - index * 22),
    worldTime: 0,
    driving: false,
    courtesyState: 'idle',
    courtesyProgress: 0,
    greenLightState: 'idle',
    greenLightProgress: 0,
  };
}

export function stepWorld(state: WorldState, deltaSeconds: number, scenario: Scenario): WorldState {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0)
    throw new RangeError('道路时间步长必须是非负有限秒数');
  if (deltaSeconds === 0) return state;
  const next = { ...state, worldTime: state.worldTime + deltaSeconds };
  if (state.driving) {
    const remaining = state.carZ - scenario.stopZ;
    const speed = Math.min(CRUISE_SPEED, Math.sqrt(Math.max(0, 2 * BRAKING_ACCELERATION * remaining)));
    next.carZ =
      remaining <= 0.08 ? scenario.stopZ : Math.max(scenario.stopZ, state.carZ - speed * deltaSeconds);
    if (next.carZ <= scenario.stopZ + 0.001) next.driving = false;
  }
  if (state.courtesyState === 'crossing') {
    next.courtesyProgress = Math.min(1, state.courtesyProgress + deltaSeconds / CROSSING_DURATION_SECONDS);
    if (next.courtesyProgress >= 1) next.courtesyState = 'cleared';
  }
  if (state.greenLightState === 'crossing') {
    next.greenLightProgress = Math.min(
      1,
      state.greenLightProgress + deltaSeconds / CROSSING_DURATION_SECONDS,
    );
    if (next.greenLightProgress >= 1) next.greenLightState = 'cleared';
  }
  next.trafficCarZs = state.trafficCarZs.map((z, index) => {
    const moved = z + deltaSeconds * (1.5 + (index % 3) * 0.4);
    return moved > 14 ? -136 - index * 3 : moved;
  });
  if (scenario.id === 'ambulance' && next.driving) {
    next.ambulanceZ += deltaSeconds * 4.2;
    if (next.ambulanceZ > -150) next.ambulanceZ = -176;
  }
  return next;
}

import { describe, expect, it } from 'vitest';
import { scenarios } from '../../../src/chapters/traffic/data';
import { createWorldState, stepWorld, type WorldState } from '../../../src/chapters/traffic/simulation';

describe('traffic road simulation', () => {
  it('does not move the world for zero delta', () => {
    const state = { ...createWorldState(), driving: true, courtesyState: 'crossing' as const };
    expect(stepWorld(state, 0, scenarios[0])).toEqual(state);
  });

  it.each(['courtesy', 'greenLight'] as const)('finishes %s crossing after 4.8 active seconds', (group) => {
    let state: WorldState = { ...createWorldState(), [`${group}State`]: 'crossing' };
    const original = state;
    state = stepWorld(state, 2.4, scenarios[group === 'courtesy' ? 1 : 4]);
    expect(state[`${group}Progress`]).toBeCloseTo(0.5);
    expect(state[`${group}State`]).toBe('crossing');
    state = stepWorld(state, 2.4, scenarios[group === 'courtesy' ? 1 : 4]);
    expect(state[`${group}Progress`]).toBe(1);
    expect(state[`${group}State`]).toBe('cleared');
    expect(original[`${group}Progress`]).toBe(0);
  });

  it('does not advance waiting or idle pedestrian progress', () => {
    const state = { ...createWorldState(), courtesyState: 'waiting' as const, courtesyProgress: 0.3 };
    const next = stepWorld(state, 1, scenarios[1]);
    expect(next.courtesyProgress).toBe(0.3);
    expect(next.greenLightProgress).toBe(0);
  });

  it.each([-1, NaN, Infinity, -Infinity])('rejects invalid delta %s', (delta) => {
    expect(() => stepWorld(createWorldState(), delta, scenarios[0])).toThrow(RangeError);
  });

  it('uses the original cruise and braking formula without crossing the stop', () => {
    let state = { ...createWorldState(), driving: true };
    const next = stepWorld(state, 1, scenarios[0]);
    expect(next.carZ).toBeCloseTo(-8.7);
    expect(state.carZ).toBe(-1.5);
    state = stepWorld(next, 0.1, scenarios[0]);
    expect(state.carZ).toBeCloseTo(-8.7 - Math.sqrt(2 * 5.5 * 1.7) * 0.1);
    state = stepWorld(state, 100, scenarios[0]);
    expect(state.carZ).toBe(-10.4);
    expect(state.driving).toBe(false);
    expect(stepWorld(state, 1, scenarios[0]).carZ).toBe(-10.4);
  });

  it('snaps the final stopping gap and keeps paused gameplay stationary', () => {
    const nearStop = { ...createWorldState(), carZ: -10.33, driving: true };
    expect(stepWorld(nearStop, 0.01, scenarios[0]).carZ).toBe(-10.4);
    const waiting = createWorldState();
    const next = stepWorld(waiting, 1, scenarios[0]);
    expect(next.carZ).toBe(-1.5);
    expect(next.worldTime).toBe(1);
  });

  it('moves and wraps ambient cars with the original speeds', () => {
    const state = { ...createWorldState(), trafficCarZs: [13.5, -40, -62] };
    const next = stepWorld(state, 1, scenarios[0]);
    expect(next.trafficCarZs).toEqual([-136, -38.1, -59.7]);
    expect(state.trafficCarZs).toEqual([13.5, -40, -62]);
  });

  it('moves the ambulance only while driving its scenario and resets its wrap', () => {
    const driving = { ...createWorldState(), driving: true, carZ: -140, ambulanceZ: -151 };
    expect(stepWorld(driving, 1, scenarios[7]).ambulanceZ).toBe(-176);
    expect(stepWorld({ ...driving, driving: false }, 1, scenarios[7]).ambulanceZ).toBe(-151);
    expect(stepWorld(driving, 1, scenarios[6]).ambulanceZ).toBe(-151);
  });
});

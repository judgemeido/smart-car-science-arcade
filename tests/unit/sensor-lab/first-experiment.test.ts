import { expect, it } from 'vitest';
import { createSensorScenario } from '../../../src/activities/sensor-lab/scenario';
import { createSensorState, reduceSensorLab, getSensorSnapshot } from '../../../src/activities/sensor-lab/state';
import { roundTripNanoseconds, SPEED_OF_LIGHT_METERS_PER_SECOND } from '../../../src/content/sensing/measurement';

const scenario = () => createSensorScenario({ seed: '7K2M4C', profile: 'guided', contentVersion: 'science-arcade-content-1' });
it('generates stable shared meter geometry and six actual objective weights', () => {
  const a = scenario();
  expect(a).toEqual(scenario());
  expect(a.targets.map(t => t.distanceMeters)).toEqual([8, 16, 28]);
  expect(a.targets.map(t => t.bearingDegrees)).toEqual([-20, 0, 20]);
  expect(a.objectives.reduce((sum, o) => sum + o.weight, 0)).toBe(1000);
  expect(SPEED_OF_LIGHT_METERS_PER_SECOND).toBe(299792458);
  expect(roundTripNanoseconds(30)).toBeCloseTo(200.138, 3);
  expect(() => roundTripNanoseconds(-1)).toThrow(RangeError);
});
it('misses then hits the reflective point without penalizing locked receiving', () => {
  const scene = scenario();
  let state = createSensorState(scene);
  let next = reduceSensorLab(state, { type: 'fire' }, scene);
  expect(next.facts).toEqual([{ objectiveId: 'pulse-hit', revision: 0, verdict: 'incorrect', usedHint: false }]);
  state = reduceSensorLab(next.state, { type: 'aim', degrees: -20 }, scene).state;
  next = reduceSensorLab(state, { type: 'fire' }, scene);
  expect(next.facts).toEqual([{ objectiveId: 'pulse-hit', revision: 1, verdict: 'correct', usedHint: false }]);
  const snapshot = getSensorSnapshot(next.state, scene);
  expect(snapshot.stage).toBe('receive');
  expect(snapshot.ray?.hit).toBe(true);
  expect(snapshot.measuredTargets[0].distanceMeters).toBeCloseTo(8);
  expect(snapshot.measuredTargets[0].roundTripNanoseconds).toBeCloseTo(roundTripNanoseconds(8));
});
it('empty cable is incomplete; Tx is valid wrong, Rx correction succeeds once', () => {
  const scene = scenario();
  let state = reduceSensorLab(createSensorState(scene), { type: 'aim', degrees: -20 }, scene).state;
  state = reduceSensorLab(state, { type: 'fire' }, scene).state;
  expect(reduceSensorLab(state, { type: 'fire' }, scene).facts).toEqual([]);
  state = reduceSensorLab(state, { type: 'select-cable' }, scene).state;
  state = reduceSensorLab(state, { type: 'connect', socket: 'tx' }, scene).state;
  let next = reduceSensorLab(state, { type: 'fire' }, scene);
  expect(next.facts[0]).toMatchObject({ objectiveId: 'echo-received', verdict: 'incorrect' });
  state = reduceSensorLab(next.state, { type: 'select-cable' }, scene).state;
  state = reduceSensorLab(state, { type: 'connect', socket: 'rx' }, scene).state;
  next = reduceSensorLab(state, { type: 'fire' }, scene);
  expect(next.facts[0]).toMatchObject({ objectiveId: 'echo-received', verdict: 'correct' });
  expect(next.state.stage).toBe('first-complete');
  expect(reduceSensorLab(next.state, { type: 'fire' }, scene).facts).toEqual([]);
});
it('hints mark only the current uncompleted objective and pure edits have no facts', () => {
  const scene = scenario();
  let state = reduceSensorLab(createSensorState(scene), { type: 'hint' }, scene).state;
  const edit = reduceSensorLab(state, { type: 'aim', degrees: -20 }, scene);
  expect(edit.facts).toEqual([]);
  expect(reduceSensorLab(edit.state, { type: 'fire' }, scene).facts[0].usedHint).toBe(true);
  expect(reduceSensorLab(state, { type: 'aim', degrees: Number.NaN }, scene).state).toEqual(state);
  expect(reduceSensorLab(state, { type: 'connect', socket: 'rx' }, scene).state.connection).toBe(null);
});

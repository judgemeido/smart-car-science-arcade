import { describe, expect, it } from 'vitest';
import { calculateArcadeScore, createComparisonKey } from '../../../src/shared/arcade/scoring';
import {
  parseChallengeCode,
  fnv1a32,
  mulberry32,
  createActivityRandom,
} from '../../../src/shared/arcade/challenge-code';
import { config } from './fixtures';

describe('explainable weighted scoring', () => {
  it.each([
    [1000, 1000, 180000, 1000],
    [1000, 1000, 270000, 950],
    [1000, 800, 270000, 910],
    [600, 400, 360000, 500],
    [0, 0, 0, 0],
  ])('scores completed=%i first=%i time=%i as %i', (e, f, t, total) => {
    const objectives = [
      { id: 'first', weight: f, completed: true, firstCorrect: true, usedHint: false },
      { id: 'corrected', weight: e - f, completed: true, firstCorrect: false, usedHint: false },
      { id: 'open', weight: 1000 - e, completed: false, firstCorrect: false, usedHint: false },
    ].filter((o) => o.weight > 0);
    expect(calculateArcadeScore(objectives, t, 360000).total).toBe(total);
  });
  it('rejects invalid weights and impossible first-correct progress', () => {
    expect(() =>
      calculateArcadeScore(
        [{ id: 'a', weight: 999, completed: true, firstCorrect: true, usedHint: false }],
        0,
        360000,
      ),
    ).toThrow();
    expect(() =>
      calculateArcadeScore(
        [{ id: 'a', weight: 1000, completed: false, firstCorrect: true, usedHint: false }],
        0,
        360000,
      ),
    ).toThrow();
    expect(() =>
      calculateArcadeScore(
        [{ id: 'a', weight: 1000, completed: true, firstCorrect: true, usedHint: true }],
        0,
        360000,
      ),
    ).toThrow();
    expect(() =>
      calculateArcadeScore(
        [{ id: 'a', weight: 1000, completed: true, firstCorrect: true, usedHint: false }],
        NaN,
        360000,
      ),
    ).toThrow();
  });
  it('awards exact weighted boundaries without binary-float floor loss', () => {
    expect(
      calculateArcadeScore(
        [
          { id: 'done', weight: 90, completed: true, firstCorrect: true, usedHint: false },
          { id: 'open', weight: 910, completed: false, firstCorrect: false, usedHint: false },
        ],
        360000,
        360000,
      ),
    ).toEqual({ progress: 63, quality: 18, efficiency: 0, total: 81 });
  });
  it('uses every ordered identity component in comparison keys', () => {
    expect(createComparisonKey(config())).toBe(
      '["history-lab","SA1-R07-7K2M4C-G","guided","science-arcade-content-1","science-arcade-score-1",360000]',
    );
    for (const changed of [
      { activityId: 'sensor-lab' },
      { challengeCode: 'SA1-R08-7K2M4C-G' },
      { profile: 'standard' },
      { contentVersion: 'science-arcade-content-2' },
      { scoringVersion: 'science-arcade-score-2' },
      { durationMs: null },
    ]) {
      expect(createComparisonKey({ ...config(), ...changed } as ReturnType<typeof config>)).not.toBe(
        createComparisonKey(config()),
      );
    }
  });
});
describe('published challenge determinism', () => {
  it('normalizes the strict code grammar and retains the published seed', () => {
    expect(parseChallengeCode('  sa1-r07-7k2m4c-g ')).toEqual({
      code: 'SA1-R07-7K2M4C-G',
      round: 'R07',
      seed: '7K2M4C',
      profile: 'guided',
    });
    for (const invalid of [
      'SA2-R07-7K2M4C-G',
      'SA1-R7-7K2M4C-G',
      'SA1-R07-7K2M4I-G',
      'SA1-R07-7K2M4C-X',
      'SA1-R07-7K2M4C-G-extra',
      'SA1-R07-7K2M4C-G\nX',
    ])
      expect(parseChallengeCode(invalid)).toBeNull();
  });
  it('matches independent FNV and Mulberry golden vectors', () => {
    // FNV-1a reference constants and Mulberry32 unsigned arithmetic, independently calculated.
    expect(fnv1a32('')).toBe(2166136261);
    expect(fnv1a32('hello')).toBe(1335831723);
    const random = mulberry32(1);
    expect([random(), random(), random()]).toEqual([
      0.6270739405881613, 0.002735721180215478, 0.5274470399599522,
    ]);
    const a = createActivityRandom('7K2M4C', 'history-lab');
    const b = createActivityRandom('7K2M4C', 'history-lab');
    const c = createActivityRandom('7K2M4C', 'sensor-lab');
    const values = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(values);
    expect([c(), c(), c()]).not.toEqual(values);
  });
  it.each([
    ['history-lab', 1986835019, [0.9869716244284064, 0.33335670665837824, 0.949005582369864]],
    ['structure-lab', 1472122026, [0.4445609140675515, 0.4707965129055083, 0.3719313167966902]],
    ['sensor-lab', 1056434251, [0.12573149939998984, 0.8231240271124989, 0.94091931800358]],
  ] as const)('fixes the independently computed %s substream', (activity, seed, values) => {
    expect(fnv1a32(`7K2M4C:${activity}`)).toBe(seed);
    const random = createActivityRandom('7K2M4C', activity);
    expect([random(), random(), random()]).toEqual(values);
  });
  it('rejects invalid seed identity and duplicate weighted objectives', () => {
    expect(() => createActivityRandom('7K2M4I', 'history-lab')).toThrow();
    expect(() =>
      calculateArcadeScore(
        [
          { id: 'a', weight: 500, completed: false, firstCorrect: false, usedHint: false },
          { id: 'a', weight: 500, completed: false, firstCorrect: false, usedHint: false },
        ],
        0,
        360000,
      ),
    ).toThrow();
    expect(() =>
      calculateArcadeScore(
        [{ id: 'a', weight: 1000, completed: false, firstCorrect: false, usedHint: false }],
        0,
        180000,
      ),
    ).toThrow();
  });
});

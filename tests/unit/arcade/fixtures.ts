import type { ArcadeRunConfig, ArcadeDraft, ArcadeResult } from '../../../src/shared/arcade/types';

export function config(overrides: Partial<ArcadeRunConfig> = {}): ArcadeRunConfig {
  return {
    activityId: 'history-lab',
    mode: 'contest',
    profile: 'guided',
    challengeCode: 'SA1-R07-7K2M4C-G',
    contentVersion: 'science-arcade-content-1',
    scoringVersion: 'science-arcade-score-1',
    durationMs: 360000,
    slotId: 'slot-1',
    nickname: '实验员',
    objectives: [
      { id: 'a', weight: 200 },
      { id: 'b', weight: 400 },
      { id: 'c', weight: 400 },
    ],
    ...overrides,
  };
}
export function draft(runId = 'run-1', overrides: Partial<ArcadeDraft> = {}): ArcadeDraft {
  const c = config();
  return {
    runId,
    slotId: c.slotId,
    comparisonKey: JSON.stringify([
      c.activityId,
      c.challengeCode,
      c.profile,
      c.contentVersion,
      c.scoringVersion,
      c.durationMs,
    ]),
    config: c,
    objectives: c.objectives.map((o) => ({ ...o, completed: false, firstCorrect: false, usedHint: false })),
    elapsedMs: 0,
    startedEpochMs: 1000000,
    savedEpochMs: 1000000,
    ...overrides,
  };
}
export function result(runId = 'run-1', overrides: Partial<ArcadeResult> = {}): ArcadeResult {
  const d = draft(runId);
  return {
    runId,
    config: d.config,
    status: 'timeout',
    eligible: true,
    elapsedMs: 360000,
    objectives: d.objectives,
    score: { progress: 0, quality: 0, efficiency: 0, total: 0 },
    createdEpochMs: 1360000,
    ...overrides,
  };
}
export class MemoryStorage implements Storage {
  data = new Map<string, string>();
  writes = 0;
  failure: string | null = null;
  get length() {
    return this.data.size;
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null;
  }
  getItem(key: string) {
    if (this.failure === 'SecurityError') throw new DOMException('disabled', 'SecurityError');
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.failure) throw new DOMException('unavailable', this.failure);
    this.writes++;
    this.data.set(key, value);
  }
  removeItem(key: string) {
    if (this.failure) throw new DOMException('unavailable', this.failure);
    this.data.delete(key);
  }
  clear() {
    throw new Error('arcade must never clear the origin');
  }
}

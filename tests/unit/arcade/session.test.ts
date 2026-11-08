import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createArcadeSession } from '../../../src/shared/arcade/session';
import { createArcadeRepository } from '../../../src/shared/arcade/storage';
import type { ArcadeSession, ArcadeSnapshot } from '../../../src/shared/arcade/types';
import { config, draft, MemoryStorage } from './fixtures';

describe('atomic session admissions and monotonic lifecycle', () => {
  let time: number;
  let session: ArcadeSession;
  let snapshots: ArcadeSnapshot[];
  beforeEach(() => {
    vi.useFakeTimers();
    time = 0;
    snapshots = [];
    const repository = createArcadeRepository({ storage: null, nowEpochMs: () => 1000000 });
    session = createArcadeSession({ clock: { nowMs: () => time }, repository });
    session.subscribe((s) => snapshots.push(s));
  });
  afterEach(() => {
    session.dispose();
    vi.useRealTimers();
  });
  const fact = (
    objectiveId: string,
    revision: number,
    verdict: 'correct' | 'incorrect' = 'correct',
    usedHint = false,
  ) => ({ objectiveId, revision, verdict, usedHint });
  const latest = () => snapshots.at(-1)!;
  const flush = async () => {
    await Promise.resolve();
  };
  it('subscribes immediately but defers the final success notification past record return', async () => {
    expect(latest().phase).toBe('idle');
    expect(session.start(config()).ok).toBe(true);
    await flush();
    time = 180000;
    expect(session.record([fact('a', 0), fact('b', 0), fact('c', 0)])).toBe(true);
    expect(latest().phase).toBe('running');
    await flush();
    expect(latest().result?.score?.total).toBe(1000);
    expect(session.record([])).toBe(false);
    expect(session.finish('timeout')).toEqual(latest().result);
  });
  it('locks first-wrong and hint penalties, ignores stale revisions, and freezes completed objectives', async () => {
    session.start(config());
    expect(session.record([fact('a', 3, 'incorrect')])).toBe(true);
    expect(session.record([fact('a', 3)])).toBe(true);
    expect(session.record([fact('a', 2)])).toBe(true);
    await flush();
    expect(latest().objectives[0].completed).toBe(false);
    expect(session.record([fact('a', 4), fact('b', 0, 'correct', true)])).toBe(true);
    expect(session.record([fact('a', 5, 'incorrect', true), fact('b', 1)])).toBe(true);
    time = 270000;
    session.record([fact('c', 0)]);
    await flush();
    expect(latest().result?.score).toEqual({ progress: 700, quality: 80, efficiency: 50, total: 830 });
    expect(latest().objectives[0]).toEqual({
      id: 'a',
      weight: 200,
      completed: true,
      firstCorrect: false,
      usedHint: false,
    });
    expect(latest().objectives[1].usedHint).toBe(true);
  });
  it('rejects a whole invalid transaction without consuming any revision', async () => {
    session.start(config());
    expect(session.record([fact('a', 0), fact('unknown', 0)])).toBe(false);
    expect(session.record([fact('a', 0), fact('a', 1)])).toBe(false);
    expect(session.record([fact('a', -1)])).toBe(false);
    expect(session.record([fact('a', 0), fact('b', 0)])).toBe(true);
    await flush();
    expect(latest().objectives.filter((o) => o.completed)).toHaveLength(2);
    expect(latest().objectives.filter((o) => o.firstCorrect)).toHaveLength(2);
  });
  it('guards empty edits and settles the hidden deadline before input at equality', async () => {
    session.start(config());
    session.setActive(false);
    expect(session.record([])).toBe(false);
    time = 360000;
    session.setActive(true);
    expect(session.record([fact('a', 0)])).toBe(false);
    await flush();
    expect(latest().result?.status).toBe('timeout');
    expect(latest().result?.elapsedMs).toBe(360000);
    expect(latest().result?.score?.total).toBe(0);
  });
  it('protects elapsed time from a backwards injected clock', async () => {
    session.start(config());
    time = 100000;
    session.record([]);
    time = 50000;
    session.record([]);
    await flush();
    expect(latest().elapsedMs).toBe(100000);
  });
  it('owns a timer that times out without animation and cancels it on disposal', async () => {
    session.start(config());
    time = 360000;
    vi.advanceTimersByTime(250);
    await flush();
    expect(latest().result?.status).toBe('timeout');
    expect(vi.getTimerCount()).toBe(0);
    session.start(config({ mode: 'practice', durationMs: null }));
    session.dispose();
    await flush();
    expect(latest().result?.status).toBe('interrupted');
    expect(vi.getTimerCount()).toBe(0);
  });
  it('records practice with null score/time and restarts with clean progress and revisions', async () => {
    session.start(config({ mode: 'practice', durationMs: null }));
    session.record([fact('a', 9)]);
    const first = session.finish('abandoned');
    expect(first?.score).toBeNull();
    expect(first?.elapsedMs).toBeNull();
    expect(first?.eligible).toBe(false);
    expect(session.start(config({ mode: 'practice', durationMs: null })).ok).toBe(true);
    session.record([fact('a', 0), fact('b', 0), fact('c', 0)]);
    await flush();
    expect(latest().result?.status).toBe('completed');
    expect(latest().result?.score).toBeNull();
  });
  it('snapshots config and returns independent result/snapshot copies', async () => {
    const c = config();
    session.start(c);
    c.objectives[0].weight = 999;
    c.nickname = 'changed';
    await flush();
    latest().objectives[0].completed = true;
    latest().config!.nickname = 'mutated';
    session.record([fact('a', 0)]);
    await flush();
    expect(latest().config?.nickname).toBe('实验员');
    expect(latest().objectives[0].weight).toBe(200);
    const ended = session.finish('abandoned')!;
    ended.config.nickname = 'another';
    await flush();
    expect(latest().result?.config.nickname).toBe('实验员');
  });
  it('rejects profile/code, weight, duration and version mismatches', () => {
    for (const bad of [
      config({ profile: 'standard' }),
      config({ durationMs: null }),
      config({ mode: 'practice' }),
      config({ contentVersion: 'bogus' }),
      config({
        objectives: [
          { id: 'a', weight: 1000 },
          { id: 'a', weight: 1 },
        ],
      }),
    ])
      expect(session.start(bad)).toEqual({ ok: false, reason: 'invalid-config' });
  });
  it('interrupts when another repository explicitly removes ownership', async () => {
    const storage = new MemoryStorage();
    const events = new EventTarget();
    const a = createArcadeRepository({ storage, eventTarget: events, nowEpochMs: () => 1000000 });
    const b = createArcadeRepository({ storage, eventTarget: events, nowEpochMs: () => 1000000 });
    session.dispose();
    session = createArcadeSession({ repository: a, clock: { nowMs: () => time } });
    snapshots = [];
    session.subscribe((s) => snapshots.push(s));
    session.start(config());
    b.clearRecords();
    const event = new Event('storage');
    Object.assign(event, { key: 'science-arcade:local:v1' });
    events.dispatchEvent(event);
    await flush();
    await flush();
    expect(latest().result?.status).toBe('interrupted');
    expect(b.read().store.results).toHaveLength(0);
    a.dispose();
    b.dispose();
  });
  it('does not claim a saved completion when ownership changes between admission and save', async () => {
    class RacingStorage extends MemoryStorage {
      replacement: string | null = null;
      readsUntilReplacement = 0;
      override getItem(key: string) {
        if (this.replacement && --this.readsUntilReplacement === 0) {
          this.data.set(key, this.replacement);
          this.replacement = null;
        }
        return super.getItem(key);
      }
    }
    const storage = new RacingStorage(),
      repository = createArcadeRepository({ storage, nowEpochMs: () => 1000000 });
    session.dispose();
    session = createArcadeSession({ repository, clock: { nowMs: () => time }, nowEpochMs: () => 1000000 });
    snapshots = [];
    session.subscribe((s) => snapshots.push(s));
    session.start(config());
    await flush();
    const raw = JSON.parse(storage.getItem('science-arcade:local:v1')!);
    const next = draft('other-run');
    next.config.challengeCode = 'SA1-R08-7K2M4C-G';
    next.comparisonKey =
      '["history-lab","SA1-R08-7K2M4C-G","guided","science-arcade-content-1","science-arcade-score-1",360000]';
    raw.activeDraft = next;
    raw.contestLocks.push({
      slotId: next.slotId,
      comparisonKey: next.comparisonKey,
      runId: next.runId,
      createdEpochMs: 1000000,
    });
    storage.replacement = JSON.stringify(raw);
    storage.readsUntilReplacement = 2;
    expect(session.record([fact('a', 0), fact('b', 0), fact('c', 0)])).toBe(true);
    await flush();
    expect(latest().result?.status).toBe('interrupted');
    expect(latest().result?.score).toBeNull();
    expect(repository.read().store.activeDraft?.runId).toBe('other-run');
    expect(repository.read().store.results).toHaveLength(0);
    repository.dispose();
  });
  it('keeps the first contest lock after disposal and never writes a second terminal result', async () => {
    const repository = createArcadeRepository({ storage: null });
    session.dispose();
    session = createArcadeSession({ repository, clock: { nowMs: () => time } });
    session.start(config());
    time = 45000;
    session.dispose();
    session.dispose();
    await flush();
    expect(repository.read().store.results).toHaveLength(1);
    expect(repository.read().store.results[0].status).toBe('interrupted');
    expect(repository.read().store.results[0].score).toBeNull();
    expect(repository.read().store.contestLocks).toHaveLength(1);
    expect(repository.read().store.activeDraft).toBeNull();
    repository.dispose();
  });
  it('allows practice while another local contest is active', () => {
    const repository = createArcadeRepository({ storage: null });
    repository.begin(draft('other-run'));
    session.dispose();
    session = createArcadeSession({ repository, clock: { nowMs: () => time } });
    expect(session.start(config({ mode: 'practice', durationMs: null })).ok).toBe(true);
    expect(session.record([])).toBe(true);
    session.finish('abandoned');
    expect(repository.read().store.activeDraft?.runId).toBe('other-run');
    repository.dispose();
  });
});

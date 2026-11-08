import { describe, expect, it } from 'vitest';
import {
  createArcadeRepository,
  recoverInterruptedArcadeDraft,
  ARCADE_STORAGE_KEY,
} from '../../../src/shared/arcade/storage';
import { config, draft, result, MemoryStorage } from './fixtures';

describe('scoped, resilient local arcade repository', () => {
  const setup = () => {
    const storage = new MemoryStorage();
    let date = 1000000;
    const repo = createArcadeRepository({ storage, nowEpochMs: () => date });
    return { storage, repo, date: (n: number) => (date = n) };
  };
  it('defaults to anonymous and muted, sanitizes nickname, and changes player identity only on next-player', () => {
    const { repo } = setup();
    const initial = repo.read().store.preferences;
    expect(initial.nickname).toBe('实验员');
    expect(initial.soundEnabled).toBe(false);
    repo.updatePreferences({ nickname: ' \u0000😀😀😀😀😀😀😀😀😀😀😀😀😀 ' });
    expect(repo.read().store.preferences.nickname).toBe('😀'.repeat(12));
    expect(repo.read().store.preferences.slotId).toBe(initial.slotId);
    repo.createPlayerSlot('小车');
    expect(repo.read().store.preferences.slotId).not.toBe(initial.slotId);
  });
  it('begins atomically, reads without recovery, and requires the exact active run ID to recover once', () => {
    const { storage, repo } = setup();
    expect(repo.begin(draft())).toEqual({ ok: true, runId: 'run-1' });
    const b = createArcadeRepository({ storage, nowEpochMs: () => 1000010 });
    expect(b.read().store.activeDraft?.config).toEqual(config());
    expect(b.read().store.results).toHaveLength(0);
    expect(b.begin(draft('run-2'))).toEqual({ ok: false, reason: 'other-run-active' });
    expect(recoverInterruptedArcadeDraft(b, 'different')).toBeNull();
    const ended = recoverInterruptedArcadeDraft(b, 'run-1');
    expect(ended?.status).toBe('interrupted');
    expect(ended?.score).toBeNull();
    expect(ended?.eligible).toBe(false);
    expect(recoverInterruptedArcadeDraft(b, 'run-1')).toBeNull();
    expect(b.read().store.contestLocks).toHaveLength(1);
    expect(b.begin(draft('run-3'))).toEqual({ ok: false, reason: 'attempt-used' });
  });
  it('retains first-attempt locks after rename and result deletion but allows a fresh slot', () => {
    const { repo } = setup();
    repo.begin(draft());
    repo.save(result());
    repo.deleteResult('run-1');
    repo.updatePreferences({ nickname: 'changed' });
    expect(repo.begin(draft('run-2'))).toEqual({ ok: false, reason: 'attempt-used' });
    const preferences = repo.createPlayerSlot();
    const d = draft('run-3');
    d.slotId = preferences.slotId;
    d.config.slotId = preferences.slotId;
    expect(repo.begin(d).ok).toBe(true);
  });
  it('checkpoints no more often than 5 seconds and preserves the complete latest domain summary', () => {
    const { repo, storage, date } = setup();
    repo.begin(draft());
    const writes = storage.writes;
    const d = draft();
    d.elapsedMs = 4000;
    d.savedEpochMs = 1004000;
    date(1004000);
    repo.checkpoint(d);
    expect(storage.writes).toBe(writes);
    d.elapsedMs = 5000;
    d.savedEpochMs = 1005000;
    d.objectives[0].completed = true;
    date(1005000);
    repo.checkpoint(d);
    expect(storage.writes).toBe(writes + 1);
    expect(JSON.parse(storage.getItem(ARCADE_STORAGE_KEY)!).activeDraft.objectives[0].completed).toBe(true);
  });
  it('keeps the last valid stored text on quota failure and allows honest in-memory play', () => {
    const { repo, storage } = setup();
    repo.updatePreferences({ nickname: 'saved' });
    const raw = storage.getItem(ARCADE_STORAGE_KEY);
    storage.failure = 'QuotaExceededError';
    expect(repo.begin(draft()).ok).toBe(true);
    repo.save(result());
    expect(repo.read().persistence).toBe('memory-only');
    expect(repo.read().store.results).toHaveLength(1);
    storage.failure = null;
    expect(storage.getItem(ARCADE_STORAGE_KEY)).toBe(raw);
    const denied = new MemoryStorage();
    denied.failure = 'SecurityError';
    const disabled = createArcadeRepository({ storage: denied });
    expect(disabled.begin(draft()).ok).toBe(true);
    expect(disabled.read().persistence).toBe('memory-only');
  });
  it.each(['{bad json', JSON.stringify({ schemaVersion: 2, dataVersion: 'science-arcade-2' })])(
    'preserves protected raw input until explicit clear: %s',
    (raw) => {
      const storage = new MemoryStorage();
      storage.setItem(ARCADE_STORAGE_KEY, raw);
      const repo = createArcadeRepository({ storage });
      expect(repo.read().persistence).toBe(
        raw[0] === '{' && raw.includes('schemaVersion') ? 'read-only' : 'memory-only',
      );
      repo.updatePreferences({ nickname: 'temp' });
      repo.begin(draft());
      repo.save(result());
      expect(storage.getItem(ARCADE_STORAGE_KEY)).toBe(raw);
      repo.clearRecords();
      expect(storage.getItem(ARCADE_STORAGE_KEY)).not.toBe(raw);
    },
  );
  it('drops a forged current score while retaining its valid first-attempt lock and other records', () => {
    const { repo, storage } = setup();
    repo.begin(draft());
    repo.save(result());
    const raw = JSON.parse(storage.getItem(ARCADE_STORAGE_KEY)!);
    raw.results[0].score.total = 999;
    storage.setItem(ARCADE_STORAGE_KEY, JSON.stringify(raw));
    const loaded = createArcadeRepository({ storage });
    expect(loaded.read().store.results).toHaveLength(0);
    expect(loaded.read().droppedResults).toBe(1);
    expect(loaded.read().store.contestLocks).toHaveLength(1);
  });
  it('strips unknown free text and defends authoritative reads from caller mutation', () => {
    const { repo, storage } = setup();
    const d = draft();
    Object.assign(d.config, { futureReason: 'private prose' });
    Object.assign(d, { notes: 'private' });
    repo.begin(d);
    expect(storage.getItem(ARCADE_STORAGE_KEY)).not.toContain('private');
    const snapshot = repo.read();
    snapshot.store.contestLocks.length = 0;
    expect(repo.read().store.contestLocks).toHaveLength(1);
  });
  it('clears only the arcade key, keeps preferences on clear, and restores defaults on reset', () => {
    const { repo, storage } = setup();
    storage.setItem('other-product', 'keep');
    repo.updatePreferences({ nickname: '小车', soundEnabled: true });
    repo.begin(draft());
    repo.clearRecords();
    expect(repo.read().store.activeDraft).toBeNull();
    expect(repo.read().store.contestLocks).toHaveLength(0);
    expect(repo.read().store.preferences.nickname).toBe('小车');
    repo.reset();
    expect(repo.read().store.preferences.nickname).toBe('实验员');
    expect(repo.read().store.preferences.soundEnabled).toBe(false);
    expect(storage.getItem('other-product')).toBe('keep');
  });
  it('refuses unexpired lock capacity, expires after 30 days, and protects against date rollback', () => {
    const { repo, storage, date } = setup();
    repo.updatePreferences({ nickname: 'x' });
    const raw = JSON.parse(storage.getItem(ARCADE_STORAGE_KEY)!);
    raw.contestLocks = Array.from({ length: 200 }, (_, i) => ({
      slotId: 's' + i,
      comparisonKey: draft().comparisonKey,
      runId: 'r' + i,
      createdEpochMs: 1000000,
    }));
    storage.setItem(ARCADE_STORAGE_KEY, JSON.stringify(raw));
    const loaded = createArcadeRepository({ storage, nowEpochMs: () => 1000000 });
    expect(loaded.begin(draft())).toEqual({ ok: false, reason: 'capacity-full' });
    const rollback = createArcadeRepository({ storage, nowEpochMs: () => 1 });
    expect(rollback.begin(draft())).toEqual({ ok: false, reason: 'capacity-full' });
    date(1000000 + 31 * 86400000);
    expect(repo.begin(draft()).ok).toBe(true);
    expect(repo.read().store.contestLocks).toHaveLength(1);
  });
  it('reports cross-instance changes and detaches storage listeners on disposal', async () => {
    const storage = new MemoryStorage(),
      events = new EventTarget();
    const a = createArcadeRepository({ storage, eventTarget: events }),
      b = createArcadeRepository({ storage, eventTarget: events });
    const names: string[] = [];
    a.subscribe((s) => names.push(s.store.preferences.nickname));
    await Promise.resolve();
    b.updatePreferences({ nickname: '观察员' });
    const event = new Event('storage');
    Object.assign(event, { key: ARCADE_STORAGE_KEY });
    events.dispatchEvent(event);
    await Promise.resolve();
    expect(names.at(-1)).toBe('观察员');
    const count = names.length;
    a.dispose();
    b.updatePreferences({ nickname: '下一位' });
    events.dispatchEvent(event);
    await Promise.resolve();
    expect(names).toHaveLength(count);
    b.dispose();
  });
  it('keeps at most 200 newest practice records without erasing formal locks', () => {
    const { repo } = setup();
    repo.begin(draft());
    repo.save(result());
    for (let i = 0; i < 201; i++)
      repo.save(
        result('p' + i, {
          config: config({ mode: 'practice', durationMs: null }),
          status: 'abandoned',
          eligible: false,
          elapsedMs: null,
          score: null,
          createdEpochMs: 1400000 + i,
        }),
      );
    const store = repo.read().store;
    expect(store.results).toHaveLength(200);
    expect(store.results[0].runId).toBe('p1');
    expect(store.results.at(-1)?.runId).toBe('p200');
    expect(store.contestLocks).toHaveLength(1);
  });
  it.each([
    (raw: any) => (raw.revision = -1),
    (raw: any) => (raw.preferences.soundEnabled = 'yes'),
    (raw: any) => (raw.contestLocks[0].comparisonKey = '[]'),
    (raw: any) => (raw.activeDraft.slotId = 'different'),
    (raw: any) => (raw.activeDraft.objectives[0].firstCorrect = true),
  ])('preserves invalid top-level invariants instead of partially overwriting them', (corrupt) => {
    const { repo, storage } = setup();
    repo.begin(draft());
    const raw = JSON.parse(storage.getItem(ARCADE_STORAGE_KEY)!);
    corrupt(raw);
    const text = JSON.stringify(raw);
    storage.setItem(ARCADE_STORAGE_KEY, text);
    const loaded = createArcadeRepository({ storage });
    expect(loaded.read().issue).toBe('corrupt-data');
    loaded.updatePreferences({ nickname: 'safe' });
    expect(storage.getItem(ARCADE_STORAGE_KEY)).toBe(text);
  });
  it('rejects a completed score at the exact deadline because timeout has priority', () => {
    const { repo } = setup();
    repo.begin(draft());
    const d = draft();
    expect(
      repo.save(
        result('run-1', {
          status: 'completed',
          objectives: d.objectives.map((o) => ({ ...o, completed: true, firstCorrect: true })),
          score: { progress: 700, quality: 200, efficiency: 0, total: 900 },
        }),
      ),
    ).toBe(false);
    expect(repo.read().store.activeDraft?.runId).toBe('run-1');
  });
  it('retains valid version labels in historical records without reclassifying their identity', () => {
    const { repo, storage } = setup();
    repo.begin(draft());
    repo.save(result());
    const raw = JSON.parse(storage.getItem(ARCADE_STORAGE_KEY)!);
    raw.results[0].config.contentVersion = 'science-arcade-content-2';
    raw.results[0].config.scoringVersion = 'science-arcade-score-2';
    raw.contestLocks[0].comparisonKey =
      '["history-lab","SA1-R07-7K2M4C-G","guided","science-arcade-content-2","science-arcade-score-2",360000]';
    storage.setItem(ARCADE_STORAGE_KEY, JSON.stringify(raw));
    const loaded = createArcadeRepository({ storage });
    expect(loaded.read().store.results[0].config.scoringVersion).toBe('science-arcade-score-2');
    expect(loaded.read().store.results[0].config.contentVersion).toBe('science-arcade-content-2');
  });
  it('rejects reuse of a retained run ID under a different contest identity', () => {
    const { repo } = setup();
    repo.begin(draft());
    repo.save(result());
    repo.deleteResult('run-1');
    const next = draft('run-1');
    next.slotId = 'next-slot';
    next.config.slotId = 'next-slot';
    expect(repo.begin(next)).toEqual({ ok: false, reason: 'invalid-config' });
  });
  it('cannot remove a checkpointed hint penalty by replacing an incomplete objective', () => {
    const { repo } = setup();
    repo.begin(draft());
    const hinted = draft();
    hinted.elapsedMs = 5000;
    hinted.savedEpochMs = 1005000;
    hinted.objectives[0].usedHint = true;
    expect(repo.checkpoint(hinted)).toBe(true);
    const changed = draft();
    changed.elapsedMs = 6000;
    changed.savedEpochMs = 1006000;
    expect(repo.checkpoint(changed)).toBe(false);
    expect(
      repo.save(
        result('run-1', {
          objectives: draft().objectives.map((o) =>
            o.id === 'a' ? { ...o, completed: true, firstCorrect: true } : o,
          ),
          score: { progress: 140, quality: 40, efficiency: 0, total: 180 },
        }),
      ),
    ).toBe(false);
    expect(repo.read().store.activeDraft?.objectives[0].usedHint).toBe(true);
  });
});

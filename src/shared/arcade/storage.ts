import {
  ARCADE_CHECKPOINT_MS,
  ARCADE_DATA_VERSION,
  ARCADE_RECORD_LIMIT,
  ARCADE_RETENTION_MS,
  ARCADE_STORAGE_KEY,
} from './constants';
import type {
  ArcadeRepository,
  ArcadeDraft,
  ArcadeRepositorySnapshot,
  ArcadeResult,
  ArcadeLocalStoreV1,
  ArcadePreferences,
  RepositoryIssue,
  Persistence,
} from './types';
import { clone, createArcadeId, parseConfig, sanitizeNickname } from './validation';
import { parseDraft, parseResult, parseStore } from './store-parser';
import { createComparisonKey } from './scoring';
import { parseChallengeCode } from './challenge-code';
export { ARCADE_STORAGE_KEY } from './constants';
export interface ArcadeRepositoryOptions {
  storage?: Storage | null;
  nowEpochMs?: () => number;
  eventTarget?: EventTarget | null;
  createId?: () => string;
}
export function createArcadeRepository(options: ArcadeRepositoryOptions = {}): ArcadeRepository {
  const now = options.nowEpochMs ?? Date.now;
  const id = options.createId ?? createArcadeId;
  let storage: Storage | null = null;
  try {
    storage =
      options.storage === undefined
        ? typeof window === 'undefined'
          ? null
          : window.localStorage
        : options.storage;
  } catch {
    /* disabled browser storage */
  }
  const events =
    options.eventTarget === undefined ? (typeof window === 'undefined' ? null : window) : options.eventTarget;
  const defaults = (): ArcadePreferences => ({
    slotId: id(),
    nickname: '实验员',
    profile: 'guided',
    lastChallengeCode: null,
    soundEnabled: false,
  });
  const empty = (): ArcadeLocalStoreV1 => ({
    schemaVersion: 1,
    dataVersion: ARCADE_DATA_VERSION,
    revision: 0,
    preferences: defaults(),
    activeDraft: null,
    contestLocks: [],
    results: [],
  });
  let store = empty(),
    persistence: Persistence = storage ? 'saved' : 'memory-only';
  let issue: RepositoryIssue = storage ? null : 'storage-unavailable',
    droppedResults = 0;
  let protectedRaw = false,
    lastSeen: string | null | undefined,
    disposed = false,
    pending = false;
  let checkpointElapsed = 0;
  const listeners = new Set<(snapshot: ArcadeRepositorySnapshot) => void>();
  const snapshot = (): ArcadeRepositorySnapshot => clone({ store, persistence, issue, droppedResults });
  function notify() {
    if (pending || disposed) return;
    pending = true;
    queueMicrotask(() => {
      pending = false;
      if (!disposed) for (const listener of [...listeners]) listener(snapshot());
    });
  }
  function refresh() {
    if (disposed || !storage) return;
    let raw: string | null;
    try {
      raw = storage.getItem(ARCADE_STORAGE_KEY);
    } catch {
      persistence = 'memory-only';
      if (!protectedRaw) issue = 'storage-unavailable';
      return;
    }
    if (raw === lastSeen) return;
    lastSeen = raw;
    if (raw === null) {
      store = empty();
      protectedRaw = false;
      persistence = 'saved';
      issue = null;
      droppedResults = 0;
      checkpointElapsed = 0;
      notify();
      return;
    }
    try {
      const decoded: unknown = JSON.parse(raw);
      if (
        decoded &&
        typeof decoded === 'object' &&
        'schemaVersion' in decoded &&
        typeof decoded.schemaVersion === 'number' &&
        decoded.schemaVersion > 1
      ) {
        store = empty();
        protectedRaw = true;
        persistence = 'read-only';
        issue = 'future-schema';
        droppedResults = 0;
      } else {
        const parsed = parseStore(decoded);
        store = parsed.store;
        droppedResults = parsed.droppedResults;
        protectedRaw = false;
        persistence = 'saved';
        issue = droppedResults ? 'invalid-results' : null;
      }
    } catch {
      store = empty();
      protectedRaw = true;
      persistence = 'memory-only';
      issue = 'corrupt-data';
      droppedResults = 0;
    }
    checkpointElapsed = store.activeDraft?.elapsedMs ?? 0;
    notify();
  }
  function epoch(): number {
    const value = now();
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }
  function prune() {
    const date = epoch();
    const newest = Math.max(
      0,
      ...store.results.map((r) => r.createdEpochMs),
      ...store.contestLocks.map((l) => l.createdEpochMs),
      store.activeDraft?.savedEpochMs ?? 0,
    );
    if (date >= newest) {
      const cutoff = date - ARCADE_RETENTION_MS;
      store.contestLocks = store.contestLocks.filter(
        (l) => l.createdEpochMs >= cutoff || l.runId === store.activeDraft?.runId,
      );
      const lockRuns = new Set(store.contestLocks.map((l) => l.runId));
      store.results = store.results.filter(
        (r) => r.createdEpochMs >= cutoff && (r.config.mode === 'practice' || lockRuns.has(r.runId)),
      );
    }
    if (store.results.length > ARCADE_RECORD_LIMIT) {
      store.results = store.results
        .map((r, i) => ({ r, i }))
        .sort((a, b) => b.r.createdEpochMs - a.r.createdEpochMs || b.i - a.i)
        .slice(0, ARCADE_RECORD_LIMIT)
        .sort((a, b) => a.i - b.i)
        .map(({ r }) => r);
    }
  }
  function persist(explicit = false) {
    if (disposed) return;
    store.revision++;
    if (explicit) {
      protectedRaw = false;
      droppedResults = 0;
      issue = null;
    }
    if (!protectedRaw) {
      if (storage) {
        try {
          const raw = JSON.stringify(store);
          storage.setItem(ARCADE_STORAGE_KEY, raw);
          lastSeen = raw;
          persistence = 'saved';
          issue = droppedResults ? 'invalid-results' : null;
        } catch {
          persistence = 'memory-only';
          issue = 'write-failed';
        }
      } else {
        persistence = 'memory-only';
        issue = 'storage-unavailable';
      }
    }
    notify();
  }
  function compatibleDraft(next: ArcadeDraft, previous: ArcadeDraft): boolean {
    if (
      next.runId !== previous.runId ||
      next.startedEpochMs !== previous.startedEpochMs ||
      JSON.stringify(next.config) !== JSON.stringify(previous.config) ||
      next.elapsedMs < previous.elapsedMs ||
      next.savedEpochMs < previous.savedEpochMs
    )
      return false;
    return previous.objectives.every(
      (p, i) =>
        (!p.usedHint || next.objectives[i].usedHint) &&
        (!p.completed || JSON.stringify(p) === JSON.stringify(next.objectives[i])),
    );
  }
  const repository: ArcadeRepository = {
    read() {
      refresh();
      return snapshot();
    },
    begin(value) {
      refresh();
      if (disposed) return { ok: false, reason: 'invalid-config' };
      let draft: ArcadeDraft;
      try {
        draft = parseDraft(value);
        parseConfig(draft.config, true);
      } catch {
        return { ok: false, reason: 'invalid-config' };
      }
      if (
        draft.elapsedMs !== 0 ||
        draft.objectives.some((o) => o.completed || o.firstCorrect || o.usedHint) ||
        store.results.some((r) => r.runId === draft.runId)
      )
        return { ok: false, reason: 'invalid-config' };
      if (store.activeDraft) return { ok: false, reason: 'other-run-active' };
      prune();
      if (store.contestLocks.some((l) => l.runId === draft.runId))
        return { ok: false, reason: 'invalid-config' };
      if (
        store.contestLocks.some((l) => l.slotId === draft.slotId && l.comparisonKey === draft.comparisonKey)
      )
        return { ok: false, reason: 'attempt-used' };
      if (store.contestLocks.length >= ARCADE_RECORD_LIMIT) return { ok: false, reason: 'capacity-full' };
      store.contestLocks.push({
        slotId: draft.slotId,
        comparisonKey: draft.comparisonKey,
        runId: draft.runId,
        createdEpochMs: draft.startedEpochMs,
      });
      store.activeDraft = draft;
      checkpointElapsed = 0;
      persist();
      return { ok: true, runId: draft.runId };
    },
    checkpoint(value) {
      refresh();
      if (disposed || !store.activeDraft) return false;
      let draft: ArcadeDraft;
      try {
        draft = parseDraft(value);
      } catch {
        return false;
      }
      if (!compatibleDraft(draft, store.activeDraft)) return false;
      store.activeDraft = draft;
      if (draft.elapsedMs - checkpointElapsed >= ARCADE_CHECKPOINT_MS) {
        checkpointElapsed = draft.elapsedMs;
        persist();
      }
      return true;
    },
    save(value) {
      refresh();
      if (disposed) return false;
      let result: ArcadeResult;
      try {
        result = parseResult(value);
      } catch {
        return false;
      }
      const existing = store.results.find((r) => r.runId === result.runId);
      if (existing) return JSON.stringify(existing) === JSON.stringify(result);
      if (result.config.mode === 'contest') {
        const active = store.activeDraft;
        if (
          !active ||
          active.runId !== result.runId ||
          JSON.stringify(active.config) !== JSON.stringify(result.config) ||
          !store.contestLocks.some(
            (l) =>
              l.runId === result.runId &&
              l.slotId === result.config.slotId &&
              l.comparisonKey === createComparisonKey(result.config),
          )
        )
          return false;
        if (
          result.elapsedMs! < active.elapsedMs ||
          !active.objectives.every(
            (p, i) =>
              (!p.usedHint || result.objectives[i].usedHint) &&
              (!p.completed || JSON.stringify(p) === JSON.stringify(result.objectives[i])),
          )
        )
          return false;
        store.activeDraft = null;
      }
      store.results.push(result);
      prune();
      persist();
      return true;
    },
    updatePreferences(patch) {
      refresh();
      if (disposed) return clone(store.preferences);
      if (typeof patch.nickname === 'string') store.preferences.nickname = sanitizeNickname(patch.nickname);
      if (patch.profile === 'guided' || patch.profile === 'standard')
        store.preferences.profile = patch.profile;
      if (typeof patch.soundEnabled === 'boolean') store.preferences.soundEnabled = patch.soundEnabled;
      if (patch.lastChallengeCode === null) store.preferences.lastChallengeCode = null;
      else if (typeof patch.lastChallengeCode === 'string') {
        const parsed = parseChallengeCode(patch.lastChallengeCode);
        if (parsed) store.preferences.lastChallengeCode = parsed.code;
      }
      prune();
      persist();
      return clone(store.preferences);
    },
    createPlayerSlot(nickname = '实验员') {
      refresh();
      if (disposed) return clone(store.preferences);
      store.preferences = { ...store.preferences, slotId: id(), nickname: sanitizeNickname(nickname) };
      prune();
      persist();
      return clone(store.preferences);
    },
    deleteResult(runId) {
      refresh();
      if (disposed) return false;
      const length = store.results.length;
      store.results = store.results.filter((r) => r.runId !== runId);
      if (store.results.length === length) return false;
      persist();
      return true;
    },
    clearRecords() {
      refresh();
      if (disposed) return;
      store.activeDraft = null;
      store.results = [];
      store.contestLocks = [];
      persist(true);
    },
    reset() {
      refresh();
      if (disposed) return;
      store = empty();
      persist(true);
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(repository.read());
      return () => listeners.delete(listener);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      listeners.clear();
      events?.removeEventListener('storage', onStorage);
    },
  };
  function onStorage(event: Event) {
    const e = event as StorageEvent;
    if (e.key !== null && e.key !== ARCADE_STORAGE_KEY) return;
    if (e.storageArea && e.storageArea !== storage) return;
    refresh();
  }
  refresh();
  events?.addEventListener('storage', onStorage);
  return repository;
}
/** Explicitly ends only the currently observed draft. Reading never invokes this. */
export function recoverInterruptedArcadeDraft(
  repository: ArcadeRepository,
  expectedRunId: string,
): ArcadeResult | null {
  const draft = repository.read().store.activeDraft;
  if (!draft || draft.runId !== expectedRunId) return null;
  const result: ArcadeResult = {
    runId: draft.runId,
    config: draft.config,
    status: 'interrupted',
    eligible: false,
    elapsedMs: draft.elapsedMs,
    objectives: draft.objectives,
    score: null,
    createdEpochMs: draft.savedEpochMs,
  };
  return repository.save(result) ? clone(result) : null;
}

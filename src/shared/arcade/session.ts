import type {
  ArcadeClock,
  ArcadeRepository,
  ArcadeSession,
  ArcadeSnapshot,
  ArcadeResult,
  ArcadeDraft,
  DomainFact,
  FinishReason,
} from './types';
import { ARCADE_DURATION_MS } from './constants';
import { clone, createArcadeId, parseConfig } from './validation';
import { calculateArcadeScore, createComparisonKey } from './scoring';
import { createArcadeRepository } from './storage';
export interface ArcadeSessionOptions {
  clock?: ArcadeClock;
  repository?: ArcadeRepository;
  nowEpochMs?: () => number;
  createId?: () => string;
}
export function createArcadeSession(options: ArcadeSessionOptions = {}): ArcadeSession {
  const clock = options.clock ?? { nowMs: () => performance.now() },
    repository = options.repository ?? createArcadeRepository();
  const epoch = options.nowEpochMs ?? Date.now,
    id = options.createId ?? createArcadeId;
  let snapshot: ArcadeSnapshot = {
    phase: 'idle',
    runId: null,
    config: null,
    elapsedMs: null,
    remainingMs: null,
    objectives: [],
    result: null,
    persistence: repository.read().persistence,
  };
  let active = true,
    disposed = false,
    pending = false,
    startedAt = 0,
    startedEpoch = 0,
    savedEpoch = 0,
    seq = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  const revisions = new Map<string, number>(),
    firstSubmissions = new Set<string>();
  const listeners = new Set<(snapshot: ArcadeSnapshot) => void>();
  function notify() {
    if (pending) return;
    pending = true;
    queueMicrotask(() => {
      pending = false;
      for (const listener of [...listeners]) listener(clone(snapshot));
    });
  }
  function cancelTimer() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }
  function settleClock() {
    if (snapshot.phase !== 'running' || snapshot.config?.mode !== 'contest') return;
    const current = clock.nowMs();
    const elapsed = Math.min(
      ARCADE_DURATION_MS,
      Math.max(snapshot.elapsedMs ?? 0, Number.isFinite(current) ? current - startedAt : 0, 0),
    );
    snapshot.elapsedMs = elapsed;
    snapshot.remainingMs = ARCADE_DURATION_MS - elapsed;
  }
  function draft(): ArcadeDraft {
    savedEpoch = Math.max(savedEpoch, startedEpoch, epoch());
    return {
      runId: snapshot.runId!,
      slotId: snapshot.config!.slotId,
      comparisonKey: createComparisonKey(snapshot.config!),
      config: clone(snapshot.config!),
      objectives: clone(snapshot.objectives),
      elapsedMs: snapshot.elapsedMs ?? 0,
      startedEpochMs: startedEpoch,
      savedEpochMs: savedEpoch,
    };
  }
  function terminal(reason: FinishReason, save = true): ArcadeResult | null {
    if (snapshot.phase !== 'running') return snapshot.result ? clone(snapshot.result) : null;
    cancelTimer();
    const scored = snapshot.config!.mode === 'contest' && (reason === 'completed' || reason === 'timeout');
    const result: ArcadeResult = {
      runId: snapshot.runId!,
      config: clone(snapshot.config!),
      status: reason,
      eligible: scored,
      elapsedMs: snapshot.elapsedMs,
      objectives: clone(snapshot.objectives),
      score: scored
        ? calculateArcadeScore(snapshot.objectives, snapshot.elapsedMs!, ARCADE_DURATION_MS)
        : null,
      createdEpochMs: Math.max(startedEpoch, savedEpoch, epoch()),
    };
    snapshot.phase = 'finished';
    snapshot.result = result;
    const accepted = !save || repository.save(result);
    const local = repository.read();
    if (!accepted && result.config.mode === 'contest' && local.store.activeDraft?.runId !== result.runId) {
      // Another tab won the best-effort ownership check between admission and save.
      result.status = 'interrupted';
      result.eligible = false;
      result.score = null;
    }
    snapshot.persistence = local.persistence;
    notify();
    return clone(result);
  }
  function hasOwnership(): boolean {
    const repo = repository.read();
    snapshot.persistence = repo.persistence;
    if (
      snapshot.phase === 'running' &&
      snapshot.config?.mode === 'contest' &&
      repo.store.activeDraft?.runId !== snapshot.runId
    ) {
      settleClock();
      terminal('interrupted', false);
      return false;
    }
    return true;
  }
  function checkRunning(): boolean {
    if (disposed || snapshot.phase !== 'running') return false;
    if (!hasOwnership()) return false;
    settleClock();
    if (snapshot.config?.mode === 'contest' && snapshot.elapsedMs === ARCADE_DURATION_MS) {
      terminal('timeout');
      return false;
    }
    return true;
  }
  const unsubscribeRepository = repository.subscribe((repo) => {
    if (disposed) return;
    snapshot.persistence = repo.persistence;
    if (
      snapshot.phase === 'running' &&
      snapshot.config?.mode === 'contest' &&
      repo.store.activeDraft?.runId !== snapshot.runId
    ) {
      settleClock();
      terminal('interrupted', false);
    } else notify();
  });
  const session: ArcadeSession = {
    start(value) {
      if (disposed) return { ok: false, reason: 'invalid-config' };
      if (snapshot.phase === 'running') return { ok: false, reason: 'already-running' };
      let config;
      try {
        config = parseConfig(value, true);
      } catch {
        return { ok: false, reason: 'invalid-config' };
      }
      const runId = id(),
        current = clock.nowMs();
      if (!Number.isFinite(current)) return { ok: false, reason: 'invalid-config' };
      const previous = snapshot;
      startedAt = current;
      startedEpoch = Math.max(0, epoch());
      savedEpoch = startedEpoch;
      snapshot = {
        phase: 'running',
        runId,
        config,
        elapsedMs: config.mode === 'contest' ? 0 : null,
        remainingMs: config.durationMs,
        objectives: config.objectives.map((o) => ({
          ...o,
          completed: false,
          firstCorrect: false,
          usedHint: false,
        })),
        result: null,
        persistence: repository.read().persistence,
      };
      if (config.mode === 'contest') {
        const admitted = repository.begin(draft());
        if (!admitted.ok) {
          snapshot = previous;
          return admitted;
        }
      }
      revisions.clear();
      firstSubmissions.clear();
      seq = 0;
      snapshot.persistence = repository.read().persistence;
      if (config.mode === 'contest')
        timer = setInterval(() => {
          if (checkRunning()) {
            repository.checkpoint(draft());
            snapshot.persistence = repository.read().persistence;
            notify();
          }
        }, 250);
      notify();
      return { ok: true, runId };
    },
    record(facts) {
      if (!checkRunning() || !active) return false;
      if (!Array.isArray(facts)) return false;
      const ids = new Set<string>();
      for (const fact of facts as readonly DomainFact[]) {
        if (
          !fact ||
          typeof fact !== 'object' ||
          typeof fact.objectiveId !== 'string' ||
          !snapshot.objectives.some((o) => o.id === fact.objectiveId) ||
          ids.has(fact.objectiveId) ||
          !Number.isSafeInteger(fact.revision) ||
          fact.revision < 0 ||
          !['correct', 'incorrect'].includes(fact.verdict) ||
          typeof fact.usedHint !== 'boolean'
        )
          return false;
        ids.add(fact.objectiveId);
      }
      // runId and monotonic transaction seq are controller-independent and never persisted as event logs.
      seq++;
      const objectives = snapshot.objectives.map((o) => ({ ...o }));
      for (const fact of facts) {
        const objective = objectives.find((o) => o.id === fact.objectiveId)!;
        if (objective.completed || fact.revision <= (revisions.get(fact.objectiveId) ?? -1)) continue;
        revisions.set(fact.objectiveId, fact.revision);
        const first = !firstSubmissions.has(fact.objectiveId);
        firstSubmissions.add(fact.objectiveId);
        objective.usedHint = objective.usedHint || fact.usedHint;
        if (fact.verdict === 'correct') {
          objective.completed = true;
          objective.firstCorrect = first && !objective.usedHint;
        }
      }
      snapshot.objectives = objectives;
      if (objectives.every((o) => o.completed)) terminal('completed');
      else {
        if (snapshot.config?.mode === 'contest') repository.checkpoint(draft());
        snapshot.persistence = repository.read().persistence;
        notify();
      }
      return true;
    },
    finish(reason) {
      if (snapshot.phase !== 'running') return snapshot.result ? clone(snapshot.result) : null;
      if (!['completed', 'timeout', 'abandoned', 'interrupted'].includes(reason)) return null;
      if (!checkRunning()) return snapshot.result ? clone(snapshot.result) : null;
      if ((reason === 'completed' && !snapshot.objectives.every((o) => o.completed)) || reason === 'timeout')
        return null;
      return terminal(reason);
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(clone(snapshot));
      return () => listeners.delete(listener);
    },
    setActive(value) {
      if (disposed) return;
      active = value;
      checkRunning();
      notify();
    },
    dispose() {
      if (disposed) return;
      if (snapshot.phase === 'running') {
        if (checkRunning()) terminal('interrupted');
      }
      disposed = true;
      cancelTimer();
      unsubscribeRepository();
      if (!options.repository) repository.dispose();
      queueMicrotask(() => listeners.clear());
    },
  };
  return session;
}

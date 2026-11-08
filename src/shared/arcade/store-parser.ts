import {
  ARCADE_DATA_VERSION,
  ARCADE_DURATION_MS,
  ARCADE_RECORD_LIMIT,
  ARCADE_SCORING_VERSION,
} from './constants';
import { createComparisonKey, calculateArcadeScore } from './scoring';
import {
  boolean,
  integer,
  nonnegative,
  object,
  parseConfig,
  parsePreferences,
  parseProgress,
  text,
} from './validation';
import type { ArcadeDraft, ArcadeLocalStoreV1, ArcadeResult, ArcadeScore, ContestLock } from './types';

function parseComparisonKey(value: unknown): string {
  const key = text(value, 512);
  let tuple: unknown;
  try {
    tuple = JSON.parse(key);
  } catch {
    throw new RangeError('Invalid comparison key');
  }
  if (!Array.isArray(tuple) || tuple.length !== 6) throw new RangeError('Invalid comparison tuple');
  // Validate the identity through the same config contract, without inventing a route.
  const c = parseConfig({
    activityId: tuple[0],
    challengeCode: tuple[1],
    profile: tuple[2],
    contentVersion: tuple[3],
    scoringVersion: tuple[4],
    durationMs: tuple[5],
    mode: tuple[5] === null ? 'practice' : 'contest',
    slotId: 'validation',
    nickname: '实验员',
    objectives: [{ id: 'validation', weight: 1000 }],
  });
  if (c.mode !== 'contest' || key !== createComparisonKey(c)) throw new RangeError('Noncontest lock key');
  return key;
}
export function parseDraft(value: unknown): ArcadeDraft {
  const d = object(value),
    config = parseConfig(d.config),
    slotId = text(d.slotId);
  const elapsedMs = nonnegative(d.elapsedMs),
    startedEpochMs = nonnegative(d.startedEpochMs),
    savedEpochMs = nonnegative(d.savedEpochMs);
  if (
    config.mode !== 'contest' ||
    slotId !== config.slotId ||
    d.comparisonKey !== createComparisonKey(config) ||
    elapsedMs > ARCADE_DURATION_MS ||
    savedEpochMs < startedEpochMs
  )
    throw new RangeError('Invalid active draft');
  return {
    runId: text(d.runId),
    slotId,
    comparisonKey: parseComparisonKey(d.comparisonKey),
    config,
    objectives: parseProgress(d.objectives, config.objectives),
    elapsedMs,
    startedEpochMs,
    savedEpochMs,
  };
}
export function parseLock(value: unknown): ContestLock {
  const l = object(value);
  return {
    slotId: text(l.slotId),
    comparisonKey: parseComparisonKey(l.comparisonKey),
    runId: text(l.runId),
    createdEpochMs: nonnegative(l.createdEpochMs),
  };
}
function parseScore(value: unknown): ArcadeScore {
  const s = object(value),
    progress = integer(s.progress),
    quality = integer(s.quality),
    efficiency = integer(s.efficiency),
    total = integer(s.total);
  if (
    progress > 700 ||
    quality > 200 ||
    efficiency > 100 ||
    total !== progress + quality + efficiency ||
    total > 1000
  )
    throw new RangeError('Invalid score');
  return { progress, quality, efficiency, total };
}
export function parseResult(value: unknown): ArcadeResult {
  const r = object(value),
    config = parseConfig(r.config),
    objectives = parseProgress(r.objectives, config.objectives),
    eligible = boolean(r.eligible);
  if (!['completed', 'timeout', 'abandoned', 'interrupted'].includes(r.status as string))
    throw new RangeError('Invalid result status');
  const scored = config.mode === 'contest' && (r.status === 'completed' || r.status === 'timeout');
  const elapsedMs = config.mode === 'practice' ? null : nonnegative(r.elapsedMs);
  if (
    (config.mode === 'practice' && r.elapsedMs !== null) ||
    (elapsedMs !== null && elapsedMs > ARCADE_DURATION_MS)
  )
    throw new RangeError('Invalid result elapsed');
  if (
    (r.status === 'completed' &&
      (!objectives.every((o) => o.completed) || elapsedMs === ARCADE_DURATION_MS)) ||
    (r.status === 'timeout' &&
      (config.mode !== 'contest' || elapsedMs !== ARCADE_DURATION_MS || objectives.every((o) => o.completed)))
  )
    throw new RangeError('Invalid terminal progress');
  let score: ArcadeScore | null = null;
  if (scored) {
    score = parseScore(r.score);
    if (
      config.scoringVersion === ARCADE_SCORING_VERSION &&
      JSON.stringify(score) !==
        JSON.stringify(calculateArcadeScore(objectives, elapsedMs!, ARCADE_DURATION_MS))
    )
      throw new RangeError('Forged score');
  } else if (r.score !== null || eligible) throw new RangeError('Ineligible observation has score');
  return {
    runId: text(r.runId),
    config,
    status: r.status as ArcadeResult['status'],
    eligible,
    elapsedMs,
    objectives,
    score,
    createdEpochMs: nonnegative(r.createdEpochMs),
  };
}
export function parseStore(value: unknown): { store: ArcadeLocalStoreV1; droppedResults: number } {
  const raw = object(value);
  if (
    raw.schemaVersion !== 1 ||
    raw.dataVersion !== ARCADE_DATA_VERSION ||
    !Array.isArray(raw.contestLocks) ||
    !Array.isArray(raw.results) ||
    raw.contestLocks.length > ARCADE_RECORD_LIMIT ||
    raw.results.length > ARCADE_RECORD_LIMIT
  )
    throw new RangeError('Invalid store envelope');
  const contestLocks = raw.contestLocks.map(parseLock),
    lockIdentities = new Set<string>(),
    lockRuns = new Set<string>();
  for (const lock of contestLocks) {
    const identity = JSON.stringify([lock.slotId, lock.comparisonKey]);
    if (lockIdentities.has(identity) || lockRuns.has(lock.runId))
      throw new RangeError('Duplicate contest lock');
    lockIdentities.add(identity);
    lockRuns.add(lock.runId);
  }
  const activeDraft = raw.activeDraft === null ? null : parseDraft(raw.activeDraft);
  if (
    activeDraft &&
    !contestLocks.some(
      (l) =>
        l.runId === activeDraft.runId &&
        l.slotId === activeDraft.slotId &&
        l.comparisonKey === activeDraft.comparisonKey,
    )
  )
    throw new RangeError('Unowned active draft');
  let droppedResults = 0;
  const results: ArcadeResult[] = [],
    runs = new Set<string>();
  for (const rawResult of raw.results) {
    try {
      const result = parseResult(rawResult);
      if (runs.has(result.runId) || activeDraft?.runId === result.runId)
        throw new RangeError('Duplicate/active result');
      if (
        result.config.mode === 'contest' &&
        !contestLocks.some(
          (l) =>
            l.runId === result.runId &&
            l.slotId === result.config.slotId &&
            l.comparisonKey === createComparisonKey(result.config),
        )
      )
        throw new RangeError('Unowned contest result');
      runs.add(result.runId);
      results.push(result);
    } catch {
      droppedResults++;
    }
  }
  return {
    store: {
      schemaVersion: 1,
      dataVersion: ARCADE_DATA_VERSION,
      revision: integer(raw.revision),
      preferences: parsePreferences(raw.preferences),
      activeDraft,
      contestLocks,
      results,
    },
    droppedResults,
  };
}

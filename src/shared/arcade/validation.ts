import {
  ARCADE_CONTENT_VERSION,
  ARCADE_SCORING_VERSION,
  ARCADE_DURATION_MS,
  ARCADE_TOTAL_WEIGHT,
} from './constants';
import { parseChallengeCode } from './challenge-code';
import type { ArcadePreferences, ArcadeRunConfig, ObjectiveProgress } from './types';

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new RangeError('Expected object');
  return value as Record<string, unknown>;
}
export function text(value: unknown, max = 64): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    [...value].length > max ||
    /[\p{Cc}\p{Cf}]/u.test(value)
  )
    throw new RangeError('Invalid bounded text');
  return value;
}
export function nonnegative(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
    throw new RangeError('Invalid nonnegative number');
  return value;
}
export function integer(value: unknown): number {
  const n = nonnegative(value);
  if (!Number.isSafeInteger(n)) throw new RangeError('Invalid integer');
  return n;
}
export function boolean(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new RangeError('Invalid boolean');
  return value;
}
export function sanitizeNickname(value: string): string {
  return [...value.replace(/[\p{Cc}\p{Cf}]/gu, '').trim()].slice(0, 12).join('') || '实验员';
}
export function parsePreferences(value: unknown): ArcadePreferences {
  const p = object(value);
  const nickname = text(p.nickname, 12);
  if (nickname !== sanitizeNickname(nickname) || !['guided', 'standard'].includes(p.profile as string))
    throw new RangeError('Invalid preferences');
  const parsed = p.lastChallengeCode === null ? null : parseChallengeCode(p.lastChallengeCode as string);
  if (p.lastChallengeCode !== null && (!parsed || parsed.code !== p.lastChallengeCode))
    throw new RangeError('Invalid preferred challenge');
  return {
    slotId: text(p.slotId),
    nickname,
    profile: p.profile as ArcadePreferences['profile'],
    lastChallengeCode: parsed?.code ?? null,
    soundEnabled: boolean(p.soundEnabled),
  };
}
export function parseDefinitions(value: unknown): { id: string; weight: number }[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 1000)
    throw new RangeError('Invalid objectives');
  const ids = new Set<string>();
  const definitions = value.map((raw) => {
    const o = object(raw);
    const id = text(o.id);
    const weight = integer(o.weight);
    if (!weight || weight > ARCADE_TOTAL_WEIGHT || ids.has(id))
      throw new RangeError('Invalid objective weights/identity');
    ids.add(id);
    return { id, weight };
  });
  if (definitions.reduce((sum, o) => sum + o.weight, 0) !== ARCADE_TOTAL_WEIGHT)
    throw new RangeError('Objective weights must total 1000');
  return definitions;
}
export function parseConfig(value: unknown, currentVersions = false): ArcadeRunConfig {
  const c = object(value);
  if (
    !['history-lab', 'structure-lab', 'sensor-lab'].includes(c.activityId as string) ||
    !['practice', 'contest'].includes(c.mode as string) ||
    !['guided', 'standard'].includes(c.profile as string)
  )
    throw new RangeError('Invalid config identity');
  const challenge = parseChallengeCode(c.challengeCode as string);
  if (!challenge || challenge.code !== c.challengeCode || challenge.profile !== c.profile)
    throw new RangeError('Challenge/profile mismatch');
  if (c.durationMs !== (c.mode === 'contest' ? ARCADE_DURATION_MS : null))
    throw new RangeError('Mode/duration mismatch');
  const contentVersion = text(c.contentVersion);
  const scoringVersion = text(c.scoringVersion);
  if (
    !/^science-arcade-content-[1-9][0-9]*$/.test(contentVersion) ||
    !/^science-arcade-score-[1-9][0-9]*$/.test(scoringVersion) ||
    (currentVersions &&
      (contentVersion !== ARCADE_CONTENT_VERSION || scoringVersion !== ARCADE_SCORING_VERSION))
  )
    throw new RangeError('Invalid versions');
  const nickname = text(c.nickname, 12);
  if (nickname !== sanitizeNickname(nickname)) throw new RangeError('Invalid nickname');
  return {
    activityId: c.activityId as ArcadeRunConfig['activityId'],
    mode: c.mode as ArcadeRunConfig['mode'],
    profile: challenge.profile,
    challengeCode: challenge.code,
    contentVersion,
    scoringVersion,
    durationMs: c.durationMs as ArcadeRunConfig['durationMs'],
    slotId: text(c.slotId),
    nickname,
    objectives: parseDefinitions(c.objectives),
  };
}
export function parseProgress(
  value: unknown,
  definitions?: ArcadeRunConfig['objectives'],
): ObjectiveProgress[] {
  const items = parseDefinitions(value);
  return items.map((definition, i) => {
    const o = object((value as unknown[])[i]);
    const completed = boolean(o.completed),
      firstCorrect = boolean(o.firstCorrect),
      usedHint = boolean(o.usedHint);
    if (firstCorrect && (!completed || usedHint)) throw new RangeError('Impossible first-correct objective');
    if (
      definitions &&
      (definitions.length !== items.length ||
        definitions[i].id !== definition.id ||
        definitions[i].weight !== definition.weight)
    )
      throw new RangeError('Progress/config mismatch');
    return { ...definition, completed, firstCorrect, usedHint };
  });
}
export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
export function createArcadeId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  // Identity only: this fallback never seeds challenge content or scoring.
  return `local-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
